import { prisma } from "../plugins/prisma.js";
const test = async (fastify, options) => {
    const normalizeValues = (raw) => {
        if (!Array.isArray(raw))
            return [];
        const values = raw
            .filter((item) => typeof item === "string")
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
        return Array.from(new Set(values));
    };
    // fastify.get("/test/db",async(request,reply)=>{
    //     const org = await prisma.organization.create({
    //     data: {
    //       name: "CynoGuard Security",
    //       industry: "Cybersecurity",
    //       discoverSource: "Direct",
    //     },
    //   });
    //   // 2. Create the Project
    //   // We manually set the ID to match your controller's "test_project_cn_2026"
    //   const project = await prisma.project.create({
    //     data: {
    //       name: "Main Production WebApp",
    //       status: "active",
    //       createdAt: new Date(),
    //       organizationId: org.id, // Connects to the org we just made
    //     },
    //   });
    // })
    fastify.post("/api/dev/challenge-bank/seed", async (request, reply) => {
        try {
            const body = request.body;
            const values = normalizeValues(body);
            if (values.length === 0) {
                return reply.code(400).send({
                    status: "error",
                    message: "Request body must be a non-empty string array",
                });
            }
            const created = await prisma.challengeBank.createMany({
                data: values.map((value) => ({ value })),
                skipDuplicates: true,
            });
            return reply.code(200).send({
                status: "success",
                message: "ChallengeBank seeded",
                data: {
                    sourceCount: values.length,
                    insertedCount: created.count,
                    skippedCount: values.length - created.count,
                },
            });
        }
        catch (error) {
            return reply.code(500).send({
                status: "error",
                message: error?.message || "Failed to seed ChallengeBank",
            });
        }
    });
    // Backward-compatible route retained for current workflows.
    fastify.post("/api/auth/load/prod", async (request, reply) => {
        try {
            const body = request.body;
            const values = normalizeValues(body);
            if (values.length === 0) {
                return reply.code(400).send({
                    status: "error",
                    message: "Request body must be a non-empty string array",
                });
            }
            const created = await prisma.challengeBank.createMany({
                data: values.map((value) => ({ value })),
                skipDuplicates: true,
            });
            return reply.code(200).send({
                status: "success",
                message: "ChallengeBank seeded",
                data: {
                    sourceCount: values.length,
                    insertedCount: created.count,
                    skippedCount: values.length - created.count,
                },
            });
        }
        catch (error) {
            return reply.code(500).send({
                status: "error",
                message: error?.message || "Failed to seed ChallengeBank",
            });
        }
    });
    fastify.get("/api/auth/load/prod", async (request, reply) => {
        const data = await prisma.challengeBank.findMany();
        return reply.code(200).send({ data: data });
    });
};
export default test;
