import admin from "firebase-admin";
const APP_NAME = "cynoguard-admin";
const firebaseAdmin = admin.apps.find(a => a?.name === APP_NAME)
    ?? admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
    }, APP_NAME);
export const auth = firebaseAdmin.auth();
export default firebaseAdmin;
// ── Initialization check ──────────────────────────────
const cred = firebaseAdmin.options.credential;
console.log("=== FIREBASE ADMIN ===");
console.log("App name:     ", firebaseAdmin.name);
console.log("Project ID:   ", firebaseAdmin.options.projectId ?? cred?.projectId ?? "❌ undefined");
console.log("Client email: ", cred?.clientEmail ?? cred?.certificate?.clientEmail ?? "❌ undefined");
console.log("Private key:  ", cred?.privateKey
    ? `✅ present (${cred.privateKey.substring(0, 40)}...)`
    : cred?.certificate?.privateKey
        ? `✅ present`
        : "❌ missing");
console.log("Apps count:   ", admin.apps.length);
