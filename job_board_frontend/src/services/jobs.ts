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

// Use a constant mock list that does not depend on runtime locals
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
    if (!base) {
      // mock mode
      return MOCK_JOBS;
    }
    const res = await fetch(url, { signal });
    if (!res.ok) {
      return MOCK_JOBS;
    }
    const data = (await res.json()) as any[];
    return (data || []).map((j, idx) => ({
      id: String(j.id ?? idx),
      title: String(j.title ?? "Untitled Role"),
      company: String(j.company ?? "Unknown Company"),
      location: String(j.location ?? "Remote"),
      type: (j.type as JobType) ?? "Full-time",
      description: String(j.description ?? ""),
      postedAt: String(j.postedAt ?? new Date().toISOString()),
    }));
  } catch {
    return MOCK_JOBS;
  }
});
export const fetchJobsQrl = fetchJobs$;

/**
 * PUBLIC_INTERFACE
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
export const postJobQrl = postJob$;

/**
 * PUBLIC_INTERFACE
 * Global pending job store and QRL helpers to avoid capturing locals.
 */
/**
 * Use a wrapper object to avoid ESM import reassignment issues in transformed QRL chunks.
 * Mutate the .value property instead of reassigning the binding itself.
 */
const PendingStore: {
  value:
    | {
        title: string;
        company: string;
        location: string;
        type: JobType;
        description: string;
      }
    | null;
} = { value: null };

/**
 * PUBLIC_INTERFACE
 * Set the global pending job using raw UI input.
 */
export const setPendingJobFromUi$: QRL<
  (input: {
    title: string;
    company: string;
    location: string;
    type: JobType;
    description: string;
  }) => void
> = $((input) => {
  PendingStore.value = {
    title: input.title,
    company: input.company,
    location: input.location,
    type: input.type,
    description: input.description,
  };
});
export const setPendingJobFromUiQrl = setPendingJobFromUi$;

/**
 * PUBLIC_INTERFACE
 * Zero-arg QRL that returns the normalized pending job and clears the store.
 * This avoids introducing any local identifier inside the $ closure.
 *
 * Safe no-op behavior: if there is no pending job, return a rejected Promise
 * to avoid runtime throws during SSR or event replay. We implement this as a
 * zero-arg function that returns a Promise via direct Promise.reject without
 * capturing locals.
 */
export const getAndClearPendingJob$: QRL<() => Promise<Omit<Job, "id" | "postedAt">>> = $(
  () => {
    // Read and clear synchronously without temporary local variables
    const hasValue = !!PendingStore.value;
    // Derive payload first if present, then clear the store
    const payload = hasValue ? normalizeJobInput(PendingStore.value as any) : null;
    PendingStore.value = null;

    // Return via Promise API to avoid async/await locals
    return hasValue
      ? Promise.resolve(payload as Omit<Job, "id" | "postedAt">)
      : Promise.reject(new Error("No pending job available"));
  },
);
// Companion QRL export
export const getAndClearPendingJobQrl = getAndClearPendingJob$;

/**
 * PUBLIC_INTERFACE
 * QRL-friendly delegator that posts a job using the pending UI input.
 * Uses Promise chaining and avoids local temporary variables inside the closure.
 */
/**
 * PUBLIC_INTERFACE
 * Static pipeline to post the pending job without capturing locals inside the $ closure.
 * It composes using Promise.then with a top-level named function that has zero args,
 * so Qwik optimizer will not treat it as capturing closure state.
 */
/**
 * Helper that posts the current pending job without introducing args in QRL closures.
 * Defined at module scope so Qwik doesn't treat it as a captured variable.
 */
function postPendingNoArgs(): Promise<Job> {
  // Avoid inline arrow param in QRL scope by performing the chaining here
  return getAndClearPendingJob$().then(postJob$ as unknown as (p: any) => Promise<Job>);
}
export const postJobFromUi$: QRL<() => Promise<Job>> = $(() => {
  // Zero-arg call into the module-level helper; no locals introduced here
  return postPendingNoArgs();
});
export const postJobFromUiQrl = postJobFromUi$;

/**
 * PUBLIC_INTERFACE
 * Posts a job by extracting the pending job and clearing it, without capturing locals.
 */
export const postJobFromPending$: QRL<() => Promise<Job>> = $(() => {
  return postPendingNoArgs();
});
export const postJobFromPendingQrl = postJobFromPending$;
