"use client";

import { useState } from "react";
import {
  Briefcase,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/shared";
import { apiClient, SessionUser } from "@/lib/client";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { DashboardView } from "@/components/dashboard-view";
import { JobsView, JobDetailView } from "@/components/jobs-view";
import { CandidatesView, CandidateDetailView } from "@/components/candidates-view";
import { ApplicationsView } from "@/components/applications-view";
import { InterviewsView } from "@/components/interviews-view";
import { SettingsView } from "@/components/settings-view";

export type NavState =
  | { view: "dashboard" }
  | { view: "jobs" }
  | { view: "job-detail"; jobId: string }
  | { view: "candidates" }
  | { view: "candidate-detail"; candidateId: string }
  | { view: "applications"; focusApplicationId?: string }
  | { view: "interviews" }
  | { view: "settings" };

const NAV_ITEMS: { view: NavState["view"]; label: string; icon: typeof LayoutDashboard }[] = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "jobs", label: "Jobs", icon: Briefcase },
  { view: "candidates", label: "Candidates", icon: Users },
  { view: "applications", label: "Applications", icon: ClipboardList },
  { view: "interviews", label: "Interviews", icon: CalendarDays },
  { view: "settings", label: "Settings", icon: Settings },
];

function SidebarContent({
  activeView,
  onNavigate,
}: {
  activeView: NavState["view"];
  onNavigate: (state: NavState) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <button
        className="flex items-center gap-3 px-5 pb-6 pt-6 text-left"
        onClick={() => onNavigate({ view: "dashboard" })}
      >
        <img src="/logo.svg" alt="" className="h-9 w-9 rounded-lg" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold tracking-tight">{APP_NAME}</span>
          <span className="block text-[10px] leading-tight text-muted-foreground">{APP_TAGLINE}</span>
        </span>
      </button>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 pb-16" aria-label="Main navigation">
        {NAV_ITEMS.map(({ view, label, icon: Icon }) => {
          const active = view === activeView || (view === "jobs" && activeView === "job-detail") || (view === "candidates" && activeView === "candidate-detail");
          return (
            <button
              key={view}
              onClick={() => onNavigate({ view } as NavState)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="px-5 pb-4 pt-2 text-[10px] leading-relaxed text-muted-foreground">
        Community Edition
        <br />
        By Attitude360
      </div>
    </div>
  );
}

export function AppShell({
  user,
  onUserChange,
  onLogout,
}: {
  user: SessionUser;
  onUserChange: (user: SessionUser) => void;
  onLogout: () => void;
}) {
  const [nav, setNav] = useState<NavState>({ view: "dashboard" });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);

  const navigate = (state: NavState) => {
    setNav(state);
    setMobileOpen(false);
  };

  async function handleLogout() {
    setLogoutBusy(true);
    try {
      await apiClient.logout();
      toast.success("Signed out");
      onLogout();
    } catch {
      toast.error("Could not sign out. Please try again.");
      setLogoutBusy(false);
    }
  }

  const activeView = nav.view;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar lg:block">
        <SidebarContent activeView={activeView} onNavigate={navigate} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="" className="h-7 w-7 rounded-md" />
          <span className="text-sm font-bold tracking-tight">{APP_NAME}</span>
        </div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open navigation menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <SidebarContent activeView={activeView} onNavigate={navigate} />
          </SheetContent>
        </Sheet>
      </header>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {activeView === "dashboard" && <DashboardView user={user} onNavigate={navigate} />}
          {activeView === "jobs" && <JobsView onNavigate={navigate} />}
          {activeView === "job-detail" && "jobId" in nav && <JobDetailView jobId={nav.jobId} onNavigate={navigate} />}
          {activeView === "candidates" && <CandidatesView onNavigate={navigate} />}
          {activeView === "candidate-detail" && "candidateId" in nav && (
            <CandidateDetailView candidateId={nav.candidateId} onNavigate={navigate} />
          )}
          {activeView === "applications" && (
            <ApplicationsView
              onNavigate={navigate}
              focusApplicationId={"focusApplicationId" in nav ? nav.focusApplicationId : undefined}
            />
          )}
          {activeView === "interviews" && <InterviewsView onNavigate={navigate} />}
          {activeView === "settings" && <SettingsView user={user} onUserChange={onUserChange} />}
        </div>
      </main>

      {/* User bar (desktop: bottom-left of sidebar area is inside SidebarContent; mobile: floating) */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex h-14 items-center justify-between border-t bg-card px-4 lg:left-64 lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{user.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setLogoutOpen(true)}>
          <LogOut className="mr-1 h-4 w-4" />
          Logout
        </Button>
      </div>
      <div className="hidden lg:block">
        <div className="fixed bottom-0 left-0 z-30 w-64 border-t bg-sidebar p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{user.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" aria-label="Log out" onClick={() => setLogoutOpen(true)}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {/* bottom padding for mobile user bar */}
      <div className="h-14 lg:hidden" aria-hidden />

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Sign out of OpenRecruitOS?"
        description="You will need to sign in again to access your workspace."
        confirmLabel="Sign out"
        destructive={false}
        onConfirm={handleLogout}
        busy={logoutBusy}
      />
    </div>
  );
}
