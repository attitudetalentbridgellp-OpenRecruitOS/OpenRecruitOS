"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Candidate, Job, apiClient } from "@/lib/client";

export function AddApplicationDialog({
  open,
  onOpenChange,
  defaultCandidateId,
  defaultJobId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCandidateId?: string;
  defaultJobId?: string;
  onCreated?: () => void;
}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidateId, setCandidateId] = useState("");
  const [jobId, setJobId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [openJobs, allCandidates] = await Promise.all([
        apiClient.listJobs("Open"),
        apiClient.listCandidates(),
      ]);
      setJobs(openJobs);
      setCandidates(allCandidates);
    } catch {
      setError("Could not load jobs and candidates");
    }
  }, []);

  useEffect(() => {
    if (open) {
      setError(null);
      load();
    }
  }, [open, load]);

  useEffect(() => {
    if (open) {
      setCandidateId(defaultCandidateId ?? "");
      setJobId(defaultJobId ?? "");
    }
  }, [open, defaultCandidateId, defaultJobId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!candidateId || !jobId) {
      setError("Please select both a candidate and a job");
      return;
    }
    setBusy(true);
    try {
      await apiClient.createApplication(candidateId, jobId);
      const candidate = candidates.find((c) => c.id === candidateId);
      toast.success(`${candidate?.name ?? "Candidate"} added to pipeline (Applied)`);
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create application");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Candidate to Job
          </DialogTitle>
          <DialogDescription>
            The candidate enters the pipeline at the Applied stage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label>Candidate *</Label>
            <Select value={candidateId} onValueChange={setCandidateId}>
              <SelectTrigger aria-label="Select candidate">
                <SelectValue placeholder="Select a candidate" />
              </SelectTrigger>
              <SelectContent className="max-h-64 thin-scrollbar">
                {candidates.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.email ? ` · ${c.email}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Job *</Label>
            <Select value={jobId} onValueChange={setJobId}>
              <SelectTrigger aria-label="Select job">
                <SelectValue placeholder="Select an open job" />
              </SelectTrigger>
              <SelectContent className="max-h-64 thin-scrollbar">
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.title} · {j.location || "Any location"}
                  </SelectItem>
                ))}
                {jobs.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No open jobs available</div>
                )}
              </SelectContent>
            </Select>
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
              Add to pipeline
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
