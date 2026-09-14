import { db } from "@/lib/db";
import { ApiError, handle, json, readJson, requireAuth, str } from "@/lib/api";

/** GET /api/interviews — all interviews with application → candidate & job context */
export async function GET(req: Request) {
  return handle(async () => {
    await requireAuth(req);
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const interviews = await db.interview.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ date: "asc" }, { time: "asc" }],
      include: {
        application: {
          select: {
            id: true,
            stage: true,
            candidate: { select: { id: true, name: true, email: true } },
            job: { select: { id: true, title: true, location: true } },
          },
        },
      },
    });
    return json(interviews);
  });
}

/** POST /api/interviews — schedule an interview for an application */
export async function POST(req: Request) {
  return handle(async () => {
    await requireAuth(req);
    const body = await readJson<Record<string, unknown>>(req);
    const applicationId = str(body.applicationId);
    const interviewer = str(body.interviewer).trim();
    const date = str(body.date).trim();
    const time = str(body.time).trim();
    if (!applicationId) throw new ApiError(400, "Application is required");
    if (!interviewer) throw new ApiError(400, "Interviewer is required");
    if (!date || !time) throw new ApiError(400, "Date and time are required");

    const application = await db.application.findUnique({ where: { id: applicationId } });
    if (!application) throw new ApiError(404, "Application not found");

    const interview = await db.interview.create({
      data: {
        applicationId,
        interviewer,
        date,
        time,
        status: "Scheduled",
        feedback: str(body.feedback),
      },
      include: {
        application: {
          select: {
            id: true,
            stage: true,
            candidate: { select: { id: true, name: true, email: true } },
            job: { select: { id: true, title: true, location: true } },
          },
        },
      },
    });
    return json(interview, 201);
  });
}
