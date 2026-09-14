import { db } from "@/lib/db";
import { ApiError, handle, json, readJson, requireAuth, str } from "@/lib/api";

/** GET /api/applications — full list with candidate, job, stage history and interviews */
export async function GET(req: Request) {
  return handle(async () => {
    await requireAuth(req);
    const url = new URL(req.url);
    const jobId = url.searchParams.get("jobId") || undefined;
    const candidateId = url.searchParams.get("candidateId") || undefined;
    const stage = url.searchParams.get("stage") || undefined;

    const applications = await db.application.findMany({
      where: { ...(jobId ? { jobId } : {}), ...(candidateId ? { candidateId } : {}), ...(stage ? { stage } : {}) },
      orderBy: { appliedAt: "desc" },
      include: {
        candidate: { select: { id: true, name: true, email: true, phone: true, skills: true, experience: true, location: true, resume: true, resumeName: true } },
        job: { select: { id: true, title: true, location: true, employmentType: true, status: true } },
        history: { orderBy: { changedAt: "asc" } },
        interviews: { orderBy: { date: "desc" } },
      },
    });
    return json(applications);
  });
}

/** POST /api/applications — add a candidate to a job (starts at Applied) */
export async function POST(req: Request) {
  return handle(async () => {
    await requireAuth(req);
    const body = await readJson<{ candidateId?: string; jobId?: string }>(req);
    const candidateId = str(body.candidateId);
    const jobId = str(body.jobId);
    if (!candidateId || !jobId) throw new ApiError(400, "candidateId and jobId are required");

    const candidate = await db.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) throw new ApiError(404, "Candidate not found");
    const job = await db.job.findUnique({ where: { id: jobId } });
    if (!job) throw new ApiError(404, "Job not found");

    const dup = await db.application.findUnique({
      where: { candidateId_jobId: { candidateId, jobId } },
    });
    if (dup) throw new ApiError(409, "This candidate is already applied to this job");

    const application = await db.application.create({
      data: {
        candidateId,
        jobId,
        stage: "Applied",
        status: "Active",
        history: { create: { previousStage: "", newStage: "Applied" } },
      },
      include: {
        candidate: { select: { id: true, name: true, email: true, phone: true, skills: true, experience: true, location: true, resume: true, resumeName: true } },
        job: { select: { id: true, title: true, location: true, employmentType: true, status: true } },
        history: true,
        interviews: true,
      },
    });
    return json(application, 201);
  });
}
