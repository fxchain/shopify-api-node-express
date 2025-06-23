import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
const secret = process.env.JWT_SECRET ?? 'qsdfq3s2';

interface RequestWithCustomerId extends Request {
    customerId?: number
}

interface JwtPayloadWithCustomerId extends JwtPayload {
    customerId?: number
}

function auth(req: RequestWithCustomerId, res: Response, next: NextFunction) {
  const jwtToken = req.header('Authorization');

  if (!jwtToken) {
    return res.status(401).json({ message: "Not authorized" });
  }

  jwt.verify(jwtToken, secret, (err, decoded: JwtPayloadWithCustomerId) => {
    if (err) {
      return res.status(401).json({ message: "Not authorized" });
    }
    req.customerId = decoded?.customerId ?? null;
    next();
  });
}
export default auth;
