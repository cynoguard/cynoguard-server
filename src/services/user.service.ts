import { prisma } from "../plugins/prisma.js";

export const createDbUser = async (firebaseId: string, email: string,firstName:string|"",lastName:string|"",role:string) => {
  return await prisma.user.create({
    data:{
        firebaseId:firebaseId,
        email:email,
        firstName:firstName,
        lastName:lastName,
        role:"SUPER_ADMIN" // account create user will be super admin unless change it mannually 
    }
  })
};