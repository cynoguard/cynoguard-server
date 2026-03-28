import jwt from 'jsonwebtoken';
export const verifyJWT = (token:string):string | jwt.JwtPayload=>{
    try {
     const decodedToken = jwt.verify(token,"2cc08b7a5f4090a29c309dd9ee072cceaaef89e9e68f87ca64a79401083213bc0245d277d4785d02c4d21e6239fe7619a9485536641d83325f1676f413946d09");
     if(!decodedToken){
        return decodedToken;
     }
     return decodedToken;

    } catch (error) {
        return "error";
    }
  
}