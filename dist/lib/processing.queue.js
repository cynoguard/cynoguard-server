import { Queue } from "bullmq";
import { Redis } from "ioredis";
const connection = new Redis();
export const processingQueue = new Queue("processing", {
    connection: connection,
});
