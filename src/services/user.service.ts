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

export const getOrganizationMember = async (uid: string, orgName: string) => {
  return await prisma.organizationMember.findFirst({
    where: {
      user:         { firebaseId: uid },   // uid here is Firebase UID from token
      organization: { name: orgName },
    },
    select: {
      user:         true,
      organization: {
        include: {
          projects: {          // return projects so AppInitializer can set activeProjectId
            select: {
              id:   true,
              name: true,
            },
            take: 10,
          },
        },
      },
    },
  });
};