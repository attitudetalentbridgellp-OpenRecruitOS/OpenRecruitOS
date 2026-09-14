"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Avatar,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  formatDate,
  InterviewStatusBadge,
  PageHeader,
  TableSkeleton,
  useLoadEffect,
} from "@/components/shared";
import { Interview, apiClient } from "@/lib/client";
import { NavState } from "@/components/app-shell";
import { InterviewFormDialog } from "@/components/interview-form-dialog";

type Filter = "all" | "Scheduled" | "Completed" | "Cancelled";

export function InterviewsView({ onNavigate }: { onNavigate: (state: NavState) => void }) {
  const [interviews, setInterviews] = useState<Interview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Interview | null>(null);
  const [deleting, setDeleting] = useState<Interview | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setInterviews(await apiClient.listInterviews());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load interviews");
    }
  }, []);

  useLoadEffect(load);

  async function setStatus(interview: Interview, status: "Completed" | "Cancelled" | "Scheduled") {
    try {
      await apiClient.updateInterview(interview.id, { status });
      toast.success(`Interview marked ${status.toLowerCase()}`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update interview");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await apiClient.deleteInterview(deleting.id);
      toast.success("Interview deleted");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete interview");
    } finally {
      setDeleteBusy(false);
    }
  }

  const filtered = (interviews ?? []).filter((i) => (filter === "all" ? true : i.status === filter));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Interviews"
        description="Schedule, track and capture feedback for candidate interviews."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Schedule Interview
          </Button>
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="Scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="Completed">Completed</TabsTrigger>
          <TabsTrigger value="Cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {error && <ErrorState message={error} onRetry={load} />}
      {!interviews && !error && <TableSkeleton rows={4} />}

      {interviews && filtered.length === 0 && !error && (
        <EmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title={filter !== "all" ? `No ${filter.toLowerCase()} interviews` : "No interviews scheduled"}
          description={
            filter !== "all"
              ? "Try a different status filter."
              : "Schedule interviews from here or directly from the Applications board."
          }
          action={
            <Button
              variant="outline"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <CalendarPlus className="mr-2 h-4 w-4" /> Schedule interview
            </Button>
          }
        />
      )}

      {interviews && filtered.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Candidate</th>
                  <th className="px-4 py-3 font-medium">Job</th>
                  <th className="px-4 py-3 font-medium">Interviewer</th>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Feedback</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((iv) => (
                  <tr key={iv.id} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={iv.application?.candidate?.name ?? "?"} />
                        <span className="font-medium">{iv.application?.candidate?.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="max-w-40 px-4 py-3">
                      <p className="truncate text-muted-foreground">{iv.application?.job?.title ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">{iv.interviewer}</td>
                    <td className="px-4 py-3">
                      <p className="whitespace-nowrap">{formatDate(iv.date)}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {iv.time}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <InterviewStatusBadge status={iv.status} />
                    </td>
                    <td className="max-w-52 px-4 py-3">
                      <p className="truncate text-muted-foreground" title={iv.feedback}>
                        {iv.feedback || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for interview with ${iv.application?.candidate?.name}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(iv);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          {iv.status !== "Completed" && (
                            <DropdownMenuItem onClick={() => setStatus(iv, "Completed")}>
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Mark completed
                            </DropdownMenuItem>
                          )}
                          {iv.status !== "Cancelled" && iv.status !== "Completed" && (
                            <DropdownMenuItem onClick={() => setStatus(iv, "Cancelled")}>
                              <XCircle className="mr-2 h-4 w-4" /> Cancel interview
                            </DropdownMenuItem>
                          )}
                          {iv.status === "Cancelled" && (
                            <DropdownMenuItem onClick={() => setStatus(iv, "Scheduled")}>
                              <CalendarDays className="mr-2 h-4 w-4" /> Reschedule (mark scheduled)
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleting(iv)}>
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
            {filtered.map((iv) => (
              <div key={iv.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={iv.application?.candidate?.name ?? "?"} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{iv.application?.candidate?.name ?? "—"}</p>
                      <p className="truncate text-xs text-muted-foreground">{iv.application?.job?.title}</p>
                    </div>
                  </div>
                  <InterviewStatusBadge status={iv.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {formatDate(iv.date)} · {iv.time} · {iv.interviewer}
                  </span>
                  <span className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      aria-label="Edit interview"
                      onClick={() => {
                        setEditing(iv);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {iv.status === "Scheduled" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-emerald-600"
                          aria-label="Mark completed"
                          onClick={() => setStatus(iv, "Completed")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-red-600"
                          aria-label="Cancel interview"
                          onClick={() => setStatus(iv, "Cancelled")}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-red-600"
                      aria-label="Delete interview"
                      onClick={() => setDeleting(iv)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                </div>
                {iv.feedback && (
                  <p className="mt-2 rounded-md bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
                    “{iv.feedback}”
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <InterviewFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        interview={editing}
        onSaved={load}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this interview?"
        description="The interview record and its feedback will be permanently removed."
        onConfirm={handleDelete}
        busy={deleteBusy}
      />
    </div>
  );
}
