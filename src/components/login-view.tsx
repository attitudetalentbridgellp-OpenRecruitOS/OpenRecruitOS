"use client";

import { FormEvent, useState } from "react";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient, SessionUser } from "@/lib/client";
import { APP_BY, APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function LoginView({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const [email, setEmail] = useState("admin@attitude360.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = await apiClient.login(email, password);
      toast.success(`Welcome back, ${user.name}`);
      onLogin(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50/60 via-background to-background px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-sm">
            <img src="/logo.svg" alt="OpenRecruitOS logo" className="h-11 w-11 rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{APP_TAGLINE}</p>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-emerald-700/70">{APP_BY}</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold">Sign in to your workspace</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your recruiter account to access the dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <p>
              <span className="font-medium text-foreground">Demo account</span> — email{" "}
              <code className="rounded bg-background px-1 py-0.5 font-mono">admin@attitude360.com</code>, password{" "}
              <code className="rounded bg-background px-1 py-0.5 font-mono">admin123</code>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          OpenRecruitOS Community Edition · Self-hosted · MIT licensed
        </p>
      </div>
    </div>
  );
}
