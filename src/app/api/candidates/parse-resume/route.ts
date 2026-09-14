import { getStorage } from "@/lib/storage";
import { getResumeParser } from "@/lib/resume-parser";
import { ApiError, handle, json, requireAuth } from "@/lib/api";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED = [".pdf", ".doc", ".docx"];

/**
 * POST /api/candidates/parse-resume
 * multipart/form-data with a `file` field.
 * Stores the file via the storage abstraction and returns extracted fields
 * so the recruiter can review/edit before saving the candidate.
 */
export async function POST(req: Request) {
  return handle(async () => {
    await requireAuth(req);

    const form = await req.formData().catch(() => null);
    if (!form) throw new ApiError(400, "Expected multipart/form-data");
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "Resume file is required");
    if (file.size === 0) throw new ApiError(400, "File is empty");
    if (file.size > MAX_SIZE) throw new ApiError(400, "File is too large (max 10 MB)");

    const filename = file.name || "resume";
    const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
    if (!ALLOWED.includes(ext)) {
      throw new ApiError(400, "Unsupported format. Allowed: PDF, DOC, DOCX");
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1) Store the file (local driver in Community Edition — pluggable for S3 later)
    const key = await getStorage().save("resumes", filename, buffer);

    // 2) Basic parsing (no AI) — modular behind the ResumeParser interface
    let parsed = { name: "", email: "", phone: "", skills: "", experience: "", education: "" };
    let parseError: string | null = null;
    try {
      const parser = getResumeParser();
      const text = await parser.extractText(buffer, filename);
      parsed = parser.parse(text || "");
    } catch (err) {
      console.error("[parse-resume] extraction failed:", err);
      parseError = "Could not extract text from this file. You can still fill the details manually.";
    }

    return json({ resume: key, resumeName: filename, parsed, parseError }, 201);
  });
}
