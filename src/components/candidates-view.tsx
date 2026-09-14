"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  CalendarDays,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ALL_STAGES,
} from "@/lib/constants";
import {
  apiClient,
  Candidate,
  CandidateDetail,
  Interview,
} from "@/lib/client";
import { NavState } from "@/components/app-shell";
import { CandidateFormDialog } from "@/components/candidate-form-dialog";
import { AddApplicationDialog } from "@/components/add-application-dialog";
import {
  Avatar,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  formatDate,
  InterviewStatusBadge,
  PageHeader,
  splitList,
  StageBadge,
  TableSkeleton,
  TagBadge,
  useLoadEffect,
} from "@/components/shared";

/* ------------------------------- Candidates list ------------------------------ */

export function CandidatesView({ onNavigate }: { onNavigate: (state: NavState) => void }) {
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [deleting, setDeleting] = useState<Candidate | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setCandidates(await apiClient.listCandidates(query.trim() || undefined));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load candidates");
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(load, query ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await apiClient.deleteCandidate(deleting.id);
      toast.success("Candidate deleted");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete candidate");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Candidates"
        description="Your talent database — add candidates manually or by uploading resumes."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>
        }
      />

      <div className="relative sm:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, skill, tag…"
          className="pl-8"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search candidates"
        />
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {!candidates && !error && <TableSkeleton rows={5} />}

      {candidates && candidates.length === 0 && !error && (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title={query ? "No candidates match your search" : "No candidates yet"}
          description={
            query
              ? "Try a different name, skill or tag."
              : "Add your first candidate — upload a resume and we'll pre-fill the profile."
          }
          action={
            query ? (
              <Button variant="outline" onClick={() => setQuery("")}>
                Clear search
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add candidate
              </Button>
            )
          }
        />
      )}

      {candidates && candidates.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Candidate</th>
                  <th className="px-4 py-3 font-medium">Skills</th>
                  <th className="px-4 py-3 font-medium">Experience</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 text-center font-medium">Applications</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/30"
                    onClick={() => onNavigate({ view: "candidate-detail", candidateId: c.id })}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} />
                        <div className="min-w-0">
                          <p className="font-medium">{c.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{c.email || "No email"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-52 px-4 py-3">
                      <p className="truncate text-muted-foreground">{c.skills || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.experience || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.location || "—"}</td>
                    <td className="px-4 py-3 text-center font-medium tabular-nums">
                      {c._count?.applications ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${c.name}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => onNavigate({ view: "candidate-detail", candidateId: c.id })}>
                            View profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(c);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleting(c)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {candidates.map((c) => (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                className="rounded-xl border bg-card p-4 shadow-sm"
                onClick={() => onNavigate({ view: "candidate-detail", candidateId: c.id })}
                onKeyDown={(e) => e.key === "Enter" && onNavigate({ view: "candidate-detail", candidateId: c.id })}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.email || "No email"}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{c.experience || ""}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{c.skills || "No skills listed"}</span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {c._count?.applications ?? 0} applications
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <CandidateFormDialog open={formOpen} onOpenChange={setFormOpen} candidate={editing} onSaved={load} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete “${deleting?.name ?? ""}”?`}
        description="This permanently deletes the candidate, their applications, interviews and stored resume."
        onConfirm={handleDelete}
        busy={deleteBusy}
      />
    </div>
  );
}

/* ------------------------------ Candidate detail ------------------------------ */

export function CandidateDetailView({
  candidateId,
  onNavigate,
}: {
  candidateId: string;
  onNavigate: (state: NavState) => void;
}) {
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addJobOpen, setAddJobOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setCandidate(await apiClient.getCandidate(candidateId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load candidate");
    }
  }, [candidateId]);

  useLoadEffect(load);

  async function handleDelete() {
    setDeleteBusy(true);
    try {
      await apiClient.deleteCandidate(candidateId);
      toast.success("Candidate deleted");
      onNavigate({ view: "candidates" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete candidate");
      setDeleteBusy(false);
    }
  }

  async function moveStage(applicationId: string, stage: string) {
    try {
      await apiClient.moveApplication(applicationId, stage);
      toast.success(`Moved to ${stage}`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not move candidate");
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => onNavigate({ view: "candidates" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Candidates
        </Button>
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-36 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    );
  }

  const interviews: Interview[] = candidate.applications.flatMap((a) => a.interviews ?? []);

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={() => onNavigate({ view: "candidates" })}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Candidates
      </Button>

      {/* Profile header */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar name={candidate.name} className="h-14 w-14 rounded-2xl text-lg" />
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{candidate.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {candidate.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {candidate.email}
                  </span>
                )}
                {candidate.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {candidate.phone}
                  </span>
                )}
                {candidate.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {candidate.location}
                  </span>
                )}
              </div>
              {splitList(candidate.tags).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {splitList(candidate.tags).map((t) => (
                    <TagBadge key={t} tag={t} />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap shrink-0 gap-2">
            <Button onClick={() => setAddJobOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add to Job
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:bg-red-50 hover:text-red-600"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: profile info */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Profile</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5" /> Experience
                </dt>
                <dd className="text-right font-medium">{candidate.experience || "—"}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Banknote className="h-3.5 w-3.5" /> Salary
                </dt>
                <dd className="text-right font-medium">{candidate.salary || "—"}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Notice Period
                </dt>
                <dd className="text-right font-medium">{candidate.noticePeriod || "—"}</dd>
              </div>
            </dl>
            <Separator className="my-4" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Skills</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {splitList(candidate.skills).length ? (
                splitList(candidate.skills).map((s) => (
                  <Badge key={s} variant="secondary" className="font-normal">
                    {s}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No skills listed</span>
              )}
            </div>
            <Separator className="my-4" />
            <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <GraduationCap className="h-4 w-4" /> Education
            </h3>
            <p className="mt-1.5 text-sm">{candidate.education || "No education details"}</p>
          </div>

          {/* Resume */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Resume</h2>
            {candidate.resume ? (
              <div className="mt-3 flex items-center gap-3 rounded-lg border px-3 py-2.5">
                <FileText className="h-5 w-5 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{candidate.resumeName || "Resume"}</p>
                  <p className="text-xs text-muted-foreground">Uploaded file</p>
                </div>
                <a
                  href={apiClient.resumeUrl(candidate.resume)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors hover:bg-accent"
                >
                  <Download className="h-3.5 w-3.5" /> View
                </a>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No resume uploaded.{" "}
                <button className="font-medium text-emerald-700 underline-offset-2 hover:underline" onClick={() => setEditOpen(true)}>
                  Upload one now
                </button>
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notes</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {candidate.notes || "No notes yet."}
            </p>
          </div>
        </div>

        {/* Right: applications + interviews */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Applications ({candidate.applications.length})
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setAddJobOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add to job
              </Button>
            </div>

            {candidate.applications.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Not applied to any job yet.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {candidate.applications.map((app) => (
                  <div key={app.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        className="text-left text-sm font-medium underline-offset-2 hover:underline"
                        onClick={() => onNavigate({ view: "job-detail", jobId: app.job.id })}
                      >
                        {app.job.title}
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Applied {formatDate(app.appliedAt)}
                        </span>
                        <StageBadge stage={app.stage} />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {app.job.location || "—"} · {app.job.employmentType}
                      </p>
                      <Select value={app.stage} onValueChange={(s) => moveStage(app.id, s)}>
                        <SelectTrigger className="h-7 w-36 text-xs" aria-label={`Move ${candidate.name} to stage`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_STAGES.map((s) => (
                            <SelectItem key={s} value={s}>
                              Move to {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Interviews ({interviews.length})
            </h2>
            {interviews.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No interviews scheduled yet.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {interviews.map((iv) => (
                  <div key={iv.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {iv.interviewer} · {iv.application?.job?.title}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(iv.date)} at {iv.time}
                      </p>
                    </div>
                    <InterviewStatusBadge status={iv.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CandidateFormDialog open={editOpen} onOpenChange={setEditOpen} candidate={candidate} onSaved={load} />
      <AddApplicationDialog
        open={addJobOpen}
        onOpenChange={setAddJobOpen}
        defaultCandidateId={candidate.id}
        onCreated={load}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete “${candidate.name}”?`}
        description="This permanently deletes the candidate, their applications, interviews and stored resume."
        onConfirm={handleDelete}
        busy={deleteBusy}
      />
    </div>
  );
}
