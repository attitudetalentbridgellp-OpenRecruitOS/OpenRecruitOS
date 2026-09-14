"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Application, Interview, apiClient } from "@/lib/client";
import { INTERVIEW_STATUSES } from "@/lib/constants";

export function InterviewFormDialog({
  open,
  onOpenChange,
  interview,
  presetApplicationId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interview?: Interview | null;
  presetApplicationId?: string;
  onSaved: () => void;
}) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [interviewer, setInterviewer] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [status, setStatus] = useState("Scheduled");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    try {
      const apps = await apiClient.listApplications();
      // Only active (not hired/rejected) applications for scheduling
      setApplications(apps.filter((a) => a.status === "Active"));
    } catch {
      setError("Could not load applications");
    }
  }, []);

  useEffect(() => {
    if (open) {
      setError(null);
      loadApplications();
      setApplicationId(interview?.applicationId ?? presetApplicationId ?? "");
      setInterviewer(interview?.interviewer ?? "");
      setDate(interview?.date ?? "");
      setTime(interview?.time ?? "");
      setStatus(interview?.status ?? "Scheduled");
      setFeedback(interview?.feedback ?? "");
    }
  }, [open, interview, presetApplicationId, loadApplications]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!applicationId) {
      setError("Please select the application (candidate & job)");
      return;
    }
    if (!interviewer.trim()) {
      setError("Interviewer name is required");
      return;
    }
    if (!date || !time) {
      setError("Date and time are required");
      return;
    }
    setBusy(true);
    try {
      if (interview) {
        await apiClient.updateInterview(interview.id, { interviewer, date, time, status, feedback });
        toast.success("Interview updated");
      } else {
        await apiClient.createInterview({ applicationId, interviewer, date, time, feedback });
        toast.success("Interview scheduled");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save interview");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto thin-scrollbar sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{interview ? "Edit Interview" : "Schedule Interview"}</DialogTitle>
          <DialogDescription>
            {interview
              ? "Update the interview details, status or feedback."
              : "Pick the candidate application, interviewer and schedule."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label>Candidate & Job *</Label>
            <Select
              value={applicationId}
              onValueChange={setApplicationId}
              disabled={!!interview}
            >
              <SelectTrigger aria-label="Select application">
                <SelectValue placeholder="Select candidate & job" />
              </SelectTrigger>
              <SelectContent className="max-h-64 thin-scrollbar">
                {applications.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.candidate?.name} — {a.job?.title} ({a.stage})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {interview && interview.application && (
              <p className="text-xs text-muted-foreground">
                {interview.application.candidate.name} — {interview.application.job.title}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="iv-date">Date *</Label>
              <Input id="iv-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iv-time">Time *</Label>
              <Input id="iv-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="iv-interviewer">Interviewer *</Label>
            <Input
              id="iv-interviewer"
              placeholder="e.g. Priya Menon"
              value={interviewer}
              onChange={(e) => setInterviewer(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger aria-label="Interview status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVIEW_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="iv-feedback">Feedback / Comments</Label>
            <Textarea
              id="iv-feedback"
              rows={3}
              placeholder="Interview feedback, impressions, follow-ups…"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {interview ? "Save changes" : "Schedule interview"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
