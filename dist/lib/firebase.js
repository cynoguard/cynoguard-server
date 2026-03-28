import admin from "firebase-admin";
import "dotenv/config";
const APP_NAME = "cynoguard-admin";
const readRequiredEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`[Firebase] Missing required env variable: ${name}`);
    }
    return value;
};
const normalizePrivateKey = () => {
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;
    const base64Key = process.env.FIREBASE_PRIVATE_KEY_BASE64;
    if (rawKey) {
        return rawKey.replace(/\\n/g, "\n");
    }
    if (base64Key) {
        const decoded = Buffer.from(base64Key, "base64").toString("utf8").trim();
        if (!decoded.includes("BEGIN PRIVATE KEY")) {
            throw new Error("[Firebase] FIREBASE_PRIVATE_KEY_BASE64 is set but invalid");
        }
        return decoded;
    }
    throw new Error("[Firebase] Missing private key. Set FIREBASE_PRIVATE_KEY (with \\n) or FIREBASE_PRIVATE_KEY_BASE64");
};
const firebaseAdmin = admin.apps.find(a => a?.name === APP_NAME)
    ?? admin.initializeApp({
        credential: admin.credential.cert({
            projectId: readRequiredEnv("FIREBASE_PROJECT_ID"),
            clientEmail: readRequiredEnv("FIREBASE_CLIENT_EMAIL"),
            privateKey: normalizePrivateKey(),
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
    ? "✅ present"
    : cred?.certificate?.privateKey
        ? `✅ present`
        : "❌ missing");
console.log("Apps count:   ", admin.apps.length);
