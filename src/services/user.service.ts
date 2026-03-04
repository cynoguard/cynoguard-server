import { prisma } from "../plugins/prisma.js";


export const getUserByFirebaseId = async (firebaseId: string) => {
  return await prisma.user.findUnique({
    where: {
      firebaseId: firebaseId,
    },
  });
};

export const handleDbUser = async (
  firebaseId: string,
  email: string,
  firstName: string | "",
  lastName: string | "",
) => {
  const user = await prisma.user.upsert({
    where: { firebaseId: firebaseId },
    update: {
      lastLogin: new Date(), // Keep track of activity
    },
    create: {
      firebaseId: firebaseId,
      email: email! || "",
      firstName: firstName || "",
      lastName: lastName || "",
      role: "SUPER_ADMIN", // Default role
    },
  });

  return user;
};

export const checkAssociatedOrganizations = async (userId: string) => {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId: userId },
    select: { organization: true, id: true },
  });

  return memberships.map((memberships) => memberships.organization);
};


export const getOrganizationMember = async (userId: string, orgName: string) => {
  return await prisma.organizationMember.findFirst({
    where:{
      userId:userId,
      organization:{
        name:orgName,
      }
    },
    select:{
      organization:true,
      user:true,
    }
  });
}