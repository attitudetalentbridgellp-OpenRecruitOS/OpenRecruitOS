// OpenRecruitOS — Basic resume parsing (Community Edition)
//
// MODULARITY NOTE:
// `ResumeParser` is the stable contract consumed by the API layer. The shipped
// implementation is `BasicResumeParser` (regex/heuristics only — no AI). A future
// commercial edition can register an advanced parser (AI matching, semantic
// extraction, etc.) in `getResumeParser()` without changing any caller.

import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  skills: string;
  experience: string;
  education: string;
}

export interface ResumeParser {
  extractText(buffer: Buffer, filename: string): Promise<string>;
  parse(text: string): ParsedResume;
}

/* ------------------------------ text extraction ------------------------------ */

async function extractPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text || "";
  } finally {
    await parser.destroy();
  }
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value || "";
}

async function extractDoc(buffer: Buffer): Promise<string> {
  // .doc (legacy binary Word) — dynamic import keeps startup light
  const WordExtractor = (await import("word-extractor")).default;
  const extractor = new WordExtractor();
  const doc = await extractor.extract(buffer);
  return doc.getBody() || "";
}

export class BasicResumeParser implements ResumeParser {
  async extractText(buffer: Buffer, filename: string): Promise<string> {
    const ext = filename.toLowerCase().split(".").pop() || "";
    if (ext === "pdf") return extractPdf(buffer);
    if (ext === "docx") return extractDocx(buffer);
    if (ext === "doc") return extractDoc(buffer);
    // Best-effort fallback: treat as plain text
    return buffer.toString("utf8");
  }

  parse(text: string): ParsedResume {
    // Clean pdf page-marker artifacts (e.g. "-- 1 of 1 --") before heuristics
    const clean = text.replace(/--\s*\d+\s*of\s*\d+\s*--/gi, " ");
    return {
      name: extractName(clean),
      email: extractEmail(clean),
      phone: extractPhone(clean),
      skills: extractSkills(clean),
      experience: extractExperience(clean),
      education: extractEducation(clean),
    };
  }
}

let parser: ResumeParser | null = null;
/** Replace with an advanced parser implementation in the commercial edition. */
export function getResumeParser(): ResumeParser {
  if (!parser) parser = new BasicResumeParser();
  return parser;
}

/* ------------------------------ field heuristics ------------------------------ */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

function extractEmail(text: string): string {
  const m = text.match(EMAIL_RE);
  return m ? m[0] : "";
}

function extractPhone(text: string): string {
  // Matches +91 98765 43210 / (123) 456-7890 / 9876543210 etc.
  const m =
    text.match(/(?:\+\d{1,3}[\s-]?)?(?:\(\d{2,5}\)[\s-]?)?\d{3,5}[\s-]?\d{3,5}[\s-]?\d{0,5}/) || [];
  const cleaned = (m[0] || "").trim();
  const digits = cleaned.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13 ? cleaned : "";
}

