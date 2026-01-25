import { auth } from "../lib/firebase.js";


export const createFirebaseAccount = async (email:string, password:string) =>{ 
    return await auth.createUser({email:email, password:password});
};