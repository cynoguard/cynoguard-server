import { prisma } from "../plugins/prisma.js";

export const syncProjectsData = async (orgId:string)=>{
   const projects = await prisma.organization.findUnique({
    where:{
      id:orgId,
    },
    include:{
      projects:true,
    }
   });

  return projects;
}

export const syncOrganizationData = async (authId:string)=>{
   const projects = await prisma.user.findFirst({
    where:{
      firebaseId:authId,
    },
    select:{
      organizationMembers:{
        include:{
          organization:true
        }
      }
    }
   });

  return projects;
}


export const createNewApiKey = async (name:string,hashedKey:string,projectId:string)=>{
  const keyData = await prisma.apiKey.create({
    data:{
      keyHash:hashedKey,
      name:name,
      project:{
        connect:{
          id:projectId
        }
      }
    }
  });

  return keyData;
}

export const syncApiKeyData = async (id:string)=>{
  const keyData = await prisma.apiKey.findFirst({
    where:{
      id:id
    }
  });

  return keyData;
}

export const syncApiKeyConnectionStatus = async (id:string)=>{
  const keyData = await prisma.detection.findFirst({
    where:{
      project:{
        apiKeys:{
          some:{
            id:id,
          },
        }
      }
    }
  });

  return keyData;
}

export const syncApiKeysList = async (projectId:string)=>{
  const keysData = await prisma.apiKey.findMany({
    where:{
      projectId:projectId,
    }
  });

  return keysData;
}

export const updateApiKeyInfo = async (id:string,status:string)=>{
  return await prisma.apiKey.update({
    where:{
      id:id
    },
    data:{
      status:status,
      connectionVerified:status === "connected"?true:false,
    },
  });

}

export const deleteApiKey = async (id:string)=>{
  return await prisma.apiKey.delete({
    where:{
      id:id
    },
  });

}