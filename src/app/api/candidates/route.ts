import { db } from "@/lib/db";
import { ApiError, handle, json, readJson, requireAuth, str } from "@/lib/api";

/** GET /api/candidates — list candidates with application counts */
export async function GET(req: Request) {
  return handle(async () => {
    await requireAuth(req);
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();
    const candidates = await db.candidate.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
              { skills: { contains: q } },
              { location: { contains: q } },
              { tags: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { applications: true } } },
    });
    return json(candidates);
  });
}

/** POST /api/candidates — create candidate (optionally referencing an uploaded resume key) */
export async function POST(req: Request) {
  return handle(async () => {
    await requireAuth(req);
    const body = await readJson<Record<string, unknown>>(req);
    const name = str(body.name).trim();
    if (!name) throw new ApiError(400, "Candidate name is required");
    const email = str(body.email).trim();
    if (email) {
      const dup = await db.candidate.findFirst({ where: { email } });
      if (dup) throw new ApiError(409, "A candidate with this email already exists");
    }
    const candidate = await db.candidate.create({
      data: {
        name,
        email,
        phone: str(body.phone),
        resume: str(body.resume),
        resumeName: str(body.resumeName),
        skills: str(body.skills),
        experience: str(body.experience),
        education: str(body.education),
        location: str(body.location),
        salary: str(body.salary),
        noticePeriod: str(body.noticePeriod),
        notes: str(body.notes),
        tags: str(body.tags),
      },
      include: { _count: { select: { applications: true } } },
    });
    return json(candidate, 201);
  });
}
