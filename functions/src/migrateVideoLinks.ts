import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import videoLinks from "./videoLinks.json";

const db = admin.firestore();

/**
 * One-time migration:
 * 1. Writes videoLink from videoLinks.json into presetExercises/{exerciseId}
 * 2. Copies videoLink from presetExercises to all users' exercises
 *
 * Deploy: firebase deploy --only functions:migrateVideoLinks
 * Trigger: Visit the function URL in your browser or curl it once
 */
export const migrateVideoLinks = onRequest(async (req: any, res: any) => {
  try {
    const linkEntries = Object.entries(videoLinks as Record<string, string>)
      .filter(([, link]) => link.length > 0);

    console.log(`Found ${linkEntries.length} video links to migrate`);

    // Step 1: Write videoLinks into presetExercises
    const presetBatch = db.batch();
    for (const [exerciseId, videoLink] of linkEntries) {
      const ref = db.collection("presetExercises").doc(exerciseId);
      presetBatch.update(ref, { videoLink });
    }
    await presetBatch.commit();
    console.log(`Updated ${linkEntries.length} presetExercises with videoLinks`);

    // Build lookup map for step 2
    const videoLinkMap: Record<string, string> = {};
    for (const [exerciseId, videoLink] of linkEntries) {
      videoLinkMap[exerciseId] = videoLink;
    }

    // Step 2: Copy videoLinks to all users' exercises
    const usersSnap = await db.collection("users").get();
    console.log(`Found ${usersSnap.size} users`);

    let totalUpdated = 0;

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const exercisesRef = db.collection("users").doc(uid).collection("exercises");
      const exercisesSnap = await exercisesRef.get();

      const batch = db.batch();
      let batchCount = 0;

      for (const exerciseDoc of exercisesSnap.docs) {
        const exerciseId = exerciseDoc.id;
        const videoLink = videoLinkMap[exerciseId];

        if (videoLink && !exerciseDoc.data().videoLink) {
          batch.update(exerciseDoc.ref, { videoLink });
          batchCount++;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
        totalUpdated += batchCount;
        console.log(`Updated ${batchCount} exercises for user ${uid}`);
      }
    }

    res.status(200).send(
      `Migration complete.\n` +
      `- Updated ${linkEntries.length} presetExercises\n` +
      `- Updated ${totalUpdated} user exercises across ${usersSnap.size} users`
    );
  } catch (error) {
    console.error("Migration failed:", error);
    res.status(500).send(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
  }
});
