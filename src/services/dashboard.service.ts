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




import type { PrismaClient } from "@prisma/client";

// ─── Org-level overview ───────────────────────────────────────────────────────

export async function getOrgOverview(prisma: PrismaClient, organizationId: string) {
  const projects = await prisma.project.findMany({
    where:  { organizationId },
    select: { id: true, name: true, status: true, createdAt: true },
  });

  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    return {
      totalProjects:   0,
      activeProjects:  0,
      totalDetections: 0,
      totalBots:       0,
      totalMentions:   0,
      highRiskMentions:0,
      totalApiKeys:    0,
      projects:        [],
    };
  }

  const now    = Date.now();
  const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [
    totalDetections,
    totalBots,
    totalMentions,
    highRiskMentions,
    totalApiKeys,
    detectionsPerProject,
    mentionsPerProject,
  ] = await Promise.all([
    prisma.detection.count({ where: { projectId: { in: projectIds } } }),
    prisma.detection.count({ where: { projectId: { in: projectIds }, isHuman: false } }),
    prisma.brandMention.count({ where: { projectId: { in: projectIds } } }),
    prisma.brandMention.count({ where: { projectId: { in: projectIds }, riskLevel: "HIGH" } }),
    prisma.apiKey.count({ where: { projectId: { in: projectIds } } }),
    prisma.detection.groupBy({
      by:    ["projectId"],
      where: { projectId: { in: projectIds }, createdAt: { gte: last7d } },
      _count: true,
    }),
    prisma.brandMention.groupBy({
      by:    ["projectId"],
      where: { projectId: { in: projectIds } },
      _count: true,
    }),
  ]);

  const detectionMap = new Map(detectionsPerProject.map((r) => [r.projectId, r._count]));
  const mentionMap   = new Map(mentionsPerProject.map((r)   => [r.projectId, r._count]));

  return {
    totalProjects:    projects.length,
    activeProjects:   projects.filter((p) => p.status === "active").length,
    totalDetections,
    totalBots,
    totalMentions,
    highRiskMentions,
    totalApiKeys,
    projects: projects.map((p) => ({
      id:          p.id,
      name:        p.name,
      status:      p.status,
      createdAt:   p.createdAt,
      detections7d: detectionMap.get(p.id) ?? 0,
      mentions:     mentionMap.get(p.id)   ?? 0,
    })),
  };
}

// ─── Project-level overview ───────────────────────────────────────────────────

export async function getProjectOverview(prisma: PrismaClient, projectId: string) {
  const now    = Date.now();
  const last7d = new Date(now - 7  * 24 * 60 * 60 * 1000);
  const last24h= new Date(now - 24 * 60 * 60 * 1000);

  const [
    totalDetections,
    humanDetections,
    botDetections,
    detections24h,
    totalMentions,
    newMentions,
    highRiskMentions,
    totalApiKeys,
    activeApiKeys,
    recentDetections,
    mentionsByRisk,
    detectionsByDay,
  ] = await Promise.all([
    prisma.detection.count({ where: { projectId } }),
    prisma.detection.count({ where: { projectId, isHuman: true } }),
    prisma.detection.count({ where: { projectId, isHuman: false } }),
    prisma.detection.count({ where: { projectId, createdAt: { gte: last24h } } }),
    prisma.brandMention.count({ where: { projectId } }),
    prisma.brandMention.count({ where: { projectId, status: "NEW" } }),
    prisma.brandMention.count({ where: { projectId, riskLevel: "HIGH" } }),
    prisma.apiKey.count({ where: { projectId } }),
    prisma.apiKey.count({ where: { projectId, status: "active" } }),
    prisma.detection.findMany({
      where:   { projectId },
      orderBy: { createdAt: "desc" },
      take:    5,
      select:  { id: true, ipAddress: true, riskLevel: true, action: true, isHuman: true, createdAt: true },
    }),
    prisma.brandMention.groupBy({
      by:    ["riskLevel"],
      where: { projectId },
      _count: true,
    }),
    prisma.detection.findMany({
      where:  { projectId, createdAt: { gte: last7d } },
      select: { createdAt: true, isHuman: true },
    }),
  ]);

  // Build 7-day chart
  const dailyMap = new Map<string, { bots: number; humans: number }>();
  for (const d of detectionsByDay) {
    const day = d.createdAt.toISOString().slice(0, 10);
    if (!dailyMap.has(day)) dailyMap.set(day, { bots: 0, humans: 0 });
    const entry = dailyMap.get(day)!;
    if (d.isHuman) entry.humans++; else entry.bots++;
  }
  const detectionChart = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now - (6 - i) * 86400000).toISOString().slice(0, 10);
    const entry = dailyMap.get(day) ?? { bots: 0, humans: 0 };
    return { date: day, ...entry };
  });

  return {
    totalDetections,
    humanDetections,
    botDetections,
    detections24h,
    botRate: totalDetections > 0 ? Math.round((botDetections / totalDetections) * 100) : 0,
    totalMentions,
    newMentions,
    highRiskMentions,
    totalApiKeys,
    activeApiKeys,
    mentionsByRisk: mentionsByRisk.map((r) => ({ riskLevel: r.riskLevel, count: r._count })),
    detectionChart,
    recentDetections,
  };
}