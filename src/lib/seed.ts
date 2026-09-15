/**
 * OpenRecruitOS Community Edition — Demo data seeder (shared library)
 *
 * Creates the admin user, 5 jobs, 15 candidates, applications across all
 * pipeline stages (incl. hires & rejections), 5 interviews and stage history.
 *
 * Idempotent: skips seeding when the database already contains data, so it is
 * safe to call on every server boot and from the CLI (`bun scripts/seed.ts`).
 *
 * Seed policy (enforced by src/instrumentation.ts on boot):
 *   SEED_DEMO_DATA=false        → never seed (clean production instance)
 *   SEED_DEMO_DATA=true         → seed if the database is empty
 *   unset + non-production      → seed if the database is empty (dev convenience)
 *   unset + production          → never seed
 */
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const dateOffset = (n: number) => {
  const d = new Date(Date.now() + n * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
};

export type SeedResult = { seeded: boolean; reason?: string };

export async function seedDemoData(log: (msg: string) => void = console.log): Promise<SeedResult> {
  // ---------------- Idempotency guard ----------------
  const [users, jobs] = [await db.user.count(), await db.job.count()];
  if (users > 0 || jobs > 0) {
    return { seeded: false, reason: `database already has data (${users} users, ${jobs} jobs)` };
  }

  log("Seeding OpenRecruitOS demo data...");

  // ---------------- Admin user ----------------
  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await db.user.upsert({
    where: { email: "admin@attitude360.com" },
    update: {},
    create: { name: "Admin", email: "admin@attitude360.com", password: passwordHash },
  });
  log(`✓ Admin user: ${admin.email} (password: admin123)`);

  // ---------------- Jobs ----------------
  const jobSpecs = [
    {
      title: "Senior Frontend Developer",
      description:
        "We are looking for a Senior Frontend Developer to build modern, responsive web applications. You will work closely with designers and backend engineers to deliver a polished user experience, own the frontend architecture, and mentor junior developers.",
      skills: "React, TypeScript, Next.js, Tailwind CSS, REST API",
      experience: "4-6 years",
      location: "Bengaluru, India (Hybrid)",
      salary: "₹22,00,000 - ₹30,00,000 per year",
      employmentType: "Full-time",
      status: "Open",
    },
    {
      title: "Backend Engineer (Node.js)",
      description:
        "Join our platform team to design and build scalable REST APIs and services. You will work with Node.js, PostgreSQL and Docker, own service reliability, and collaborate with frontend teams on clean API contracts.",
      skills: "Node.js, PostgreSQL, Docker, Redis, REST API",
      experience: "3-5 years",
      location: "Remote (India)",
      salary: "₹18,00,000 - ₹26,00,000 per year",
      employmentType: "Full-time",
      status: "Open",
    },
    {
      title: "Full Stack Developer",
      description:
        "Build end-to-end features across our recruitment platform. Comfortable with both React on the frontend and Node.js on the backend. You will ship features weekly and participate in code reviews.",
      skills: "React, Node.js, TypeScript, PostgreSQL, Git",
      experience: "2-4 years",
      location: "Mumbai, India",
      salary: "₹12,00,000 - ₹18,00,000 per year",
      employmentType: "Full-time",
      status: "Open",
    },
    {
      title: "UI/UX Designer",
      description:
        "Design clean, usable interfaces for our SaaS products. You will create wireframes, prototypes and design systems in Figma, and partner with engineers to implement pixel-perfect UI.",
      skills: "Figma, UI/UX, Prototyping, Design Systems, Adobe XD",
      experience: "2-4 years",
      location: "Pune, India",
      salary: "₹9,00,000 - ₹14,00,000 per year",
      employmentType: "Full-time",
      status: "Open",
    },
    {
      title: "QA Automation Engineer",
      description:
        "Own automated testing for our web platform: build end-to-end test suites with Playwright and Cypress, integrate them into CI/CD, and drive quality best practices across teams.",
      skills: "Selenium, Playwright, JavaScript, CI/CD, Automation Testing",
      experience: "2-4 years",
      location: "Hyderabad, India",
      salary: "₹8,00,000 - ₹13,00,000 per year",
      employmentType: "Contract",
      status: "Closed",
    },
  ];

  const jobsCreated: { id: string; title: string }[] = [];
  for (let i = 0; i < jobSpecs.length; i++) {
    const spec = jobSpecs[i];
    const job = await db.job.create({ data: { ...spec, createdAt: daysAgo(30 - i * 3) } });
    jobsCreated.push({ id: job.id, title: job.title });
  }
  log(`✓ ${jobsCreated.length} jobs created`);

  // ---------------- Candidates ----------------
  const candidateSpecs = [
    { name: "Aarav Sharma", email: "aarav.sharma@example.com", phone: "+91 98765 43210", skills: "React, TypeScript, Next.js, Tailwind CSS, Redux", experience: "6 years", education: "B.Tech Computer Science, VIT Vellore, 2018", location: "Bengaluru", salary: "₹24,00,000", noticePeriod: "30 days", tags: "referral,frontend" },
    { name: "Diya Patel", email: "diya.patel@example.com", phone: "+91 98220 11223", skills: "Node.js, PostgreSQL, Docker, AWS, Redis", experience: "4 years", education: "B.E. Information Technology, Nirma University, 2020", location: "Ahmedabad", salary: "₹19,00,000", noticePeriod: "60 days", tags: "backend" },
    { name: "Rohan Mehta", email: "rohan.mehta@example.com", phone: "+91 99887 76655", skills: "React, JavaScript, HTML, CSS, Node.js", experience: "3 years", education: "B.Sc. Computer Science, Mumbai University, 2021", location: "Mumbai", salary: "₹11,00,000", noticePeriod: "Immediate", tags: "fullstack" },
    { name: "Ananya Iyer", email: "ananya.iyer@example.com", phone: "+91 91234 56789", skills: "Figma, UI/UX, Design Systems, Prototyping", experience: "3 years", education: "B.Des. Communication Design, NID Ahmedabad, 2020", location: "Pune", salary: "₹12,00,000", noticePeriod: "30 days", tags: "design" },
    { name: "Karan Singh", email: "karan.singh@example.com", phone: "+91 98711 22334", skills: "Playwright, Selenium, JavaScript, CI/CD", experience: "3 years", education: "B.Tech ECE, Delhi Technological University, 2020", location: "Hyderabad", salary: "₹10,00,000", noticePeriod: "45 days", tags: "qa" },
    { name: "Priya Nair", email: "priya.nair@example.com", phone: "+91 90909 80808", skills: "TypeScript, React, GraphQL, Node.js", experience: "5 years", education: "M.C.A., Anna University, 2018", location: "Kochi", salary: "₹21,00,000", noticePeriod: "30 days", tags: "frontend,referral" },
    { name: "Vikram Reddy", email: "vikram.reddy@example.com", phone: "+91 93456 78901", skills: "Java, Spring Boot, PostgreSQL, Microservices", experience: "5 years", education: "B.Tech CSE, Osmania University, 2017", location: "Hyderabad", salary: "₹20,00,000", noticePeriod: "60 days", tags: "backend" },
    { name: "Sneha Gupta", email: "sneha.gupta@example.com", phone: "+91 97654 32109", skills: "Node.js, Express, MongoDB, Docker", experience: "2 years", education: "B.C.A., Lucknow University, 2022", location: "Lucknow", salary: "₹8,00,000", noticePeriod: "Immediate", tags: "" },
    { name: "Arjun Desai", email: "arjun.desai@example.com", phone: "+91 96543 21098", skills: "React, Next.js, Tailwind CSS, Figma, UI/UX", experience: "2 years", education: "B.E. Computer Science, PICT Pune, 2022", location: "Pune", salary: "₹9,00,000", noticePeriod: "30 days", tags: "fullstack" },
    { name: "Meera Krishnan", email: "meera.krishnan@example.com", phone: "+91 95432 10987", skills: "Python, Django, PostgreSQL, REST API", experience: "4 years", education: "M.Sc. Software Systems, BITS Pilani, 2019", location: "Chennai", salary: "₹17,00,000", noticePeriod: "45 days", tags: "" },
    { name: "Aditya Verma", email: "aditya.verma@example.com", phone: "+91 94321 09876", skills: "React, TypeScript, Testing, Jest", experience: "1 year", education: "B.Tech IT, JSS Noida, 2023", location: "Noida", salary: "₹6,00,000", noticePeriod: "Immediate", tags: "campus" },
    { name: "Ishita Bose", email: "ishita.bose@example.com", phone: "+91 93210 98765", skills: "UI/UX, Figma, User Research, Design Systems", experience: "4 years", education: "B.Des., Srishti Manipal, 2019", location: "Kolkata", salary: "₹13,00,000", noticePeriod: "30 days", tags: "design" },
    { name: "Nikhil Joshi", email: "nikhil.joshi@example.com", phone: "+91 92109 87654", skills: "Node.js, TypeScript, Kafka, Docker, Kubernetes", experience: "6 years", education: "B.Tech CSE, COEP Pune, 2017", location: "Bengaluru", salary: "₹27,00,000", noticePeriod: "90 days", tags: "backend,referral" },
    { name: "Tanvi Kulkarni", email: "tanvi.kulkarni@example.com", phone: "+91 91098 76543", skills: "JavaScript, Cypress, Automation Testing, Git", experience: "2 years", education: "B.E. Computer Science, VESIT Mumbai, 2021", location: "Mumbai", salary: "₹7,50,000", noticePeriod: "30 days", tags: "qa" },
    { name: "Rahul Malhotra", email: "rahul.malhotra@example.com", phone: "+91 99887 12345", skills: "React, Redux, TypeScript, REST API", experience: "4 years", education: "B.Tech CSE, Thapar University, 2019", location: "Delhi", salary: "₹16,00,000", noticePeriod: "60 days", tags: "frontend" },
  ];

  const candidates: { id: string; name: string }[] = [];
  for (let i = 0; i < candidateSpecs.length; i++) {
    const c = await db.candidate.create({
      data: {
        ...candidateSpecs[i],
        notes:
          i % 4 === 0
            ? "Sourced via employee referral. Strong communication skills observed during initial call."
            : "",
        createdAt: daysAgo(25 - i),
      },
    });
    candidates.push({ id: c.id, name: c.name });
  }
  log(`✓ ${candidates.length} candidates created`);

  // ---------------- Applications across stages ----------------
  // [candidateIdx, jobIdx, stage, appliedDaysAgo, extraHistory]
  const plan: [number, number, string, number, [string, string, number][]][] = [
    // Applied — fresh applications
    [10, 0, "Applied", 1, []],
    [8, 2, "Applied", 2, []],
    [13, 4, "Applied", 1, []],
    [7, 1, "Applied", 3, []],
    // Screening
    [2, 2, "Screening", 5, [["Applied", "Screening", 4]]],
    [9, 1, "Screening", 6, [["Applied", "Screening", 5]]],
    [14, 0, "Screening", 4, [["Applied", "Screening", 3]]],
    // Interview
    [5, 0, "Interview", 8, [["Applied", "Screening", 7], ["Screening", "Interview", 6]]],
    [0, 0, "Interview", 10, [["Applied", "Screening", 9], ["Screening", "Interview", 8]]],
    [3, 3, "Interview", 9, [["Applied", "Screening", 8], ["Screening", "Interview", 7]]],
    // Selected
    [1, 1, "Selected", 12, [["Applied", "Screening", 11], ["Screening", "Interview", 10], ["Interview", "Selected", 8]]],
    [12, 1, "Selected", 14, [["Applied", "Screening", 13], ["Screening", "Interview", 12], ["Interview", "Selected", 10]]],
    // Hired
    [6, 1, "Hired", 20, [["Applied", "Screening", 19], ["Screening", "Interview", 17], ["Interview", "Selected", 15], ["Selected", "Hired", 12]]],
    [4, 4, "Hired", 18, [["Applied", "Screening", 17], ["Screening", "Interview", 16], ["Interview", "Selected", 14], ["Selected", "Hired", 11]]],
    // Rejected
    [11, 3, "Rejected", 10, [["Applied", "Screening", 9], ["Screening", "Rejected", 7]]],
    [6, 0, "Rejected", 7, [["Applied", "Rejected", 6]]],
  ];

  const applications: { id: string; stage: string }[] = [];
  for (const [ci, ji, stage, applied, moves] of plan) {
    const history: { previousStage: string; newStage: string; changedAt: Date }[] = [
      { previousStage: "", newStage: "Applied", changedAt: daysAgo(applied) },
    ];
    for (const [from, to, ago] of moves) {
      history.push({ previousStage: from, newStage: to, changedAt: daysAgo(ago) });
    }
    const status = stage === "Hired" ? "Hired" : stage === "Rejected" ? "Rejected" : "Active";
    const app = await db.application.create({
      data: {
        candidateId: candidates[ci].id,
        jobId: jobsCreated[ji].id,
        stage,
        status,
        appliedAt: daysAgo(applied),
        updatedAt: daysAgo(0),
        history: { create: history },
      },
    });
    applications.push({ id: app.id, stage });
  }
  log(`✓ ${applications.length} applications created with stage history`);

  // ---------------- Interviews ----------------
  const interviewSpecs: {
    appIdx: number;
    interviewer: string;
    offsetDays: number;
    time: string;
    status: string;
    feedback: string;
  }[] = [
    { appIdx: 7, interviewer: "Priya Menon", offsetDays: 1, time: "10:30", status: "Scheduled", feedback: "" },
    { appIdx: 8, interviewer: "Rahul Khanna", offsetDays: 2, time: "15:00", status: "Scheduled", feedback: "" },
    { appIdx: 9, interviewer: "Sana Sheikh", offsetDays: 4, time: "11:00", status: "Scheduled", feedback: "" },
    {
      appIdx: 10,
      interviewer: "Deepak Rao",
      offsetDays: -3,
      time: "14:00",
      status: "Completed",
      feedback: "Strong system design fundamentals and solid Node.js experience. Good cultural fit. Recommend moving to Selected.",
    },
    {
      appIdx: 12,
      interviewer: "Neha Kapoor",
      offsetDays: -6,
      time: "16:30",
      status: "Cancelled",
      feedback: "Candidate accepted another offer, interview cancelled.",
    },
  ];

  for (const spec of interviewSpecs) {
    await db.interview.create({
      data: {
        applicationId: applications[spec.appIdx].id,
        interviewer: spec.interviewer,
        date: dateOffset(spec.offsetDays),
        time: spec.time,
        status: spec.status,
        feedback: spec.feedback,
      },
    });
  }
  log(`✓ ${interviewSpecs.length} interviews created`);

  log("\n✅ Seed complete! Login with admin@attitude360.com / admin123");
  return { seeded: true };
}
