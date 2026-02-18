import { prisma } from "../plugins/prisma.js";

export async function getAllBrands() {
  return prisma.project.findMany();
}

export async function getBrandById(id: string) {
  return prisma.project.findUnique({
    where: { id },
  });
}