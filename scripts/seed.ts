/**
 * OpenRecruitOS Community Edition — Demo data seeder (CLI)
 * Delegates to the shared seeder in src/lib/seed.ts, which is idempotent
 * (it skips automatically when the database already contains data).
 *
 * Run: bun scripts/seed.ts
 */
import { seedDemoData } from "../src/lib/seed";
import { db } from "../src/lib/db";

seedDemoData()
  .then((result) => {
    if (!result.seeded) {
      console.log(`Skipped seeding — ${result.reason}.`);
      console.log("Delete the database file (or run `bun run db:push`) to start fresh.");
    }
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
