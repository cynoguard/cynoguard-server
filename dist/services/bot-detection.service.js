import { prisma } from "../plugins/prisma.js";
export const getBotChallenge = async () => {
    const count = await prisma.challengeBank.count();
    let randomcount = Math.floor(Math.random() * count);
    if (count === 1) {
        randomcount += 1;
    }
    return await prisma.challengeBank.findFirst({
        skip: randomcount,
        where: { isActive: true }
    });
};
export const updateChallengeStats = async (id, isChallengeSuccess) => {
    if (isChallengeSuccess) {
        return await prisma.challengeBank.update({ where: { id: id }, data: { successCount: { increment: 1 } } });
    }
    else
        return await prisma.challengeBank.update({ where: { id: id }, data: { failCount: { increment: 1 } } });
};
export const updateSessionData = async (signals) => {
    // This function can be used to update session data in the database after the response is sent. For example, you can log the bot detection results, update user session info, etc.
    // Implementation depends on your database schema and requirements.
    console.log("Updating session data with signals:", signals);
    console.log(signals);
    return await prisma.detection.create({ data: { ...signals } });
};
export const updateDetectionData = async (signals) => {
    return await prisma.detection.update({ where: { id: signals.detectionId }, data: { challengeHistory: { push: signals.challengeId } } });
};
