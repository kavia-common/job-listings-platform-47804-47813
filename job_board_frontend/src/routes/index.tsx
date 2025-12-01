import {
  component$,
  useSignal,
  useVisibleTask$,
  $,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import Header from "~/components/Header";
import FilterSidebar, { type FilterState } from "~/components/FilterSidebar";
import JobCard from "~/components/JobCard";
import NewJobModal from "~/components/NewJobModal";
import { fetchJobs$, postJob$, type Job } from "~/services/jobs";

// PUBLIC_INTERFACE
export default component$(() => {
  const jobs = useSignal<Job[]>([]);
  const filtered = useSignal<Job[]>([]);
  const filters = useSignal<FilterState>({ keyword: "", location: "", type: "" });
  const modalOpen = useSignal<boolean>(false);
  const loading = useSignal<boolean>(true);

  // Load jobs with mock fallback when needed
  useVisibleTask$(() => {
    loading.value = true;
    // Avoid capturing AbortSignal to satisfy Qwik QRL serialization
    queueMicrotask(() => {
      fetchJobs$().then((data) => {
        jobs.value = data;
        filtered.value = applyFilters(data, filters.value);
        loading.value = false;
      }).catch(() => {
        loading.value = false;
      });
    });
  });

  const onFiltersChanged = $((value: FilterState) => {
    filters.value = value;
    filtered.value = applyFilters(jobs.value, value);
  });

  const openModal = $(() => (modalOpen.value = true));
  const closeModal = $(() => (modalOpen.value = false));

  const submitNewJob = $(async (payload: {
    title: string;
    company: string;
    location: string;
    type: Job["type"];
    description: string;
  }) => {
    // Post via service (mock if no API)
    const created = await postJob$(payload);
    jobs.value = [created, ...jobs.value];
    filtered.value = applyFilters(jobs.value, filters.value);
  });

  return (
    <>
      <Header>
        <button class="btn btn-primary" onClick$={openModal}>
          Post a Job
        </button>
      </Header>

      <section class="section">
        <div class="container">
          <div style={{ marginBottom: "12px" }}>
            <h1 class="h1">Discover opportunities</h1>
            <div class="text-muted" style={{ marginTop: "4px" }}>
              Browse open roles and find your next move.
            </div>
          </div>

          <div class="page-grid">
            <FilterSidebar value={filters.value} onChange$={onFiltersChanged} />

            <div>
              {loading.value ? (
                <div class="card" style={{ padding: "16px" }}>
                  Loading jobs...
                </div>
              ) : filtered.value.length === 0 ? (
                <div class="card" style={{ padding: "16px" }}>
                  No jobs match your filters.
                </div>
              ) : (
                <div
                  class="grid"
                  style={{
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  }}
                >
                  {filtered.value.map((job) => (
                    <JobCard job={job} key={job.id} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <NewJobModal open={modalOpen.value} onClose$={closeModal} onSubmit$={submitNewJob} />
    </>
  );
});

function applyFilters(list: Job[], f: FilterState): Job[] {
  const kw = f.keyword.trim().toLowerCase();
  const loc = f.location.trim().toLowerCase();
  const type = f.type;
  return list.filter((j) => {
    const byKw =
      !kw ||
      j.title.toLowerCase().includes(kw) ||
      j.company.toLowerCase().includes(kw) ||
      j.description.toLowerCase().includes(kw);
    const byLoc = !loc || j.location.toLowerCase().includes(loc);
    const byType = !type || j.type === type;
    return byKw && byLoc && byType;
  });
}

export const head: DocumentHead = {
  title: "Job Board • Ocean Professional",
  meta: [
    {
      name: "description",
      content:
        "A modern job board to browse openings and post new roles. Ocean Professional theme.",
    },
  ],
};
