"use client";

// OpenRecruitOS — shared UI building blocks

import { ReactNode, useEffect } from "react";
import { format, isValid, parseISO } from "date-fns";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Inbox,
  Loader2,
  XCircle,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { INTERVIEW_STATUS_STYLES, STAGE_STYLES } from "@/lib/constants";

/* ------------------------------ data loading ------------------------------ */

/** Defers a load function to a macrotask so effects never setState synchronously. */
export function useLoadEffect(load: () => void) {
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);
}

/* ------------------------------- formatting ------------------------------- */

export function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  const d = typeof value === "string" ? parseISO(value) : value;
  return isValid(d) ? format(d, "dd MMM yyyy") : "—";
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return "—";
  const d = typeof value === "string" ? parseISO(value) : value;
  return isValid(d) ? format(d, "dd MMM yyyy, HH:mm") : "—";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

export function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/* --------------------------------- badges --------------------------------- */

export function StageBadge({ stage, className }: { stage: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STAGE_STYLES[stage], className)}>
      {stage}
    </Badge>
  );
}

export function InterviewStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", INTERVIEW_STATUS_STYLES[status])}>
      {status}
    </Badge>
  );
}

export function JobStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        status === "Open"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-100 text-slate-600 border-slate-200"
      )}
    >
      {status === "Open" && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />}
      {status}
    </Badge>
  );
}

export function TagBadge({ tag }: { tag: string }) {
  return <Badge variant="secondary" className="font-normal">#{tag}</Badge>;
}

/* -------------------------------- avatars --------------------------------- */

const AVATAR_TONES = [
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
];

export function Avatar({ name, className }: { name: string; className?: string }) {
  const tone = AVATAR_TONES[name.length % AVATAR_TONES.length];
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        tone,
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}

/* ------------------------------ page headers ------------------------------ */

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

/* --------------------------------- states --------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <AlertTriangle className="mb-2 h-6 w-6 text-red-500" />
      <p className="font-medium text-red-800">Something went wrong</p>
      <p className="mt-1 max-w-md text-sm text-red-600">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 rounded-xl border bg-card p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-28 sm:block" />
          <Skeleton className="hidden h-4 w-20 md:block" />
        </div>
      ))}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

/* ---------------------------- confirmation dialog --------------------------- */

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  destructive = true,
  onConfirm,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {destructive && <AlertTriangle className="h-5 w-5 text-red-500" />}
            {title}
          </DialogTitle>
          <DialogDescription>{description ?? "This action cannot be undone."}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------ activity icons ----------------------------- */

export function ActivityStageIcon({ newStage }: { newStage: string }) {
  if (newStage === "Hired") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (newStage === "Rejected") return <XCircle className="h-4 w-4 text-red-500" />;
  if (newStage === "Interview") return <CalendarDays className="h-4 w-4 text-violet-500" />;
  return <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />;
}
