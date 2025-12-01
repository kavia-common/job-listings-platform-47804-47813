import { component$ } from "@builder.io/qwik";
import type { Job } from "~/services/jobs";

/**
 * PUBLIC_INTERFACE
 * Card component to render a Job with styled layout.
 */
export default component$<{ job: Job }>(({ job }) => {
  const date = new Date(job.postedAt);
  const posted =
    isNaN(date.getTime()) ? "" : `Posted ${date.toLocaleDateString()}`;

  return (
    <article class="card job-card">
      <header>
        <h4 class="job-title">{job.title}</h4>
        <div class="kicker">
          {job.company} • <span class="text-muted">{job.location}</span>
        </div>
      </header>
      <div class="text-muted" style={{ fontSize: "0.95rem" }}>
        {job.description}
      </div>
      <footer style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <span class="badge">{job.type}</span>
        <span class="text-muted" style={{ marginLeft: "auto", fontSize: ".9rem" }}>
          {posted}
        </span>
      </footer>
    </article>
  );
});
