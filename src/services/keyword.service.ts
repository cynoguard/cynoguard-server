import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getProjectKeywords = async (projectId: string) => {
  return prisma.keyword.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" }
  });
};

export const createKeyword = async (
  projectId: string,
  value: string
) => {
  return prisma.keyword.create({
    data: {
      projectId,
      value
    }
  });
};

export const deleteKeyword = async (id: string) => {
  return prisma.keyword.delete({
    where: { id }
  });
};

export const toggleKeyword = async (id: string, isActive: boolean) => {
  return prisma.keyword.update({
    where: { id },
    data: { isActive }
  });
};