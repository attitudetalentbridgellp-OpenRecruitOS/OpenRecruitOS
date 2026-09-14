// OpenRecruitOS — API route helpers (auth guard + JSON responses)

import { getAuthUser, SessionUser } from "@/lib/auth";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Throws a 401 Response when the request has no valid session. */
export async function requireAuth(req: Request): Promise<SessionUser> {
  const user = await getAuthUser(req);
  if (!user) throw new ApiError(401, "Unauthorized");
  return user;
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error("[api]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
}

export function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
