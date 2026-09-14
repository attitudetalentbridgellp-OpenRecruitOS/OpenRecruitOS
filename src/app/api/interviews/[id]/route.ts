import { db } from "@/lib/db";
import { ApiError, handle, json, readJson, requireAuth, str } from "@/lib/api";
import { isValidInterviewStatus } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

const INCLUDE = {
  application: {
    select: {
      id: true,
      stage: true,
      candidate: { select: { id: true, name: true, email: true } },
      job: { select: { id: true, title: true, location: true } },
    },
  },
};

/** PUT /api/interviews/:id — edit details, complete/cancel, add feedback */
export async function PUT(req: Request, { params }: Params) {
  return handle(async () => {
    await requireAuth(req);
    const { id } = await params;
    const body = await readJson<Record<string, unknown>>(req);
    const existing = await db.interview.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Interview not found");

    const data: Record<string, string> = {};
    if ("interviewer" in body) {
      const interviewer = str(body.interviewer).trim();
      if (!interviewer) throw new ApiError(400, "Interviewer is required");
      data.interviewer = interviewer;
    }
    if ("date" in body) {
      const date = str(body.date).trim();
      if (!date) throw new ApiError(400, "Date is required");
      data.date = date;
    }
    if ("time" in body) {
      const time = str(body.time).trim();
      if (!time) throw new ApiError(400, "Time is required");
      data.time = time;
    }
    if ("feedback" in body) data.feedback = str(body.feedback);
    if ("status" in body) {
      const status = str(body.status);
      if (!isValidInterviewStatus(status)) throw new ApiError(400, "Invalid interview status");
      data.status = status;
    }

    const interview = await db.interview.update({
      where: { id },
      data,
      include: INCLUDE,
    });
    return json(interview);
  });
}

/** DELETE /api/interviews/:id */
export async function DELETE(req: Request, { params }: Params) {
  return handle(async () => {
    await requireAuth(req);
    const { id } = await params;
    const existing = await db.interview.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Interview not found");
    await db.interview.delete({ where: { id } });
    return json({ ok: true });
  });
}
