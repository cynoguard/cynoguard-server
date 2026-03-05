import jwt from 'jsonwebtoken';
export const verifyJWT = (token) => {
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        if (!decodedToken) {
            return decodedToken;
        }
        return decodedToken;
    }
    catch (error) {
        return "error";
    }
};
