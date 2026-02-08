import type { FastifyReply, FastifyRequest } from "fastify";
import { type verifyHumanBodyType, type verifyHumanResponseType } from './../../../types/bot-detection.js';


export const verifyHuman = async(request:FastifyRequest,reply:FastifyReply)=>{
    const signals:verifyHumanBodyType = request.body as verifyHumanBodyType;
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
        message:"verification completed",
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
        }
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
     
    response.data.assessment.action = actionStatus;
 
  



    return reply.code(200).send(response);
   } catch (error) {
     return reply.code(500).send({status:"Internal Server Error",message:"",error:error})
   }
}