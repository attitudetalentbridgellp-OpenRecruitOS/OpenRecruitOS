import { db } from "@/lib/db";
import { ApiError, handle, json, readJson, requireAuth, str } from "@/lib/api";
import { EMPLOYMENT_TYPES, JOB_STATUSES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

/** GET /api/jobs/:id — job detail including its applications (candidates) and interviews */
export async function GET(req: Request, { params }: Params) {
  return handle(async () => {
    await requireAuth(req);
    const { id } = await params;
    const job = await db.job.findUnique({
      where: { id },
      include: {
        applications: {
          orderBy: { appliedAt: "desc" },
          include: {
            candidate: { select: { id: true, name: true, email: true, phone: true, skills: true, experience: true, location: true } },
            interviews: { orderBy: { date: "desc" } },
          },
        },
        _count: { select: { applications: true } },
      },
    });
    if (!job) throw new ApiError(404, "Job not found");
    return json(job);
  });
}

/** PUT /api/jobs/:id — update job (fields and/or status open/close) */
export async function PUT(req: Request, { params }: Params) {
  return handle(async () => {
    await requireAuth(req);
    const { id } = await params;
    const body = await readJson<Record<string, unknown>>(req);
    const existing = await db.job.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Job not found");

    const data: Record<string, string> = {};
    if ("title" in body) {
      const title = str(body.title).trim();
      if (!title) throw new ApiError(400, "Job title is required");
      data.title = title;
    }
    for (const key of ["description", "skills", "experience", "location", "salary"] as const) {
      if (key in body) data[key] = str(body[key]);
    }
    if ("employmentType" in body) {
      const et = str(body.employmentType);
      if (!(EMPLOYMENT_TYPES as readonly string[]).includes(et)) throw new ApiError(400, "Invalid employment type");
      data.employmentType = et;
    }
    if ("status" in body) {
      const st = str(body.status);
      if (!(JOB_STATUSES as readonly string[]).includes(st)) throw new ApiError(400, "Invalid job status");
      data.status = st;
    }

    const job = await db.job.update({
      where: { id },
      data,
      include: { _count: { select: { applications: true } } },
    });
    return json(job);
  });
}

/** DELETE /api/jobs/:id */
export async function DELETE(req: Request, { params }: Params) {
  return handle(async () => {
    await requireAuth(req);
    const { id } = await params;
    const existing = await db.job.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Job not found");
    await db.job.delete({ where: { id } });
    return json({ ok: true });
  });
}
