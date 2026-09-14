"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  ClipboardList,
  UserCheck,
  Users,
} from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ActivityStageIcon,
  ErrorState,
  formatDateTime,
  PageHeader,
  useLoadEffect,
} from "@/components/shared";
import { apiClient, DashboardData, SessionUser } from "@/lib/client";
import { NavState } from "@/components/app-shell";
import { REJECTED_STAGE, STAGES, STAGE_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function DashboardView({
  user,
  onNavigate,
}: {
  user: SessionUser;
  onNavigate: (state: NavState) => void;
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await apiClient.dashboard());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    }
  }, []);

  useLoadEffect(load);

  const stats = data?.stats;

  const cards = [
    { label: "Open Jobs", value: stats?.openJobs, sub: `${stats?.totalJobs ?? 0} total jobs`, icon: Briefcase, view: "jobs" as const },
    { label: "Candidates", value: stats?.totalCandidates, sub: "in talent database", icon: Users, view: "candidates" as const },
    { label: "Applications", value: stats?.totalApplications, sub: "across all jobs", icon: ClipboardList, view: "applications" as const },
    { label: "Interviews", value: stats?.upcomingInterviews, sub: "scheduled / upcoming", icon: CalendarDays, view: "interviews" as const },
    { label: "Hires", value: stats?.hires, sub: `${stats?.rejected ?? 0} rejected`, icon: UserCheck, view: "applications" as const },
  ];

  const maxPipeline = data ? Math.max(1, ...STAGES.map((s) => data.pipeline[s] ?? 0)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Here's what's happening across your recruitment pipeline today."
      />

      {error && <ErrorState message={error} onRetry={load} />}

      {!data && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            <Skeleton className="h-72 rounded-xl lg:col-span-3" />
            <Skeleton className="h-72 rounded-xl lg:col-span-2" />
          </div>
        </div>
      )}

      {data && stats && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
            {cards.map(({ label, value, sub, icon: Icon, view }) => (
              <button
                key={label}
                onClick={() => onNavigate({ view } as NavState)}
                className="group rounded-xl border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <Icon className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">{value ?? 0}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            {/* Pipeline */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Recruitment Pipeline</CardTitle>
                <CardAction>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate({ view: "applications" })}>
                    Open board
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-3">
                {STAGES.map((stage, idx) => {
                  const count = data.pipeline[stage] ?? 0;
                  return (
                    <div key={stage}>
                      <div className="relative flex items-center gap-3">
                        {idx < STAGES.length - 1 && (
                          <span className="absolute left-[11px] top-6 h-5 w-px bg-border" aria-hidden />
                        )}
                        <span
                          className={cn(
                            "z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full border bg-card text-[10px] font-semibold",
                            STAGE_STYLES[stage]
                          )}
                        >
                          {count}
                        </span>
                        <span className="w-24 text-sm font-medium">{stage}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              stage === "Hired"
                                ? "bg-emerald-500"
                                : stage === "Selected"
                                  ? "bg-teal-400"
                                  : stage === "Interview"
                                    ? "bg-violet-400"
                                    : stage === "Screening"
                                      ? "bg-amber-400"
                                      : "bg-slate-300"
                            )}
                            style={{ width: `${Math.round((count / maxPipeline) * 100)}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-sm tabular-nums text-muted-foreground">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center gap-3 border-t pt-3">
                  <span className="w-24 text-sm text-muted-foreground">Rejected</span>
                  <span className="text-sm font-medium text-red-600">
                    {data.pipeline[REJECTED_STAGE] ?? 0}
                  </span>
                  <span className="text-xs text-muted-foreground">candidates rejected</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent activity */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentActivity.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No pipeline activity yet.
                  </p>
                ) : (
                  <ul className="max-h-64 space-y-3 overflow-y-auto pr-1 thin-scrollbar">
                    {data.recentActivity.map((a) => (
                      <li key={a.id} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                          <ActivityStageIcon newStage={a.newStage} />
                        </span>
                        <div className="min-w-0 text-sm">
                          <p className="truncate">
                            <span className="font-medium">{a.candidate}</span>{" "}
                            {a.previousStage ? (
                              <>
                                moved <span className="text-muted-foreground">{a.previousStage} → {a.newStage}</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">applied</span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {a.job} · {formatDateTime(a.changedAt)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
