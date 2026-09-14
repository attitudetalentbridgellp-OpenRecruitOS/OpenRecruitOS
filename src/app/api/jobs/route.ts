import { db } from "@/lib/db";
import { ApiError, handle, json, readJson, requireAuth, str } from "@/lib/api";
import { EMPLOYMENT_TYPES, JOB_STATUSES } from "@/lib/constants";

/** GET /api/jobs — list all jobs with application counts */
export async function GET(req: Request) {
  return handle(async () => {
    await requireAuth(req);
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const jobs = await db.job.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { applications: true } } },
    });
    return json(jobs);
  });
}

/** POST /api/jobs — create a job */
export async function POST(req: Request) {
  return handle(async () => {
    await requireAuth(req);
    const body = await readJson<Record<string, unknown>>(req);
    const title = str(body.title).trim();
    if (!title) throw new ApiError(400, "Job title is required");
    const employmentType = str(body.employmentType, "Full-time");
    if (!(EMPLOYMENT_TYPES as readonly string[]).includes(employmentType)) {
      throw new ApiError(400, "Invalid employment type");
    }
    const jobStatus = str(body.status, "Open");
    if (!(JOB_STATUSES as readonly string[]).includes(jobStatus)) {
      throw new ApiError(400, "Invalid job status");
    }
    const job = await db.job.create({
      data: {
        title,
        description: str(body.description),
        skills: str(body.skills),
        experience: str(body.experience),
        location: str(body.location),
        salary: str(body.salary),
        employmentType,
        status: jobStatus,
      },
      include: { _count: { select: { applications: true } } },
    });
    return json(job, 201);
  });
}
