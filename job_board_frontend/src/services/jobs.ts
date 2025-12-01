import { $, type QRL } from "@builder.io/qwik";

/**
 * Job types and service layer with VITE_API_BASE fallback to mock data.
 */

export type JobType = "Full-time" | "Part-time" | "Contract" | "Internship";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: JobType;
  description: string;
  postedAt: string; // ISO date
}

const MOCK_JOBS: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    company: "BlueWave Tech",
    location: "Remote",
    type: "Full-time",
    description:
      "Lead frontend initiatives using Qwik/React. Work closely with design to deliver delightful UX.",
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "2",
    title: "Backend Developer (Node.js)",
    company: "Harbor Labs",
    location: "New York, NY",
    type: "Full-time",
    description:
      "Build resilient APIs and services. Experience with PostgreSQL and event-driven systems is a plus.",
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: "3",
    title: "Product Designer",
    company: "Oceanic Ventures",
    location: "San Francisco, CA",
    type: "Contract",
    description:
      "Design intuitive, accessible interfaces. Collaborate with PMs and engineers to deliver impactful products.",
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString(),
  },
  {
    id: "4",
    title: "Data Analyst",
    company: "Amber Analytics",
    location: "Austin, TX",
    type: "Part-time",
    description:
      "Analyze data sets and create dashboards. Proficiency with SQL and Python preferred.",
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];

/**
 * Build API base URL from env. Will use '' if undefined.
 */
function getApiBase(): string {
  const base = (import.meta as any)?.env?.VITE_API_BASE || "";
  return base;
}

/**
 * PUBLIC_INTERFACE
 * Fetch jobs from the API, with graceful fallback to mock data.
 */
export const fetchJobs$: QRL<
  (signal?: AbortSignal) => Promise<Job[]>
> = $(async (signal?: AbortSignal): Promise<Job[]> => {
  const base = getApiBase();
  const url = `${base}/api/jobs`;
  try {
    // If base is empty, skip network and return mocks
    if (!base) {
      return MOCK_JOBS;
    }
    const res = await fetch(url, { signal });
    if (!res.ok) {
      return MOCK_JOBS;
    }
    const data = (await res.json()) as any[];
    // Normalize to Job[]
    return (data || []).map((j, idx) => ({
      id: String(j.id ?? idx),
      title: String(j.title ?? "Untitled Role"),
      company: String(j.company ?? "Unknown Company"),
      location: String(j.location ?? "Remote"),
      type: (j.type as JobType) ?? "Full-time",
      description: String(j.description ?? ""),
      postedAt: String(j.postedAt ?? new Date().toISOString()),
    }));
  } catch (_e) {
    return MOCK_JOBS;
  }
});

/**
 * Internal helper: normalize a job payload coming from UI.
 * Avoid capturing external locals in QRLs by centralizing normalization here.
 */
export function normalizeJobInput(input: {
  title: string;
  company: string;
  location: string;
  type: JobType;
  description: string;
}): Omit<Job, "id" | "postedAt"> {
  return {
    title: input.title.trim(),
    company: input.company.trim(),
    location: input.location.trim(),
    type: input.type,
    description: input.description.trim(),
  };
}

/**
 * PUBLIC_INTERFACE
 * Post a new job. This uses API if VITE_API_BASE is set, otherwise simulates success.
 * Returns the created job (with generated id if needed).
 */
export const postJob$: QRL<
  (job: Omit<Job, "id" | "postedAt">, signal?: AbortSignal) => Promise<Job>
> = $(async (job, signal): Promise<Job> => {
  const base = getApiBase();
  const newJob: Job = {
    id: Math.random().toString(36).slice(2),
    postedAt: new Date().toISOString(),
    ...job,
  };
  if (!base) {
    // Mock mode
    return newJob;
  }
  try {
    const res = await fetch(`${base}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
      signal,
    });
    if (!res.ok) {
      return newJob;
    }
    const created = await res.json();
    return {
      id: String(created.id ?? newJob.id),
      title: created.title ?? newJob.title,
      company: created.company ?? newJob.company,
      location: created.location ?? newJob.location,
      type: created.type ?? newJob.type,
      description: created.description ?? newJob.description,
      postedAt: created.postedAt ?? newJob.postedAt,
    };
  } catch {
    return newJob;
  }
});

/**
 * PUBLIC_INTERFACE
 * QRL-friendly delegator that accepts raw UI input and posts a job.
 * This keeps normalization within the QRL boundary without capturing locals in routes.
 */
export const postJobFromUi$: QRL<
  (input: {
    title: string;
    company: string;
    location: string;
    type: JobType;
    description: string;
  }) => Promise<Job>
> = $(async (input) => {
  const normalized = normalizeJobInput(input);
  return postJob$(normalized);
});
