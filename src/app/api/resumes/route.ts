import { getStorage } from "@/lib/storage";
import { ApiError, handle, requireAuth } from "@/lib/api";

/**
 * GET /api/resumes?key=resumes/<id>-<name>.pdf
 * Authenticated resume download. Key must stay inside the storage scope.
 */
export async function GET(req: Request) {
  return handle(async () => {
    await requireAuth(req);
    const url = new URL(req.url);
    const key = url.searchParams.get("key") || "";
    if (!key || key.includes("..")) throw new ApiError(400, "Invalid storage key");

    const data = await getStorage().read(key);
    if (!data) throw new ApiError(404, "Resume file not found");

    const filename = key.split("/").pop() || "resume";
    const ext = filename.toLowerCase().split(".").pop();
    const types: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": types[ext || ""] || "application/octet-stream",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  });
}
