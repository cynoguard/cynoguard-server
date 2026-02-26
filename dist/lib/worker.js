import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { fetchXMentions } from "../services/x.service.js";
import { saveMention } from "../services/social-media-monitoring.service.js";
const connection = new Redis({ maxRetriesPerRequest: null });
new Worker("ingestion", async (job) => {
    const { projectId, keyword } = job.data;
    const x = await fetchXMentions(keyword);
    const mentions = [...x];
    for (const mention of mentions) {
        await saveMention(projectId, mention);
    }
}, { connection: connection });
