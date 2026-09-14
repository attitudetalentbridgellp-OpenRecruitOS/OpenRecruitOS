"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { apiClient, SessionUser } from "@/lib/client";
import { LoginView } from "@/components/login-view";
import { AppShell } from "@/components/app-shell";

export default function Page() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .me()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground">Loading OpenRecruitOS…</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView onLogin={setUser} />;
  }

  return <AppShell user={user} onUserChange={setUser} onLogout={() => setUser(null)} />;
}
