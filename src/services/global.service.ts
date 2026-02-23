import jwt from 'jsonwebtoken';
export const verifyJWT = (token:string):string | jwt.JwtPayload=>{
    try {
     const decodedToken = jwt.verify(token,process.env.JWT_SECRET as string);
     if(!decodedToken){
        return decodedToken;
     }
     return decodedToken;

    } catch (error) {
        return "error";
    }
  
}