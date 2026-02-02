import { auth } from "../lib/firebase.js";


export const createFirebaseAccount = async (email:string, password:string) =>{ 
    return await auth.createUser({email:email, password:password});
};

export const verifyFirebaseToken = async (token:string)=>{
    try {
        return await auth.verifyIdToken(token);
    } catch (error) {
        return null
    }
}