import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { ApiError, handle, json, readJson, requireAuth, str } from "@/lib/api";

/** Change password — basic user account management for Community Edition. */
export async function PUT(req: Request) {
  return handle(async () => {
    const session = await requireAuth(req);
    const body = await readJson<{ currentPassword?: string; newPassword?: string }>(req);
    const current = str(body.currentPassword);
    const next = str(body.newPassword);
    if (!current || !next) throw new ApiError(400, "Current and new password are required");
    if (next.length < 6) throw new ApiError(400, "New password must be at least 6 characters");

    const user = await db.user.findUnique({ where: { id: session.id } });
    if (!user || !(await verifyPassword(current, user.password))) {
      throw new ApiError(400, "Current password is incorrect");
    }
    await db.user.update({
      where: { id: session.id },
      data: { password: await hashPassword(next) },
    });
    return json({ ok: true });
  });
}
