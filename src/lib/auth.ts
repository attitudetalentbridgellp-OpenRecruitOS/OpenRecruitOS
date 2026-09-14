// OpenRecruitOS — Authentication (JWT session cookie + bcrypt password hashing)
// Kept intentionally simple for the Community Edition.
// Future commercial versions (SSO/SAML/SCIM) can replace this module behind the same interface.

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const COOKIE_NAME = "oroos_session";
const SESSION_DAYS = 7;

function secretKey(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    "openrecruitos-dev-secret-change-me-in-production";
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function getSessionUserFromToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true },
    });
    return user ?? null;
  } catch {
    return null;
  }
}

/** Read the session from a NextRequest cookie jar (API routes). */
export async function getAuthUser(req: Request): Promise<SessionUser | null> {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  const token = match ? decodeURIComponent(match.slice(COOKIE_NAME.length + 1)) : undefined;
  return getSessionUserFromToken(token);
}

export const SESSION_COOKIE = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false, // set true behind HTTPS in production
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  },
};
