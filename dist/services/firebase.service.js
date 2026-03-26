import { auth } from "../lib/firebase.js";
export const createFirebaseAccount = async (email, password) => {
    return await auth.createUser({ email: email, password: password });
};
export const verifyFirebaseToken = async (token) => {
    try {
        return await auth.verifyIdToken(token);
    }
    catch (error) {
        return null;
    }
};
