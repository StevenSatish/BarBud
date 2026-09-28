import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const openaiApiKey = defineSecret("OPENAI_API_KEY");

/** Change these to tune "x messages in y time". */
export const CHAT_RATE_LIMIT_MAX = 20;
export const CHAT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

const MAX_USER_MESSAGE_CHARS = 2000;
const MAX_HISTORY_MESSAGES = 16;
const MAX_HISTORY_MESSAGE_CHARS = 2000;
const MAX_CATALOG_ITEMS = 30;
const OPENAI_MODEL = "gpt-5-mini";
const OPENAI_TIMEOUT_MS = 45_000;

const SYSTEM_PROMPT = `You are Bud, a friendly and enthusiastic workout assistant for a workout tracking app. Answer only questions about lifting, training, recovery,
        or making workout templates. Also respond to greetings and goodbyes. If asked about anything else, 
       respond with "Sorry, I only like to talk about working out." Keep replies very concise. Be friendly and engaging, but not too chatty.
       If a user asks to create multiple templates at once, respond with "Sorry, I can only create one template at a time."

When the user asks for a workout template or plan, follow this exact protocol:
1) If the user asks for specific exercises in their template, thoroughly search the names and exerciseIds of the exercises in the exercise catalog 
to find the best matches, it doesn't need to be an exact match.
2) First reply with exactly: "Creating template, supply exercises" and nothing else.
3) After you are given an exercise catalog, start out with heavy compound lifts, then move on to accessories and isolation exercises, with no more than 3 sets per exercise.
Do not include any exercises that are deemed unoptimal for muscle building or are not typically used in bodybuilding.
then reply with exactly one message starting with "Template:" followed by strict JSON matching: 
{ templateName: string; exercises: [{ exerciseId: string; name: string; category: string; numSets: number }] }.
4) If you cannot create a template, return a short error message.`;

const TEMPLATE_SCHEMA_HINT =
  "Template schema: { templateName: string; exercises: [{ exerciseId: string; name: string; category: string; numSets: number }] }. Always use provided exerciseId/name/category exactly as given.";

const TEMPLATE_SENTINEL = "Creating template, supply exercises";

type ChatRole = "user" | "assistant";

type HistoryItem = {
  role?: unknown;
  text?: unknown;
};

type CatalogItem = {
  exerciseId?: unknown;
  name?: unknown;
  category?: unknown;
  muscleGroup?: unknown;
};

type ChatRequestData = {
  userMessage?: unknown;
  history?: unknown;
  exerciseCatalog?: unknown;
};

function asTrimmedString(value: unknown, maxChars: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxChars);
}

function sanitizeHistory(raw: unknown): { role: ChatRole; text: string }[] {
  if (!Array.isArray(raw)) return [];
  const items: { role: ChatRole; text: string }[] = [];
  for (const entry of raw as HistoryItem[]) {
    const role = entry?.role === "assistant" ? "assistant" : entry?.role === "user" ? "user" : null;
    const text = asTrimmedString(entry?.text, MAX_HISTORY_MESSAGE_CHARS);
    if (!role || !text) continue;
    items.push({ role, text });
    if (items.length >= MAX_HISTORY_MESSAGES) break;
  }
  return items;
}

function sanitizeCatalog(raw: unknown): {
  exerciseId: string;
  name: string;
  category: string;
  muscleGroup?: string;
}[] {
  if (!Array.isArray(raw)) return [];
  const items: {
    exerciseId: string;
    name: string;
    category: string;
    muscleGroup?: string;
  }[] = [];
  for (const entry of raw as CatalogItem[]) {
    const exerciseId = asTrimmedString(entry?.exerciseId, 120);
    const name = asTrimmedString(entry?.name, 120);
    const category = asTrimmedString(entry?.category, 80);
    if (!exerciseId || !name || !category) continue;
    const muscleGroup = asTrimmedString(entry?.muscleGroup, 80) || undefined;
    items.push({ exerciseId, name, category, ...(muscleGroup ? { muscleGroup } : {}) });
    if (items.length >= MAX_CATALOG_ITEMS) break;
  }
  return items;
}

