import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "./config.js";
import { IncomingMessage } from "http";

export function verifyToken(request:IncomingMessage) {

    const url = new URL(request.url as string, "http://localhost");
    const token = url.searchParams.get("token");

    if (!token) {
        return null;
    }

    try {
        
        const decoded = jwt.verify(token, JWT_PASSWORD);
        return decoded;

    } catch (e) {

        return null;
    }
}