import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
export const generateSecureApiKey = () => {
  // 1. Create the raw key (The secret the user will use)
  const apiKey = crypto.randomBytes(32).toString('hex');

  // 2. Create the hash (The version you store in the DB)
  const hashedKey = crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');

  return { apiKey, hashedKey };
};


export const verifyApiKey = (providedKey:string,storedHash:string)=>{

  const hashToCompare = crypto.createHash("sha256").update(providedKey).digest("hex");

  const hashBuffer = Buffer.from(hashToCompare, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (hashBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, storedBuffer);

}

export const getHash = (apiKey:string) => {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
};