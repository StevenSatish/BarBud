import React, { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { Text } from '@/components/ui/text';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { useTheme } from '@/app/context/ThemeContext';
import useExerciseDB from '@/app/context/ExerciseDBContext';
import { ArrowUp } from 'lucide-react-native';
import { doc, setDoc} from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '@/FirebaseConfig';
import useTemplateFolders from '../context/TemplateFoldersContext';

export default function Chat() {
  const { theme, colors } = useTheme();
  const { exerciseSections } = useExerciseDB();
  type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string };
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'intro',
      role: 'assistant',
      text: `Hi! I'm Bud, your workout assistant. I like talking about working out and not much else. I can also create custom workout 
templates for you that'll appear in the 'Workout' tab.`,
    },
  ]);
  const scrollRef = useRef<ScrollView | null>(null);
  const inputRef = useRef<any>(null);
  const [templateWaiting, setTemplateWaiting] = useState(false);
  const { fetchFolders, fetchTemplates } = useTemplateFolders();

  // Prefer config-injected key; fall back to env (web/dev)
  const apiKey =
    process.env.EXPO_PUBLIC_OPENAI_API_KEY ||
    (Constants.expoConfig?.extra as any)?.openaiApiKey ||
    (Constants as any).manifest2?.extra?.openaiApiKey ||
    (Constants as any).manifest?.extra?.openaiApiKey ||
    process.env.OPENAI_API_KEY ||
    '';

  const safeStringify = (value: unknown) => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const flattenExercises = () => {
    const flat: { exerciseId: string; name: string; category: string; muscleGroup?: string }[] = [];
    exerciseSections.forEach((section) => {
      section.data.forEach((ex: any) => {
        const exerciseId = ex.exerciseId || ex.id;
        const name = ex.name;
        const category = ex.category;
        if (exerciseId && name && category) {
          flat.push({
            exerciseId,
            name,
            category,
            muscleGroup: ex.muscleGroup,
          });
        }
      });
    });
    return flat;
  };

  const filterExercisesForQuery = (query: string) => {
    const MAX = 30;
    const flat = flattenExercises();
    const q = query.toLowerCase();
    const filtered = flat.filter((ex) => {
      const name = ex.name?.toLowerCase() || '';
      const category = ex.category?.toLowerCase() || '';
      return name.includes(q) || category.includes(q);
    });
    const result = (filtered.length ? filtered : flat).slice(0, MAX);
    return result;
  };

  const parseTemplateJson = (text: string) => {
    const cleaned = text.replace(/^Template:\s*/i, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed;
  };

  const saveTemplate = async (template: any) => {
    const user = FIREBASE_AUTH.currentUser;
    if (!user?.uid) {
      console.error('No authenticated user; cannot save template.');
      return;
    }

    const templateName = typeof template?.templateName === 'string' ? template.templateName.trim() : '';
    if (!templateName) {
      console.error('Template missing templateName; skipping save.');
      return;
    }

    const exercises = Array.isArray(template?.exercises) ? template.exercises : [];
    const safeExercises = exercises
      .map((ex: any) => ({
        exerciseId: ex?.exerciseId,
        name: ex?.name,
        category: ex?.category,
        numSets: ex?.numSets ?? 1,
      }))
      .filter((ex: any) => ex.exerciseId && ex.name && ex.category);

    const safeFolderId = 'none';
    const slug = templateName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
    const templateId = slug || 'template';

    await setDoc(
      doc(FIREBASE_DB, 'users', user.uid, 'folders', safeFolderId, 'templates', templateId),
      {
        templateName,
        exercises: safeExercises,
      },
    );

    console.log('Template written to Firestore:', templateName);

    try {
        const latestFolders = await fetchFolders();
        await fetchTemplates(latestFolders);
    } catch (err) {
      console.error('Failed to refresh templates after write', err);
    }
  };

  const client = useMemo(() => {
    if (!apiKey) return null;
    return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }, [apiKey]);

  const systemPrompt = useMemo(
    () =>
      `You are Bud, a friendly and enthusiastic workout assistant for a workout tracking app. Answer only questions about lifting, training, recovery,
        or making workout templates. Also respond to greetings and goodbyes.If asked about anything else, 
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
4) If you cannot create a template, return a short error message.`,
    [],
  );

  const templateSchemaHint =
    'Template schema: { templateName: string; exercises: [{ exerciseId: string; name: string; category: string; numSets: number }] }. Always use provided exerciseId/name/category exactly as given.';

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    if (!client || !apiKey) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', text: 'Missing API key.' },
      ]);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
    };

    const historyForApi: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: templateSchemaHint },
      ...messages.map((m) => ({ role: m.role, content: m.text })),
      { role: 'user', content: trimmed },
    ];

    setSending(true);
    setTemplateWaiting(false);
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const completion = await client.chat.completions.create({
        model: 'gpt-5-mini',
        messages: historyForApi,
        // max_completion_tokens: 400,
        presence_penalty: 0,
        n: 1,
        stream: false,
      });

      // Debug: log the full completion in case content is empty
      console.log('OpenAI completion response:', safeStringify(completion));

      const reply = completion?.choices?.[0]?.message?.content?.trim() || '';
      const sentinel = 'Creating template, supply exercises';

      if (reply.trim() === sentinel) {
        setTemplateWaiting(true);
        const exercisesForModel = filterExercisesForQuery(trimmed);
        const followupMessages: ChatCompletionMessageParam[] = [
          { role: 'system', content: systemPrompt },
          { role: 'system', content: templateSchemaHint },
          {
            role: 'system',
            content:
              'You already asked for exercises and received them. Do NOT repeat "Creating template, supply exercises". Now respond with exactly one message starting with "Template:" followed by the strict JSON schema. If you cannot, return a short error.',
          },
          ...(exercisesForModel.length
            ? [
                {
                  role: 'system',
                  content: `Exercise catalog (capped at ${exercisesForModel.length}): ${safeStringify(
                    exercisesForModel,
                  )}`,
                } as const,
              ]
            : [
                {
                  role: 'system',
                  content:
                    'No exercises were found to build a template. Ask the user to add exercises first or try a different query.',
                } as const,
              ]),
          ...messages.map((m) => ({ role: m.role, content: m.text })),
          { role: 'user', content: trimmed },
        ];

        const followup = await client.chat.completions.create({
          model: 'gpt-5-mini',
          messages: followupMessages,
          presence_penalty: 0,
          n: 1,
          stream: false,
        });

        console.log('OpenAI followup completion:', safeStringify(followup));

        const templateReply =
          followup?.choices?.[0]?.message?.content?.trim() ||
          'Sorry, I only like to talk about working out.';

        console.log('Template reply:', templateReply);

        if (templateReply.trim() === 'Creating template, supply exercises') {
          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-assistant`,
              role: 'assistant',
              text: 'Sorry, I could not create that template. Please try again.',
            },
          ]);
        } else {
          try {
            const parsed = parseTemplateJson(templateReply);
            await saveTemplate(parsed);
          } catch (err) {
            console.error('Failed to parse/save template JSON', err);
            setMessages((prev) => [
              ...prev,
              {
                id: `${Date.now()}-assistant`,
                role: 'assistant',
                text: 'Sorry, I could not create that template. Please try again.',
              },
            ]);
            setTemplateWaiting(false);
            return;
          }
          setMessages((prev) => [
            ...prev,
            { id: `${Date.now()}-assistant`, role: 'assistant', text: 'Template created! Go check it out.' },
          ]);
        }
        setTemplateWaiting(false);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-assistant`,
            role: 'assistant',
            text: reply || 'Sorry, I only like to talk about working out.',
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          text: 'Something went wrong sending that message.',
        },
      ]);
      console.error('Chat send error', err);
    } finally {
      setSending(false);
      setTemplateWaiting(false);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  };

  const handleSubmit = () => {
    sendMessage();
    inputRef.current?.focus?.();
  };

  return (
    <SafeAreaView className={`flex-1 bg-${theme}-background`}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 px-4 pt-2">
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ paddingVertical: 12, gap: 10 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              scrollRef.current?.scrollToEnd({ animated: true });
            }}
            keyboardDismissMode="on-drag"
          >
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <View
                  key={m.id}
                  className={`flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <View
                    className={`max-w-[85%] rounded-2xl px-4 py-3 border ${
                      isUser
                        ? `bg-${theme}-light border-transparent`
                        : 'border-outline-200'
                    }`}
                    style={!isUser ? { backgroundColor: colors.tab } : undefined}
                  >
                    <Text
                      className={
                        isUser ? `text-${theme}-background` : 'text-typography-800'
                      }
                    >
                      {m.text}
                    </Text>
                  </View>
                </View>
              );
            })}

            {(sending || templateWaiting) && (
              <View className="flex-row justify-start">
                <View
                  className="max-w-[85%] rounded-2xl px-4 py-3 border border-outline-200 flex-row items-center gap-2"
                  style={{ backgroundColor: colors.tab }}
                >
                  <Spinner />
                  {templateWaiting && (
                    <Text className="text-typography-700">Creating template</Text>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        <View className="px-4 pb-4">
          <HStack className="items-center gap-2">
            <Textarea
              variant="default"
              size="sm"
              className="flex-1 border-outline-200 rounded-xl"
            >
              <TextareaInput
                multiline
                numberOfLines={1}
                scrollEnabled={false}
                placeholder="Send a message..."
                placeholderTextColor={colors.lightGray}
                className="text-md"
                ref={inputRef}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSubmit}
                editable={!sending}
                returnKeyType="send"
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 50);
                }}
              />
            </Textarea>
            <Button
              size="lg"
              variant="solid"
              className={`rounded-full bg-${theme}-light`}
              onPress={handleSubmit}
              isDisabled={sending || !input.trim()}
            >
              <ButtonText className={`text-${theme}-background text-base`}>
                <ButtonIcon as={ArrowUp} />
              </ButtonText>
            </Button>
          </HStack>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
