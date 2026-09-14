"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  CalendarDays,
  ClipboardList,
  Clock,
  GripVertical,
  MoreHorizontal,
  Plus,
  Trash2,
  UserCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ALL_STAGES,
  REJECTED_STAGE,
  STAGES,
  STAGE_STYLES,
} from "@/lib/constants";
import { Application, apiClient } from "@/lib/client";
import { NavState } from "@/components/app-shell";
import { AddApplicationDialog } from "@/components/add-application-dialog";
import { InterviewFormDialog } from "@/components/interview-form-dialog";
import {
  Avatar,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  formatDate,
  formatDateTime,
  InterviewStatusBadge,
  PageHeader,
  StageBadge,
  useLoadEffect,
} from "@/components/shared";
import { cn } from "@/lib/utils";

/* --------------------------------- card --------------------------------- */

function ApplicationCard({
  app,
  onView,
  onSchedule,
  onMove,
  onRemove,
  dragging = false,
  overlay = false,
}: {
  app: Application;
  onView: () => void;
  onSchedule: () => void;
  onMove: (stage: string) => void;
  onRemove: () => void;
  dragging?: boolean;
  overlay?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm transition-shadow",
        overlay ? "w-64 rotate-1 shadow-lg" : "hover:shadow-md",
        dragging && "kanban-card-dragging"
      )}
    >
      <div className="flex items-start gap-2">
        <Avatar name={app.candidate?.name ?? "?"} className="h-8 w-8 text-[10px]" />
        <div className="min-w-0 flex-1">
          <button
            className="block max-w-full truncate text-left text-sm font-medium underline-offset-2 hover:underline"
            onClick={onView}
            title={app.candidate?.name}
          >
            {app.candidate?.name ?? "Unknown"}
          </button>
          <p className="truncate text-xs text-muted-foreground" title={app.job?.title}>
            {app.job?.title ?? "—"}
          </p>
        </div>
        {!overlay && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground"
                aria-label={`Actions for ${app.candidate?.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={onView}>View details</DropdownMenuItem>
              <DropdownMenuItem onClick={onSchedule}>
                <CalendarDays className="mr-2 h-4 w-4" /> Schedule interview
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Clock className="mr-2 h-4 w-4" /> Move to stage
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-72 thin-scrollbar">
                  {ALL_STAGES.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      disabled={s === app.stage}
                      onClick={() => onMove(s)}
                    >
                      {s}
                      {s === app.stage && <span className="ml-auto text-xs text-muted-foreground">current</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={onRemove}>
                <Trash2 className="mr-2 h-4 w-4" /> Remove application
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDate(app.appliedAt)}
        </span>
        {(app.interviews?.length ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            {app.interviews!.length} interview{app.interviews!.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}

function DraggableCard(props: {
  app: Application;
  onView: () => void;
  onSchedule: () => void;
  onMove: (stage: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: props.app.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn(isDragging && "opacity-40")}>
      <div className="group relative">
        <span className="absolute -left-0.5 top-1/2 hidden -translate-y-1/2 cursor-grab text-muted-foreground/50 md:block">
          <GripVertical className="h-4 w-4" />
        </span>
        <ApplicationCard {...props} dragging={isDragging} />
      </div>
    </div>
  );
}

/* --------------------------------- column -------------------------------- */

function KanbanColumn({
  stage,
  apps,
  onView,
  onSchedule,
  onMove,
  onRemove,
}: {
  stage: string;
  apps: Application[];
  onView: (app: Application) => void;
  onSchedule: (app: Application) => void;
  onMove: (app: Application, stage: string) => void;
  onRemove: (app: Application) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const isRejected = stage === REJECTED_STAGE;

  return (
    <div className="flex w-[280px] shrink-0 flex-col rounded-xl border bg-muted/30 md:w-[300px]">
      <div className="flex items-center justify-between gap-2 border-b bg-card/60 px-3 py-2.5 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              stage === "Hired"
                ? "bg-emerald-500"
                : stage === "Selected"
                  ? "bg-teal-400"
                  : stage === "Interview"
                    ? "bg-violet-400"
                    : stage === "Screening"
                      ? "bg-amber-400"
                      : stage === "Rejected"
                        ? "bg-red-400"
                        : "bg-slate-300"
            )}
          />
          <h3 className="text-sm font-semibold">{stage}</h3>
          <span
            className={cn(
              "rounded-full border px-1.5 py-px text-[11px] font-medium tabular-nums",
              STAGE_STYLES[stage] ?? "bg-slate-100 text-slate-600 border-slate-200"
            )}
          >
            {apps.length}
          </span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex max-h-[calc(100vh-320px)] min-h-[120px] flex-1 flex-col gap-2 overflow-y-auto p-2 thin-scrollbar",
          isOver && "bg-emerald-50/60 ring-2 ring-inset ring-emerald-300 rounded-b-xl"
        )}
        aria-label={`${stage} column with ${apps.length} applications`}
      >
        {apps.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
            {isRejected ? "No rejected candidates" : "Drop candidates here"}
          </div>
        ) : (
          apps.map((app) => (
            <DraggableCard
              key={app.id}
              app={app}
              onView={() => onView(app)}
              onSchedule={() => onSchedule(app)}
              onMove={(s) => onMove(app, s)}
              onRemove={() => onRemove(app)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------ detail dialog ----------------------------- */

function ApplicationDetailDialog({
  app,
  onClose,
  onChanged,
  onScheduleInterview,
  onNavigate,
}: {
  app: Application | null;
  onClose: () => void;
  onChanged: () => void;
  onScheduleInterview: (app: Application) => void;
  onNavigate: (state: NavState) => void;
}) {
  const [removing, setRemoving] = useState(false);
  const [removeBusy, setRemoveBusy] = useState(false);

  if (!app) return null;

  async function move(stage: string) {
    if (!app) return;
    try {
      await apiClient.moveApplication(app.id, stage);
      toast.success(`Moved to ${stage}`);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not move candidate");
    }
  }

  async function handleRemove() {
    if (!app) return;
    setRemoveBusy(true);
    try {
      await apiClient.deleteApplication(app.id);
      toast.success("Application removed");
      setRemoveBusy(false);
      onClose();
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove application");
      setRemoveBusy(false);
    }
  }

  return (
    <Dialog open={!!app} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto thin-scrollbar sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar name={app.candidate?.name ?? "?"} />
            <span className="min-w-0">
              <span className="block truncate">{app.candidate?.name}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {app.job?.title}
              </span>
            </span>
          </DialogTitle>
          <DialogDescription>Application details, stage history and interviews.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3 rounded-lg border p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Candidate</p>
            <p className="font-medium">{app.candidate?.name}</p>
            <p className="text-muted-foreground">{app.candidate?.email || "No email"}</p>
            <p className="text-muted-foreground">{app.candidate?.phone || "No phone"}</p>
            {app.candidate?.skills && (
              <p className="text-xs text-muted-foreground">Skills: {app.candidate.skills}</p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onNavigate({ view: "candidate-detail", candidateId: app.candidateId });
                }}
              >
                View profile
              </Button>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Application</p>
            <p>
              <span className="text-muted-foreground">Applied:</span>{" "}
              {formatDate(app.appliedAt)}
            </p>
            <p>
              <span className="text-muted-foreground">Current stage:</span>{" "}
              <StageBadge stage={app.stage} className="ml-1" />
            </p>
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs text-muted-foreground">Move to stage</Label>
              <Select value={app.stage} onValueChange={move}>
                <SelectTrigger size="sm" aria-label="Move to stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STAGES.map((s) => (
                    <SelectItem key={s} value={s} disabled={s === app.stage}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" onClick={() => onScheduleInterview(app)}>
                <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Schedule interview
              </Button>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="rounded-lg border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Stage History
          </p>
          {app.history && app.history.length > 0 ? (
            <ol className="mt-2 space-y-2">
              {app.history.map((h) => (
                <li key={h.id} className="flex items-center gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {h.previousStage ? (
                    <span>
                      {h.previousStage} <span aria-hidden>→</span> <StageBadge stage={h.newStage} className="mx-0.5" />
                    </span>
                  ) : (
                    <span>
                      Applied <span aria-hidden>→</span> <StageBadge stage={h.newStage} className="mx-0.5" />
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">{formatDateTime(h.changedAt)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No history recorded.</p>
          )}
        </div>

        {/* Interviews */}
        <div className="rounded-lg border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Interviews ({app.interviews?.length ?? 0})
          </p>
          {(app.interviews?.length ?? 0) === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No interviews scheduled yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {app.interviews!.map((iv) => (
                <div key={iv.id} className="rounded-lg border p-2.5 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{iv.interviewer}</span>
                    <InterviewStatusBadge status={iv.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(iv.date)} at {iv.time}
                  </p>
                  {iv.feedback && (
                    <p className="mt-1.5 rounded-md bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
                      “{iv.feedback}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-600" onClick={() => setRemoving(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Remove application
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title="Remove this application?"
        description={`${app.candidate?.name ?? "This candidate"} will be removed from “${app.job?.title}” along with its interviews and history.`}
        onConfirm={handleRemove}
        busy={removeBusy}
      />
    </Dialog>
  );
}

/* --------------------------------- board --------------------------------- */

export function ApplicationsView({
  onNavigate,
  focusApplicationId,
}: {
  onNavigate: (state: NavState) => void;
  focusApplicationId?: string;
}) {
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobFilter, setJobFilter] = useState("all");
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [detailAppId, setDetailAppId] = useState<string | null>(null);
  const [scheduleFor, setScheduleFor] = useState<Application | null>(null);
  const [dragApp, setDragApp] = useState<Application | null>(null);

  const load = useCallback(async () => {
    try {
      const [applications, allJobs] = await Promise.all([apiClient.listApplications(), apiClient.listJobs()]);
      setApps(applications);
      setJobs(allJobs.map((j) => ({ id: j.id, title: j.title })));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    }
  }, []);

  useLoadEffect(load);

  // The open detail dialog always reflects the freshest application data
  const detailApp = detailAppId ? (apps ?? []).find((a) => a.id === detailAppId) ?? null : null;

  const filtered = useMemo(
    () => (apps ?? []).filter((a) => (jobFilter === "all" ? true : a.jobId === jobFilter)),
    [apps, jobFilter]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  async function moveApplication(app: Application, stage: string) {
    if (app.stage === stage) return;
    try {
      await apiClient.moveApplication(app.id, stage);
      toast.success(
        `${app.candidate?.name ?? "Candidate"} moved to ${stage}`,
        { description: `${app.job?.title ?? ""}` }
      );
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not move candidate");
    }
  }

  function onDragStart(event: unknown) {
    const e = event as { active: { id: string | number } };
    if (apps) {
      const app = apps.find((a) => a.id === e.active.id) ?? null;
      setDragApp(app);
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    setDragApp(null);
    const { active, over } = event;
    if (!over || !apps) return;
    const app = apps.find((a) => a.id === active.id);
    if (!app) return;
    const targetStage = String(over.id);
    if (ALL_STAGES.includes(targetStage as (typeof ALL_STAGES)[number])) {
      await moveApplication(app, targetStage);
    }
  }

  const boardStages = [...STAGES, REJECTED_STAGE];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Applications"
        description="Drag candidates across the pipeline, or use the card menu on touch devices."
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Candidate to Job
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:w-72">
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger aria-label="Filter by job">
              <SelectValue placeholder="Filter by job" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All jobs</SelectItem>
              {jobs.map((j) => (
                <SelectItem key={j.id} value={j.id}>
                  {j.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          {filtered.length} application{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {!apps && !error && (
        <div className="flex gap-3 overflow-hidden">
          {boardStages.map((s) => (
            <Skeleton key={s} className="h-96 w-[280px] shrink-0 rounded-xl" />
          ))}
        </div>
      )}

      {apps && apps.length === 0 && !error && (
        <EmptyState
          icon={<ClipboardList className="h-5 w-5" />}
          title="No applications yet"
          description="Add a candidate to a job to start moving them through the pipeline."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Candidate to Job
            </Button>
          }
        />
      )}

      {apps && apps.length > 0 && (
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setDragApp(null)}
        >
          <div className="-mx-4 overflow-x-auto px-4 pb-2 thin-scrollbar sm:mx-0 sm:px-0">
            <div className="flex items-start gap-3">
              {boardStages.map((stage) => (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  apps={filtered.filter((a) => a.stage === stage)}
                  onView={(app) => setDetailAppId(app.id)}
                  onSchedule={(app) => setScheduleFor(app)}
                  onMove={moveApplication}
                  onRemove={(app) => setDetailAppId(app.id)}
                />
              ))}
            </div>
          </div>

          <DragOverlay dropAnimation={null}>
            {dragApp ? (
              <ApplicationCard
                app={dragApp}
                overlay
                onView={() => {}}
                onSchedule={() => {}}
                onMove={() => {}}
                onRemove={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <AddApplicationDialog open={addOpen} onOpenChange={setAddOpen} onCreated={load} />

      <ApplicationDetailDialog
        key={detailAppId ?? "none"}
        app={detailApp}
        onClose={() => setDetailAppId(null)}
        onChanged={load}
        onScheduleInterview={(app) => setScheduleFor(app)}
        onNavigate={onNavigate}
      />

      <InterviewFormDialog
        open={!!scheduleFor}
        onOpenChange={(open) => !open && setScheduleFor(null)}
        presetApplicationId={scheduleFor?.id}
        onSaved={() => {
          load();
        }}
      />
    </div>
  );
}