function extractName(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 12);
  for (const line of lines) {
    if (EMAIL_RE.test(line)) continue;
    if (/\d{5,}/.test(line)) continue;
    if (line.length < 3 || line.length > 48) continue;
    // Skip obvious section headers / labels
    if (/^(curriculum|resume|curriculum vitae|profile summary|objective|summary)/i.test(line)) continue;
    // 2-4 words, letters/spaces/dots only → likely a name
    const words = line.split(/\s+/);
    const looksLikeName =
      words.length >= 2 &&
      words.length <= 4 &&
      words.every((w) => /^[A-Za-z.'-]+$/.test(w));
    if (looksLikeName) {
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }
  return "";
}

const SKILLS_DICTIONARY = [
  "JavaScript", "TypeScript", "React", "Next.js", "Vue.js", "Angular", "Node.js", "Express",
  "Python", "Django", "Flask", "FastAPI", "Java", "Spring Boot", "Kotlin", "Swift",
  "Go", "Rust", "C++", "C#", ".NET", "PHP", "Laravel", "Ruby", "Rails",
  "HTML", "CSS", "Sass", "Tailwind CSS", "Bootstrap", "Tailwind", "Redux",
  "SQL", "MySQL", "PostgreSQL", "MongoDB", "SQLite", "Redis", "Firebase",
  "GraphQL", "REST API", "REST", "Microservices", "Docker", "Kubernetes", "CI/CD",
  "AWS", "Azure", "GCP", "Google Cloud", "Jenkins", "Terraform", "Linux",
  "Git", "GitHub", "GitLab", "Agile", "Scrum", "JIRA", "Kafka", "RabbitMQ",
  "Machine Learning", "Deep Learning", "Data Science", "Pandas", "NumPy", "TensorFlow",
  "PyTorch", "NLP", "Computer Vision", "Power BI", "Tableau", "Excel",
  "Selenium", "Cypress", "Jest", "Playwright", "Unit Testing", "Automation Testing",
  "Figma", "Adobe XD", "UI/UX", "Photoshop", "Illustrator", "Canva",
  "Salesforce", "SAP", "HubSpot", "Digital Marketing", "SEO", "Content Marketing",
  "Recruitment", "Talent Acquisition", "HR", "Payroll", "Accounting", "Tally",
  "Communication", "Leadership", "Problem Solving", "Team Management", "Negotiation",
  "Flutter", "React Native", "Android", "iOS", "Unity", "Scala", "Perl", "Shell Scripting",
  "Bash", "Elasticsearch", "DynamoDB", "AngularJS", "jQuery", "Hibernate", "Maven",
  "Spring", "Struts", "Data Analysis", "Business Analysis", "Product Management",
];

function hasSkill(hay: string, skill: string): boolean {
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Word-boundary-ish match so short names (Go, C++, .NET) don't hit random substrings
  const re = new RegExp(`(^|[^a-z0-9])${escaped.toLowerCase()}([^a-z0-9]|$)`, "i");
  return re.test(hay);
}

function extractSkills(text: string): string {
  const found: string[] = [];
  for (const skill of SKILLS_DICTIONARY) {
    if (
      hasSkill(text, skill) &&
      !found.some((f) => f.toLowerCase() === skill.toLowerCase())
    ) {
      found.push(skill);
    }
    if (found.length >= 12) break;
  }
  return found.join(", ");
}

function extractExperience(text: string): string {
  // Prefer an explicit "X years" statement
  const m = text.match(/(\d{1,2})\+?\s*(?:years?|yrs?)/i);
  if (m) return `${m[1]} years`;
  // Approximate from the earliest 4-digit year mentioned
  const years = Array.from(text.matchAll(/\b(19|20)\d{2}\b/g)).map((x) => parseInt(x[0], 10));
  if (years.length) {
    const earliest = Math.min(...years);
    if (earliest > 1980 && earliest <= new Date().getFullYear()) {
      const span = new Date().getFullYear() - earliest;
      if (span > 0) return `${span} years`;
    }
  }
  return "";
}

const DEGREE_RE =
  /\b(?:B\.?E\.?|B\.?Tech\.?|B\.?Sc\.?|B\.?Com\.?|B\.?C\.?A\.?|B\.?B\.?A\.?|B\.?A\.?|M\.?E\.?|M\.?Tech\.?|M\.?Sc\.?|M\.?Com\.?|M\.?C\.?A\.?|M\.?B\.?A\.?|M\.?A\.?|Ph\.?D\.?|Diploma|High School|Intermediate|XII|X)\b[^\n]{0,90}/i;

function extractEducation(text: string): string {
  const section = getSection(text, ["education", "academic", "qualification"]);
  const source = section || text;
  const m = source.match(DEGREE_RE);
  if (m) {
    return m[0].replace(/[,;|]+$/, "").trim().slice(0, 160);
  }
  return "";
}

/** Returns the body of a `SECTION:` heading (skills/experience/education) when present. */
function getSection(text: string, headings: string[]): string {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase();
    if (headings.some((h) => line === h || line === `${h}:` || line.startsWith(h))) {
      const body: string[] = [];
      for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
        const l = lines[j].trim();
        if (!l) continue;
        if (/^[a-z ]{3,25}:$/i.test(l)) break; // next section header
        body.push(l);
        if (body.join(" ").length > 400) break;
      }
      return body.join(" ");
    }
  }
  return "";
}
