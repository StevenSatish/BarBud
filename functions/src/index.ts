import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

admin.initializeApp();

export const deleteMyAccount = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }

  const db = admin.firestore();
  const userRef = db.doc(`users/${uid}`);

  // Read username if you store it on the user doc (optional)
  const snap = await userRef.get();
  const username = snap.exists ? (snap.get("username") as string | undefined) : undefined;

  // Delete user doc + all subcollections
  await db.recursiveDelete(userRef);

  // Delete Firebase Auth user
  await admin.auth().deleteUser(uid);

  return { ok: true };
});
