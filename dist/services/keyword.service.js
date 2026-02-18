import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export const getProjectKeywords = async (projectId) => {
    return prisma.keyword.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" }
    });
};
export const createKeyword = async (projectId, value) => {
    return prisma.keyword.create({
        data: {
            projectId,
            value
        }
    });
};
export const deleteKeyword = async (id) => {
    return prisma.keyword.delete({
        where: { id }
    });
};
export const toggleKeyword = async (id, isActive) => {
    return prisma.keyword.update({
        where: { id },
        data: { isActive }
    });
};
