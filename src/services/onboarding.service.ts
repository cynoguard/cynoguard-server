import { prisma } from "../plugins/prisma.js";


export const onboardingService = {
  async saveCompanyDetails(userId: string, name: string, industry?: string) {
    return await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { 
          name,
          industry: industry ?? null}
      });

      await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: userId,
          role: "OWNER"
        }
      });

      const user = await tx.user.update({
        where: { id: userId },
        data: { isOnboarded: true }
      });

      return { organizationId: org.id, isOnboarded: user.isOnboarded };
    });
  },

  async getOnboardingStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isOnboarded: true, email: true }
    });
    return user;
  }
};
