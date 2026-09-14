import { db } from "@/lib/db";
import { handle, json, requireAuth } from "@/lib/api";
import { ALL_STAGES, STAGES } from "@/lib/constants";

/**
 * GET /api/dashboard — headline stats, pipeline counts and recent activity.
 * Intentionally simple: no advanced analytics in the Community Edition.
 */
export async function GET(req: Request) {
  return handle(async () => {
    await requireAuth(req);

    const [openJobs, totalJobs, totalCandidates, totalApplications, upcomingInterviews, totalInterviews, stageGroups, history] =
      await Promise.all([
        db.job.count({ where: { status: "Open" } }),
        db.job.count(),
        db.candidate.count(),
        db.application.count(),
        db.interview.count({ where: { status: "Scheduled" } }),
        db.interview.count(),
        db.application.groupBy({ by: ["stage"], _count: { _all: true } }),
        db.applicationHistory.findMany({
          orderBy: { changedAt: "desc" },
          take: 10,
          include: {
            application: {
              select: {
                id: true,
                candidate: { select: { name: true } },
                job: { select: { title: true } },
              },
            },
          },
        }),
      ]);

    const pipeline: Record<string, number> = {};
    for (const s of ALL_STAGES) pipeline[s] = 0;
    for (const g of stageGroups) pipeline[g.stage] = g._count._all;

    const hires = pipeline["Hired"] || 0;
    const rejected = pipeline["Rejected"] || 0;

    // Recent activity: stage moves (incl. initial "Applied") across the pipeline
    const recentActivity = history.map((h) => ({
      id: h.id,
      candidate: h.application.candidate.name,
      job: h.application.job.title,
      previousStage: h.previousStage,
      newStage: h.newStage,
      changedAt: h.changedAt,
    }));

    return json({
      stats: {
        openJobs,
        totalJobs,
        totalCandidates,
        totalApplications,
        upcomingInterviews,
        totalInterviews,
        hires,
        rejected,
      },
      pipelineStages: STAGES,
      pipeline,
      recentActivity,
    });
  });
}
