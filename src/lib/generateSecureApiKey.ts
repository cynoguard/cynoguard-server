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