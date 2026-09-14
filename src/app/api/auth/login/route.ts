import { db } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE, verifyPassword } from "@/lib/auth";
import { ApiError, handle, json, readJson, str } from "@/lib/api";

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readJson<{ email?: string; password?: string }>(req);
    const email = str(body.email).trim().toLowerCase();
    const password = str(body.password);
    if (!email || !password) throw new ApiError(400, "Email and password are required");

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.password))) {
      throw new ApiError(401, "Invalid email or password");
    }

    const token = await createSessionToken(user.id);
    const res = json({ id: user.id, name: user.name, email: user.email });
    res.headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE.name}=${encodeURIComponent(token)}; Path=${SESSION_COOKIE.options.path}; HttpOnly; SameSite=Lax; Max-Age=${SESSION_COOKIE.options.maxAge}`
    );
    return res;
  });
}
