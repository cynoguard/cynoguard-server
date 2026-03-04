import { prisma } from "../plugins/prisma.js";

export const syncProjectsData = async (orgId:string)=>{
   const projects = await prisma.organization.findUnique({
    where:{
      id:orgId,
    }
   });

  return projects;
}