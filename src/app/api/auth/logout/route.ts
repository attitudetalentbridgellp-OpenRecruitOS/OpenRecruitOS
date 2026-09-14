import { SESSION_COOKIE } from "@/lib/auth";
import { handle, json } from "@/lib/api";

export async function POST() {
  return handle(async () => {
    const res = json({ ok: true });
    res.headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE.name}=; Path=${SESSION_COOKIE.options.path}; HttpOnly; SameSite=Lax; Max-Age=0`
    );
    return res;
  });
}