async function enforceRateLimit(uid: string): Promise<void> {
  const ref = admin.firestore().doc(`chatRateLimits/${uid}`);
  await admin.firestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const data = snap.data() ?? {};
    const storedStart = data.windowStart;
    let windowStart =
      storedStart && typeof storedStart.toMillis === "function" ? storedStart.toMillis() : now;
    let count = typeof data.count === "number" ? data.count : 0;

    if (now - windowStart >= CHAT_RATE_LIMIT_WINDOW_MS) {
      windowStart = now;
      count = 0;
    }

    if (count >= CHAT_RATE_LIMIT_MAX) {
      const retryMinutes = Math.max(
        1,
        Math.ceil((CHAT_RATE_LIMIT_WINDOW_MS - (now - windowStart)) / 60000),
      );
      throw new HttpsError(
        "resource-exhausted",
        `Too many messages. Try again in about ${retryMinutes} minute${retryMinutes === 1 ? "" : "s"}.`,
      );
    }

    tx.set(ref, {
      windowStart: admin.firestore.Timestamp.fromMillis(windowStart),
      count: count + 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

function parseTemplateJson(text: string): {
  templateName: string;
  exercises: { exerciseId: string; name: string; category: string; numSets: number }[];
} {
  const cleaned = text.replace(/^Template:\s*/i, "").trim();
  const parsed = JSON.parse(cleaned) as {
    templateName?: unknown;
    exercises?: unknown;
  };
  const templateName = asTrimmedString(parsed?.templateName, 80);
  if (!templateName) {
    throw new Error("Missing templateName");
  }
  const exercises = Array.isArray(parsed?.exercises) ? parsed.exercises : [];
  const safeExercises = exercises
    .map((ex: { exerciseId?: unknown; name?: unknown; category?: unknown; numSets?: unknown }) => ({
      exerciseId: asTrimmedString(ex?.exerciseId, 120),
      name: asTrimmedString(ex?.name, 120),
      category: asTrimmedString(ex?.category, 80),
      numSets: typeof ex?.numSets === "number" && ex.numSets > 0 ? Math.min(Math.floor(ex.numSets), 8) : 1,
    }))
    .filter((ex) => ex.exerciseId && ex.name && ex.category);
  if (!safeExercises.length) {
    throw new Error("No valid exercises");
  }
  return { templateName, exercises: safeExercises };
}

async function complete(
  client: OpenAI,
  messages: ChatCompletionMessageParam[],
): Promise<string> {
  const completion = await client.chat.completions.create(
    {
      model: OPENAI_MODEL,
      messages,
      presence_penalty: 0,
      n: 1,
      stream: false,
    },
    { timeout: OPENAI_TIMEOUT_MS },
  );
  return completion?.choices?.[0]?.message?.content?.trim() || "";
}

export const chatCompletion = onCall(
  {
    secrets: [openaiApiKey],
    timeoutSeconds: 60,
    memory: "256MiB",
    maxInstances: 10,
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Sign in required.");
    }

    const data = (request.data ?? {}) as ChatRequestData;
    const userMessage = asTrimmedString(data.userMessage, MAX_USER_MESSAGE_CHARS);
    if (!userMessage) {
      throw new HttpsError("invalid-argument", "Message is empty.");
    }

    const history = sanitizeHistory(data.history);
    const exerciseCatalog = sanitizeCatalog(data.exerciseCatalog);

    await enforceRateLimit(uid);

    const apiKey = openaiApiKey.value();
    if (!apiKey) {
      throw new HttpsError("failed-precondition", "Chat is not configured.");
    }

    const client = new OpenAI({ apiKey });
    const baseMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: TEMPLATE_SCHEMA_HINT },
      ...history.map((m) => ({ role: m.role, content: m.text }) as ChatCompletionMessageParam),
      { role: "user", content: userMessage },
    ];

    let reply: string;
    try {
      reply = await complete(client, baseMessages);
    } catch (err) {
      console.error("OpenAI chat error", err);
      throw new HttpsError("internal", "Something went wrong sending that message.");
    }

    if (reply.trim() !== TEMPLATE_SENTINEL) {
      return {
        kind: "message" as const,
        text: reply || "Sorry, I only like to talk about working out.",
      };
    }

    const followupMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: TEMPLATE_SCHEMA_HINT },
      {
        role: "system",
        content:
          'You already asked for exercises and received them. Do NOT repeat "Creating template, supply exercises". Now respond with exactly one message starting with "Template:" followed by the strict JSON schema. If you cannot, return a short error.',
      },
      exerciseCatalog.length
        ? {
            role: "system",
            content: `Exercise catalog (capped at ${exerciseCatalog.length}): ${JSON.stringify(
              exerciseCatalog,
            )}`,
          }
        : {
            role: "system",
            content:
              "No exercises were found to build a template. Ask the user to add exercises first or try a different query.",
          },
      ...history.map((m) => ({ role: m.role, content: m.text }) as ChatCompletionMessageParam),
      { role: "user", content: userMessage },
    ];

    let templateReply: string;
    try {
      templateReply = await complete(client, followupMessages);
    } catch (err) {
      console.error("OpenAI template error", err);
      throw new HttpsError("internal", "Something went wrong sending that message.");
    }

    if (templateReply.trim() === TEMPLATE_SENTINEL) {
      return {
        kind: "message" as const,
        text: "Sorry, I could not create that template. Please try again.",
      };
    }

    try {
      const template = parseTemplateJson(templateReply);
      return { kind: "template" as const, template };
    } catch (err) {
      console.error("Failed to parse template JSON", err);
      return {
        kind: "message" as const,
        text: "Sorry, I could not create that template. Please try again.",
      };
    }
  },
);
