import { auth } from "firebase-admin";
import { createFirebaseAccount } from "../../services/firebase.service.js";
import { createDbUser, getUserByEmail } from "../../services/user.service.js";
import type { RegisterBodyType } from "./auth.schema.js";
import { loginUserWorkflow } from "./auth.service.js";


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

// Login function using OAuth
export const socialLoginWorkFlow = async (idToken: string ) => {
  // verify the token sent by frontend
  const decodedToken = await auth().verifyIdToken(idToken);
  const { email, uid } = decodedToken;

  // check if user exists in the database
  let user = await getUserByEmail(email!);

  // if user does not exist, create a new user in the database
  if (!user) {
    user = await createDbUser(
      uid,
      email!,
      decodedToken.name || "Social User",
      "",
      "MEMEBER" // default role
    );
  }
  
  return {
    uid: uid,
    email: user.email,
    role: user.role,
  };
};