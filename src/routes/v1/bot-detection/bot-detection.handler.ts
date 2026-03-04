import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { getBotChallenge, updateChallengeStats } from "../../../services/bot-detection.service.js";
import { verifyJWT } from "../../../services/global.service.js";
import { type verifyChallengeBodyType, type verifyHumanBodyType, type verifyHumanResponseType } from './../../../types/bot-detection.js';

export const verifyHuman = async(request:FastifyRequest<{Body:verifyHumanBodyType}>,reply:FastifyReply)=>{
   const signals:verifyHumanBodyType = request.body;
   try {

    let score = 100; // Start perfect, subtract for risks

    // TIER 1: Heuristics logic
    if (signals.webdriver){
        score -= 70;
    } // High signal for bot
    if (!signals.webgl || !signals.canvas){
        score -= 30;
    }  // Headless/Server environment
    if (signals.hardwareConcurrency < 2){
        score -= 20;
    } // Most humans have > 2 cores
    
    const response:verifyHumanResponseType = {
        status:"success",
        message:"detection completed",
        request_id:"",
        version:"v1.0",
        data:{
            assessment: {
            score: score,
            risk_level: score < 30 ? "high" : score < 71 ? "medium" : "low",
            action:"",
            // reasons: "not available" 
            },
            context: {
                ip: request.ip,
                ua_fingerprint: signals.ua,
                timestamp: new Date().toISOString()
            },
        }
    }


    // TIER 2: ML (Placeholder for your Python/EC2 logic)
    // If score is 31-70, we'd normally call the Python ML model here
    let actionStatus = "allow";

    if (score < 30){ 
        actionStatus = "challenge";
    }
    else if (score < 71){
        actionStatus = "uncertain";
    }

    let challengeDataId:string|null = null;

    const detectionId = uuidv4();

    if(actionStatus === "challenge" || actionStatus === "uncertain"){
        const challengeData = await getBotChallenge();
        const valueArr = challengeData?.value.split(" ")||[];
        const max = valueArr?.length || 1;
        const min = 1;
        const randomPosition = Math.floor(Math.random() * (max-min+1)) + min;
        const token = jwt.sign({did:detectionId,cid:challengeData?.id,answer:valueArr[randomPosition-1]}, process.env.JWT_SECRET as string, {expiresIn:"5m"})
        challengeDataId = challengeData?.id || null;
        response.data.challenge = {
            context:challengeData?.value || "",
            condition:randomPosition || 1,
            token:token,
        }
    }else{
        response.data.cookies ={ token : jwt.sign({assessment:"passed"}, process.env.JWT_SECRET as string, {expiresIn:"3d"})}
    }

    response.data.assessment.action = actionStatus;

    const dataToStore = {
        id:detectionId,
        projectId: "4eff656b-e36e-4b94-b9d2-a2004622e58e", // Replace with actual project ID if available
        challengeHistory: [challengeDataId],
        ipAddress: request.ip,
        score: response.data.assessment.score,
        action: response.data.assessment.action,
        signals: signals,
        isHuman: response.data.assessment.risk_level === "low",
        timeToSolve: 0, // Placeholder, calculate if you implement challenge timing
    }
    request.auditData = {...dataToStore}; // Store signals for later use in onResponse hook 
    return reply.code(200).send(response);
   } catch (error) {
     return reply.code(500).send({status:"Internal Server Error",message:"",error:error})
   }
}


export const verifyBotChallenge = async(request:FastifyRequest,reply:FastifyReply)=>{
    const {answer} = request.body as verifyChallengeBodyType;
    const token = request.headers.authorization?.replace("Bearer "," ").split(" ")[1];
    try {

        if(!token){
            return reply.code(404).send({status:"Bad Request",message:"Missing or invalid token",error:"Token is missing or malformed"})
        }

        const decodedToken:{answer:string, cid:string,did:string} = jwt.verify(token,process.env.JWT_SECRET as string) as any;
        if(decodedToken.answer !== answer){
            await updateChallengeStats(decodedToken.cid,false);
            return reply.code(401).send({status:"Bad Request",message:"Invalid challenge answer",error:"Challenge answer is incorrect",data:{
                challenge:{
                    retake_token:jwt.sign({did:decodedToken.did},process.env.JWT_SECRET as string,{expiresIn:"5m"})
                }
            }})
        }

        await updateChallengeStats(decodedToken.cid,true);
        return reply.code(200).send({status:"success",message:"Challenge verified",data:{challenge_verified:true,cookies:{token: jwt.sign({assessment:"passed"}, process.env.JWT_SECRET as string, {expiresIn:"3d"})}}})
    } catch (error) {
        return reply.code(500).send({status:"Internal Server Error",message:"",error:error})
    }
}

export const verifyBotSessionToken = async(request:FastifyRequest,reply:FastifyReply)=>{
    const token = request.headers.authorization?.split(" ")[1];
    try {

        if(!token){
            return reply.code(200).send({status:"not-verified",message:"Session is not verified"})
        }

        const decodedToken = verifyJWT(token) as any;
        console.log(decodedToken);
        if(decodedToken.assessment !== "passed" || decodedToken === "error"){
            return reply.code(401).send({status:"token-not-valid",message:"token is expire or not valid"})
        }

        return reply.code(200).send({status:"session-verified",message:"Session verified",});

        
    } catch (error) {
        return reply.code(500).send({status:"Internal Server Error",message:"",error:error})
    }

}

export const reTakeBotChallenge = async(request:FastifyRequest,reply:FastifyReply)=>{
    const token = request.headers.authorization?.replace("Bearer ", " ").split(" ")[1];

    try {
  const challengeData = await getBotChallenge();
        const valueArr = challengeData?.value.split(" ")||[];
        const max = valueArr?.length || 1;
        const min = 1;
        const randomPosition = Math.floor(Math.random() * (max-min+1)) + min;

        if(!token){
          return reply.code(404).send({status:"Bad Request",message:"Missing or invalid token",error:"Token is missing or malformed"})
        }

        const decodedToken:{did:string} = jwt.verify(token,process.env.JWT_SECRET as string) as any;
        const challengeToken = jwt.sign({cid:challengeData?.id,answer:valueArr[randomPosition-1]}, process.env.JWT_SECRET as string, {expiresIn:"5m"})

        request.auditData  = {detectionId:decodedToken.did,challengeId:challengeData?.id || null};
        //  const cookieToken = jwt.sign({assessment:"passed"}, process.env.JWT_SECRET as string, {expiresIn:"3d"})

        return reply.code(200).send({
        status:"success",message:"Sent a new challenge",    
        data:{
        challenge :{
            context:challengeData?.value || "",
            condition:randomPosition || 1,
            token:challengeToken,
        },
        }});

    }catch(error){
        return reply.code(500).send({status:"Internal Server Error",message:"",error:error})
    }
}