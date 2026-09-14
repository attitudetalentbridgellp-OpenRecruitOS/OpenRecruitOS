"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  Building2,
  CalendarDays,
  ExternalLink,
  Loader2,
  MapPin,
  MoreHorizontal,
  Pencil,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Avatar,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  formatDate,
  JobStatusBadge,
  PageHeader,
  splitList,
  StageBadge,
  TableSkeleton,
  useLoadEffect,
} from "@/components/shared";
import { apiClient, Job, JobDetail } from "@/lib/client";
import { NavState } from "@/components/app-shell";
import { EMPLOYMENT_TYPES, JOB_STATUSES } from "@/lib/constants";

/* ------------------------------ Job form dialog ----------------------------- */

export function JobFormDialog({
  open,
  onOpenChange,
  job,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Job | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    skills: "",
    experience: "",
    location: "",
    salary: "",
    employmentType: "Full-time",
    status: "Open",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setForm({
        title: job?.title ?? "",
        description: job?.description ?? "",
        skills: job?.skills ?? "",
        experience: job?.experience ?? "",
        location: job?.location ?? "",
        salary: job?.salary ?? "",
        employmentType: job?.employmentType ?? "Full-time",
        status: job?.status ?? "Open",
      });
    }
  }, [open, job]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError("Job title is required");
      return;
    }
    setBusy(true);
    try {
      if (job) {
        await apiClient.updateJob(job.id, form);
        toast.success("Job updated");
      } else {
        await apiClient.createJob(form);
        toast.success("Job created");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl thin-scrollbar">
        <DialogHeader>
          <DialogTitle>{job ? "Edit Job" : "Create Job"}</DialogTitle>
          <DialogDescription>
            {job ? "Update the job details below." : "Fill in the details to post a new job."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="job-title">Job Title *</Label>
            <Input
              id="job-title"
              placeholder="e.g. Senior Frontend Developer"
              value={form.title}
              onChange={(e) => set("title")(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="job-description">Job Description</Label>
            <Textarea
              id="job-description"
              rows={4}
              placeholder="Responsibilities, requirements, culture…"
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-skills">Skills (comma-separated)</Label>
            <Input
              id="job-skills"
              placeholder="React, TypeScript, Node.js"
              value={form.skills}
              onChange={(e) => set("skills")(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-experience">Experience</Label>
            <Input
              id="job-experience"
              placeholder="e.g. 2-4 years"
              value={form.experience}
              onChange={(e) => set("experience")(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-location">Location</Label>
            <Input
              id="job-location"
              placeholder="e.g. Bengaluru / Remote"
              value={form.location}
              onChange={(e) => set("location")(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-salary">Salary</Label>
            <Input
              id="job-salary"
              placeholder="e.g. ₹12,00,000 - ₹18,00,000 per year"
              value={form.salary}
              onChange={(e) => set("salary")(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Employment Type</Label>
            <Select value={form.employmentType} onValueChange={set("employmentType")}>
              <SelectTrigger aria-label="Employment type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Job Status</Label>
            <Select value={form.status} onValueChange={set("status")}>
              <SelectTrigger aria-label="Job status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {JOB_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
              {error}
            </div>
          )}

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {job ? "Save changes" : "Create job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------- Jobs list -------------------------------- */

type JobFilter = "all" | "Open" | "Closed";

export function JobsView({ onNavigate }: { onNavigate: (state: NavState) => void }) {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<JobFilter>("all");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState<Job | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setJobs(await apiClient.listJobs());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    }
  }, []);

  useLoadEffect(load);

  async function toggleStatus(job: Job) {
    const next = job.status === "Open" ? "Closed" : "Open";
    try {
      await apiClient.updateJob(job.id, { status: next });
      toast.success(`Job marked ${next}`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update job status");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await apiClient.deleteJob(deleting.id);
      toast.success("Job deleted");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete job");
    } finally {
      setDeleteBusy(false);
    }
  }

  const filtered = (jobs ?? [])
    .filter((j) => (filter === "all" ? true : j.status === filter))
    .filter((j) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        j.title.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.skills.toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Jobs"
        description="Manage your open positions and track applications."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search jobs…"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search jobs"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as JobFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Open">Open</TabsTrigger>
            <TabsTrigger value="Closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {!jobs && !error && <TableSkeleton rows={4} />}

      {jobs && filtered.length === 0 && !error && (
        <EmptyState
          icon={<Briefcase className="h-5 w-5" />}
          title={query || filter !== "all" ? "No jobs match your filters" : "No jobs yet"}
          description={
            query || filter !== "all"
              ? "Try a different search term or status filter."
              : "Create your first job to start building your pipeline."
          }
          action={
            (query || filter !== "all") ? (
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create job
              </Button>
            )
          }
        />
      )}

      {jobs && filtered.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Job</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Experience</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-center font-medium">Candidates</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr
                    key={job.id}
                    className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/30"
                    onClick={() => onNavigate({ view: "job-detail", jobId: job.id })}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{job.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDate(job.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{job.location || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{job.experience || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="font-normal">
                        {job.employmentType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <JobStatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3 text-center font-medium tabular-nums">
                      {job._count?.applications ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${job.title}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => onNavigate({ view: "job-detail", jobId: job.id })}>
                            <ExternalLink className="mr-2 h-4 w-4" /> View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(job);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(job)}>
                            {job.status === "Open" ? "Mark Closed" : "Reopen (Open)"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeleting(job)}
                          >
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
            {filtered.map((job) => (
              <div
                key={job.id}
                role="button"
                tabIndex={0}
                className="rounded-xl border bg-card p-4 shadow-sm"
                onClick={() => onNavigate({ view: "job-detail", jobId: job.id })}
                onKeyDown={(e) => e.key === "Enter" && onNavigate({ view: "job-detail", jobId: job.id })}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{job.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {job.location || "—"} · {job.employmentType}
                    </p>
                  </div>
                  <JobStatusBadge status={job.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {job._count?.applications ?? 0} candidates · {job.experience || "Any exp."}
                  </span>
                  <span className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(job);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleting(job);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <JobFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        job={editing}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete “${deleting?.title ?? ""}”?`}
        description="This permanently deletes the job along with its applications, interviews and stage history."
        onConfirm={handleDelete}
        busy={deleteBusy}
      />
    </div>
  );
}

/* -------------------------------- Job detail -------------------------------- */

export function JobDetailView({
  jobId,
  onNavigate,
}: {
  jobId: string;
  onNavigate: (state: NavState) => void;
}) {
  const [job, setJob] = useState<JobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setJob(await apiClient.getJob(jobId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job");
    }
  }, [jobId]);

  useLoadEffect(load);

  async function toggleStatus() {
    if (!job) return;
    setStatusBusy(true);
    try {
      const next = job.status === "Open" ? "Closed" : "Open";
      await apiClient.updateJob(job.id, { status: next });
      toast.success(`Job marked ${next}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setStatusBusy(false);
    }
  }

  async function handleDelete() {
    setDeleteBusy(true);
    try {
      await apiClient.deleteJob(jobId);
      toast.success("Job deleted");
      onNavigate({ view: "jobs" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete job");
      setDeleteBusy(false);
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => onNavigate({ view: "jobs" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
        </Button>
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={() => onNavigate({ view: "jobs" })}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{job.title}</h1>
            <JobStatusBadge status={job.status} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {job.location || "—"}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" /> {job.employmentType}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {job.applications.length} candidates
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> Posted {formatDate(job.createdAt)}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            onClick={toggleStatus}
            disabled={statusBusy}
          >
            {statusBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {job.status === "Open" ? "Close job" : "Reopen job"}
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

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Job info */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Job Information
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Experience</dt>
                <dd className="mt-0.5 font-medium">{job.experience || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Salary</dt>
                <dd className="mt-0.5 flex items-center gap-1 font-medium">
                  <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                  {job.salary || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Employment Type</dt>
                <dd className="mt-0.5 font-medium">{job.employmentType}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Location</dt>
                <dd className="mt-0.5 font-medium">{job.location || "—"}</dd>
              </div>
            </dl>
            <Separator className="my-4" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Skills Required
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {splitList(job.skills).length ? (
                splitList(job.skills).map((s) => (
                  <Badge key={s} variant="secondary" className="font-normal">
                    {s}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No skills listed</span>
              )}
            </div>
            {job.description && (
              <>
                <Separator className="my-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {job.description}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Candidates for this job */}
        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Candidates ({job.applications.length})
          </h2>
          {job.applications.length === 0 ? (
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title="No candidates yet"
              description="Add candidates to this job from the Applications board or the candidate's profile."
              action={
                <Button variant="outline" onClick={() => onNavigate({ view: "applications" })}>
                  Open Applications board
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {job.applications.map((app) => (
                <div
                  key={app.id}
                  role="button"
                  tabIndex={0}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                  onClick={() => onNavigate({ view: "candidate-detail", candidateId: app.candidate.id })}
                  onKeyDown={(e) =>
                    e.key === "Enter" && onNavigate({ view: "candidate-detail", candidateId: app.candidate.id })
                  }
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={app.candidate.name} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{app.candidate.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {app.candidate.email || "No email"}
                        {app.candidate.location ? ` · ${app.candidate.location}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {app.interviews && app.interviews.length > 0 && (
                      <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {app.interviews.length}
                      </span>
                    )}
                    <StageBadge stage={app.stage} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <JobFormDialog open={editOpen} onOpenChange={setEditOpen} job={job} onSaved={load} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete “${job.title}”?`}
        description="This permanently deletes the job along with its applications, interviews and stage history."
        onConfirm={handleDelete}
        busy={deleteBusy}
      />
    </div>
  );
}
