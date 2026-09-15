// OpenRecruitOS — Shared domain constants & types

export const APP_NAME = "OpenRecruitOS";
export const APP_TAGLINE = "The Open Source Recruitment Operating System";
export const APP_BY = "By Attitude360";
/** Formal legal name of the company behind OpenRecruitOS. */
export const APP_COMPANY = "Attitude TalentBridge LLP";
export const APP_WEBSITE = "attitude360.in";
export const APP_WEBSITE_URL = "https://attitude360.in";

/** Pipeline stages in canonical order. Rejected is a separate terminal status. */
export const STAGES = ["Applied", "Screening", "Interview", "Selected", "Hired"] as const;
export const ALL_STAGES = [...STAGES, "Rejected"] as const;
export type Stage = (typeof ALL_STAGES)[number];

export const REJECTED_STAGE = "Rejected";

export const APPLICATION_STATUSES = ["Active", "Hired", "Rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const INTERVIEW_STATUSES = ["Scheduled", "Completed", "Cancelled"] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const JOB_STATUSES = ["Open", "Closed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/** Maps a stage to the derived Application.status */
export function statusForStage(stage: string): ApplicationStatus {
  if (stage === "Hired") return "Hired";
  if (stage === REJECTED_STAGE) return "Rejected";
  return "Active";
}

export function isValidStage(stage: string): stage is Stage {
  return (ALL_STAGES as readonly string[]).includes(stage);
}

export function isValidInterviewStatus(s: string): s is InterviewStatus {
  return (INTERVIEW_STATUSES as readonly string[]).includes(s);
}

/** Stage badge tone classes used across the UI — blue→teal→green ramp mirrors the logo gradient */
export const STAGE_STYLES: Record<string, string> = {
  Applied: "bg-slate-100 text-slate-700 border-slate-200",
  Screening: "bg-sky-50 text-sky-700 border-sky-200",
  Interview: "bg-blue-50 text-blue-700 border-blue-200",
  Selected: "bg-teal-50 text-teal-700 border-teal-200",
  Hired: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
};

export const INTERVIEW_STATUS_STYLES: Record<string, string> = {
  Scheduled: "bg-sky-50 text-sky-700 border-sky-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
};
