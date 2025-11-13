import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export type JwtPayload = {
  sub: string;       // userId
  username: string;
  role: 'customer' | 'admin';
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
