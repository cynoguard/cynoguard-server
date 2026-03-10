import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { verifyFirebaseToken } from "../../services/firebase.service.js";
import {
  checkAssociatedOrganizations,
  getOrganizationMember,
  handleDbUser,
} from "../../services/user.service.js";

export const authenticateUser = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const token = request.headers.authorization?.replace("Bearer ", "");
  const body = request.body as { firstName?: string; lastName?: string };

  try {
    // 1. Verify Token (Source of Truth for UID and Email)
    const decodedToken = await verifyFirebaseToken(token!);
    if (!decodedToken) {
      return reply
        .code(401)
        .send({ error: "Unauthorized", message: "Invalid Firebase token" });
    }

    const { uid, email } = decodedToken;

    const user = await handleDbUser(
      uid,
      email || "",
      body.firstName || "",
      body.lastName || "",
    );
    const organizations = await checkAssociatedOrganizations(user.id);

    const dataToSend: any = {
      uid: user.firebaseId,
      email: user.email,
      role: user.role,
      first_name: user.firstName || "",
      last_name: user.lastName || "",
    };

    console.log("User Organizations:", organizations);

    if (organizations.length > 0) {
      const orgs = organizations.map((org) => ({
        id: org.id,
        name: org.name,
        is_onboarded: org.isOnboarded,
        session_token: org.isOnboarded
          ? false
          : jwt.sign({ authId:user.firebaseId,uid: user.id, orgId: org.id }, process.env.JWT_SECRET!, {
              expiresIn: "7d",
            }),
      }));
      dataToSend.organizations = orgs;
    } else {
      const orgId = uuidv4();
      const sessionToken = jwt.sign(
        {authId:user.firebaseId, uid: user.id, orgId: orgId },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" },
      );
      dataToSend.token = sessionToken;
    }

    return reply.code(200).send({
      status: "success",
      message: "Authentication successful",
      data: {
        ...dataToSend,
      },
    });
  } catch (error: any) {
    console.error("Auth Error:", error);
    return reply
      .code(500)
      .send({ error: "Internal Server Error", message: error.message });
  }
};



export const getAuthUser = async(request:FastifyRequest,reply:FastifyReply)=>{
  const token = request.headers.authorization?.replace("Bearer ", "").split(" ")[1];
  const {orgName} = request.query as { orgName: string };
 try {

  if(!token){
    return reply.code(404).send({ error: "Not-Found", message: "No token provided" });
  }

  const decodedToken = await verifyFirebaseToken(token);

  if (!decodedToken) {
    return reply
      .code(401)
      .send({ error: "Unauthorized", message: "Invalid Firebase token" });
  }

  const { uid } = decodedToken;

  const orgMemberData = await getOrganizationMember(uid,orgName);

  return reply.code(200).send({status:"success", message:"User fetched successfully", data:{org_member_info:orgMemberData}})
   
 } catch (error:any) {
   return reply
      .code(500)
      .send({ error: "Internal Server Error", message: error.message });
  
 }
}