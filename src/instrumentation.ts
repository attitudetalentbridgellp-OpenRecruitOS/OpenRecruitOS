// OpenRecruitOS — Next.js instrumentation hook (runs once on server boot)
//
// Auto-seeds the demo dataset when the database is completely empty, so a
// fresh clone / fresh volume boots into a working demo instead of an empty
// state. Policy:
//   SEED_DEMO_DATA=false   → never seed (clean production instance)
//   SEED_DEMO_DATA=true    → seed if empty (any environment)
//   unset                  → seed if empty in development only
// The seeder itself is idempotent and double-checks that the DB is empty.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const mode = process.env.SEED_DEMO_DATA;
  const allowed =
    mode === "false" ? false : mode === "true" ? true : process.env.NODE_ENV !== "production";
  if (!allowed) return;

  try {
    const { seedDemoData } = await import("@/lib/seed");
    const { db } = await import("@/lib/db");
    const messages: string[] = [];
    const result = await seedDemoData((msg) => messages.push(msg));
    if (result.seeded) {
      console.log("[boot] " + messages.join("\n[boot] "));
    } else {
      console.log(`[boot] Auto-seed skipped — ${result.reason}.`);
    }
    // Ensure the connection does not keep the standalone server from exiting cleanly.
    if (process.env.NEXT_PHASE === "phase-production-build") await db.$disconnect();
  } catch (err) {
    console.error("[boot] Auto-seed failed (the app will still start):", err);
  }
}
