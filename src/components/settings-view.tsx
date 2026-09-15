"use client";

import { FormEvent, useState } from "react";
import { ExternalLink, Info, KeyRound, Loader2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient, SessionUser } from "@/lib/client";
import { APP_BY, APP_COMPANY, APP_NAME, APP_TAGLINE, APP_WEBSITE, APP_WEBSITE_URL } from "@/lib/constants";
import { PageHeader } from "@/components/shared";

export function SettingsView({
  user,
  onUserChange,
}: {
  user: SessionUser;
  onUserChange: (user: SessionUser) => void;
}) {
  const [name, setName] = useState(user.name);
  const [nameBusy, setNameBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setNameBusy(true);
    try {
      const updated = await apiClient.updateProfile(name.trim());
      onUserChange(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update profile");
    } finally {
      setNameBusy(false);
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    setPasswordBusy(true);
    try {
      await apiClient.changePassword(currentPassword, newPassword);
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Could not change password");
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Your account settings. Keep it simple — that's the point." />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profile */}
        <form onSubmit={handleProfileSave} className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Profile</h2>
          </div>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-name">Display name</Label>
              <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-email">Email</Label>
              <Input id="settings-email" value={user.email} disabled />
              <p className="text-xs text-muted-foreground">
                The account email cannot be changed in the Community Edition.
              </p>
            </div>
            <Button type="submit" disabled={nameBusy}>
              {nameBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save profile
            </Button>
          </div>
        </form>

        {/* Password */}
        <form onSubmit={handlePasswordChange} className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Change Password</h2>
          </div>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {passwordError && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {passwordError}
              </div>
            )}
            <Button type="submit" disabled={passwordBusy}>
              {passwordBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change password
            </Button>
          </div>
        </form>
      </div>

      {/* About */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">About</h2>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <img src="/logo-192.png" alt="" className="h-10 w-10" />
          <div>
            <p className="font-semibold">{APP_NAME}</p>
            <p className="text-sm text-muted-foreground">{APP_TAGLINE}</p>
            <p className="brand-gradient-text text-xs font-medium uppercase tracking-wide">{APP_BY}</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Community Edition — a simple, self-hostable open-source ATS with jobs, candidates,
          pipeline, resume parsing, interviews and a dashboard. Advanced features (AI parsing,
          integrations, SSO, cloud storage) are available in the commercial editions.
        </p>
        <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">{APP_COMPANY}</p>
            <p className="text-xs text-muted-foreground">The company behind OpenRecruitOS</p>
          </div>
          <a
            href={APP_WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1.5 rounded-lg border bg-muted/40 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {APP_WEBSITE}
          </a>
        </div>
      </div>
    </div>
  );
}
