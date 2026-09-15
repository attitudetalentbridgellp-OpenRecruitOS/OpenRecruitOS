"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { FileText, Loader2, ScanSearch, Trash2, Upload, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Candidate, ParseResumeResult, apiClient } from "@/lib/client";

const BLANK = {
  name: "",
  email: "",
  phone: "",
  skills: "",
  experience: "",
  education: "",
  location: "",
  salary: "",
  noticePeriod: "",
  notes: "",
  tags: "",
};

export type CandidateFormValues = typeof BLANK & { resume: string; resumeName: string };

export function CandidateFormDialog({
  open,
  onOpenChange,
  candidate,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate?: Candidate | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CandidateFormValues>({ ...BLANK, resume: "", resumeName: "" });
  const [uploading, setUploading] = useState(false);
  const [parseNote, setParseNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setParseNote(null);
      setForm({
        ...BLANK,
        name: candidate?.name ?? "",
        email: candidate?.email ?? "",
        phone: candidate?.phone ?? "",
        skills: candidate?.skills ?? "",
        experience: candidate?.experience ?? "",
        education: candidate?.education ?? "",
        location: candidate?.location ?? "",
        salary: candidate?.salary ?? "",
        noticePeriod: candidate?.noticePeriod ?? "",
        notes: candidate?.notes ?? "",
        tags: candidate?.tags ?? "",
        resume: candidate?.resume ?? "",
        resumeName: candidate?.resumeName ?? "",
      });
    }
  }, [open, candidate]);

  const set = (key: keyof CandidateFormValues) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleFile(file: File) {
    setError(null);
    setParseNote(null);
    setUploading(true);
    try {
      const result: ParseResumeResult = await apiClient.parseResume(file);
      // Pre-populate only fields the parser actually found — recruiter reviews & edits before save
      setForm((f) => ({
        ...f,
        name: result.parsed.name || f.name,
        email: result.parsed.email || f.email,
        phone: result.parsed.phone || f.phone,
        skills: result.parsed.skills || f.skills,
        experience: result.parsed.experience || f.experience,
        education: result.parsed.education || f.education,
        resume: result.resume,
        resumeName: result.resumeName,
      }));
      if (result.parseError) {
        setParseNote(result.parseError);
      } else {
        setParseNote("Details extracted from the resume. Please review and edit before saving.");
        toast.success("Resume parsed — review the extracted details");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resume upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeResume() {
    setForm((f) => ({ ...f, resume: "", resumeName: "" }));
    setParseNote(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Candidate name is required");
      return;
    }
    setBusy(true);
    try {
      if (candidate) {
        await apiClient.updateCandidate(candidate.id, form);
        toast.success("Candidate updated");
      } else {
        await apiClient.createCandidate(form);
        toast.success("Candidate added");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto thin-scrollbar sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{candidate ? "Edit Candidate" : "Add Candidate"}</DialogTitle>
          <DialogDescription>
            Upload a resume to auto-fill the profile, or enter details manually. Everything is
            editable before saving.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Resume upload */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-medium">Resume (PDF, DOC, DOCX · max 10 MB)</Label>
              {form.resume && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-red-600 hover:text-red-600"
                  onClick={removeResume}
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Remove
                </Button>
              )}
            </div>

            {form.resume ? (
              <div className="mt-2 flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
                <FileText className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{form.resumeName || "Resume.pdf"}</p>
                  <p className="text-xs text-muted-foreground">
                    {candidate?.resume === form.resume ? "Current resume" : "Stored — will be attached on save"}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" /> Replace
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className={`mt-2 flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
                  dragOver ? "border-sky-500 bg-sky-50" : "border-border bg-card hover:bg-muted/50"
                }`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFile(file);
                }}
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  {uploading ? "Uploading & parsing…" : "Click to upload or drag & drop"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Basic parsing fills name, email, phone, skills, experience & education
                </span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              aria-label="Upload resume file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            {parseNote && (
              <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                <ScanSearch className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {parseNote}
              </p>
            )}
          </div>

          {/* Profile fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cand-name">Full Name *</Label>
              <Input id="cand-name" value={form.name} onChange={(e) => set("name")(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cand-email">Email</Label>
              <Input id="cand-email" type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cand-phone">Phone</Label>
              <Input id="cand-phone" value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cand-location">Location</Label>
              <Input id="cand-location" value={form.location} onChange={(e) => set("location")(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cand-skills">Skills (comma-separated)</Label>
              <Input id="cand-skills" placeholder="React, Node.js, SQL" value={form.skills} onChange={(e) => set("skills")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cand-exp">Experience</Label>
              <Input id="cand-exp" placeholder="e.g. 3 years" value={form.experience} onChange={(e) => set("experience")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cand-edu">Education</Label>
              <Input id="cand-edu" placeholder="e.g. B.Tech Computer Science" value={form.education} onChange={(e) => set("education")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cand-salary">Current / Expected Salary</Label>
              <Input id="cand-salary" value={form.salary} onChange={(e) => set("salary")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cand-notice">Notice Period</Label>
              <Input id="cand-notice" placeholder="e.g. 30 days / Immediate" value={form.noticePeriod} onChange={(e) => set("noticePeriod")(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cand-tags">Tags (comma-separated)</Label>
              <Input id="cand-tags" placeholder="referral, frontend, priority" value={form.tags} onChange={(e) => set("tags")(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cand-notes">Notes</Label>
              <Textarea id="cand-notes" rows={3} placeholder="Recruiter notes…" value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
            </div>
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
            <Button type="submit" disabled={busy || uploading}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {candidate ? "Save changes" : "Add candidate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
