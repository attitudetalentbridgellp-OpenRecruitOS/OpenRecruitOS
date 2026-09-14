import { db } from "@/lib/db";
import { ApiError, handle, json, readJson, requireAuth, str } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/** GET /api/candidates/:id — full profile with applications (+jobs) and interviews */
export async function GET(req: Request, { params }: Params) {
  return handle(async () => {
    await requireAuth(req);
    const { id } = await params;
    const candidate = await db.candidate.findUnique({
      where: { id },
      include: {
        applications: {
          orderBy: { appliedAt: "desc" },
          include: {
            job: { select: { id: true, title: true, location: true, status: true, employmentType: true } },
            history: { orderBy: { changedAt: "asc" } },
            interviews: { orderBy: { date: "desc" } },
          },
        },
        _count: { select: { applications: true } },
      },
    });
    if (!candidate) throw new ApiError(404, "Candidate not found");
    return json(candidate);
  });
}

/** PUT /api/candidates/:id — update profile (incl. resume replace) */
export async function PUT(req: Request, { params }: Params) {
  return handle(async () => {
    await requireAuth(req);
    const { id } = await params;
    const body = await readJson<Record<string, unknown>>(req);
    const existing = await db.candidate.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Candidate not found");

    const data: Record<string, string> = {};
    if ("name" in body) {
      const name = str(body.name).trim();
      if (!name) throw new ApiError(400, "Candidate name is required");
      data.name = name;
    }
    if ("email" in body) {
      const email = str(body.email).trim();
      if (email && email !== existing.email) {
        const dup = await db.candidate.findFirst({ where: { email } });
        if (dup) throw new ApiError(409, "A candidate with this email already exists");
      }
      data.email = email;
    }
    for (const key of [
      "phone", "resume", "resumeName", "skills", "experience", "education",
      "location", "salary", "noticePeriod", "notes", "tags",
    ] as const) {
      if (key in body) data[key] = str(body[key]);
    }

    const candidate = await db.candidate.update({
      where: { id },
      data,
      include: { _count: { select: { applications: true } } },
    });
    return json(candidate);
  });
}

/** DELETE /api/candidates/:id — also removes the stored resume file */
export async function DELETE(req: Request, { params }: Params) {
  return handle(async () => {
    await requireAuth(req);
    const { id } = await params;
    const existing = await db.candidate.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Candidate not found");
    await db.candidate.delete({ where: { id } });
    if (existing.resume) {
      const { getStorage } = await import("@/lib/storage");
      await getStorage().delete(existing.resume);
    }
    return json({ ok: true });
  });
}
