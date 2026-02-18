import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { fetchRedditMentions } from "../services/reddit.service.js";
import { fetchXMentions } from "../services/x.service.js";
import { saveMention } from "../services/social-media-monitoring.service.js";
const connection = new Redis();
new Worker("ingestion", async (job) => {
    const { projectId, keyword } = job.data;
    const reddit = await fetchRedditMentions(keyword);
    const x = await fetchXMentions(keyword);
    const mentions = [...reddit, ...x];
    for (const mention of mentions) {
        await saveMention(projectId, mention);
    }
}, { connection: connection });
