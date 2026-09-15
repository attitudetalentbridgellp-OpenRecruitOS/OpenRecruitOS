// OpenRecruitOS — Account registration (Community Edition: open sign-up)
// Keeps the same contract as login: returns the user and sets the session cookie,
// so a new account lands straight in the workspace. SSO/invites can replace this
// module in commercial versions behind the same interface.

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSessionToken, hashPassword, SESSION_COOKIE } from "@/lib/auth";
import { ApiError, handle, json, readJson, str } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readJson<{ name?: string; email?: string; password?: string }>(req);
    const name = str(body.name).trim();
    const email = str(body.email).trim().toLowerCase();
    const password = str(body.password);

    if (!name || name.length < 2 || name.length > 100) {
      throw new ApiError(400, "Please enter your full name (2–100 characters)");
    }
    if (!email || !EMAIL_RE.test(email) || email.length > 254) {
      throw new ApiError(400, "Please enter a valid email address");
    }
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      throw new ApiError(409, "An account with this email already exists. Try signing in instead.");
    }

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: { name, email, password: passwordHash },
      select: { id: true, name: true, email: true },
    });

    const token = await createSessionToken(user.id);
    const res = json(user);
    res.headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE.name}=${encodeURIComponent(token)}; Path=${SESSION_COOKIE.options.path}; HttpOnly; SameSite=Lax; Max-Age=${SESSION_COOKIE.options.maxAge}`
    );
    return res;
  });
}
