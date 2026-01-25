import { auth } from "firebase-admin";
import { createFirebaseAccount } from "../../services/firebase.service.js";
import { createDbUser } from "../../services/user.service.js";
import type { RegisterBodyType } from "./auth.schema.js";


export const registerUserWorkflow = async (data: RegisterBodyType) => {
  // Create in Firebase
  const firebaseUser = await createFirebaseAccount(data.email, data.password);

  try {
    // Create in Prisma DB
    return await createDbUser(firebaseUser.uid, data.email, data.firstName||"", data.lastName||"", data.role);
  } catch (error) {
    // CRITICAL - If DB fails, delete the Firebase user 
    // so they can try again and we don't have mismatched data.
    await auth().deleteUser(firebaseUser.uid);
    throw new Error("Failed to sync user to CynoGuard database.");
  }
};