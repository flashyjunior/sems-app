import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

export interface JWTPayload {
  userId: number;
  email: string;
  roleId: number;
  iat?: number;
  exp?: number;
}

/**
 * Sign a JWT token
 */
export const signToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  } as any);
};

/**
 * Verify a JWT token
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Decode a JWT token without verification (for debugging)
 */
export const decodeToken = (token: string) => {
  return jwt.decode(token);
};
