import {
  component$,
  useSignal,
  useVisibleTask$,
  $,
  type QRL,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import Header from "~/components/Header";
import FilterSidebar, { type FilterState } from "~/components/FilterSidebar";
import JobCard from "~/components/JobCard";
import NewJobModal from "~/components/NewJobModal";
import {
  fetchJobs$,
  setPendingJobFromUi$,
  postJobFromUi$,
  type Job,
} from "~/services/jobs";

// PUBLIC_INTERFACE
export default component$(() => {
  const jobs = useSignal<Job[]>([]);
  const filtered = useSignal<Job[]>([]);
  const filters = useSignal<FilterState>({
    keyword: "",
    location: "",
    type: "",
  });
  const modalOpen = useSignal<boolean>(false);
  const loading = useSignal<boolean>(true);

  // Load jobs with mock fallback when needed
  useVisibleTask$(() => {
    loading.value = true;
    queueMicrotask(() => {
      fetchJobs$()
        .then((data) => {
          jobs.value = data;
          // derive filtered list using serializable snapshot of filters
          filtered.value = applyFilters(data, {
            keyword: filters.value.keyword,
            location: filters.value.location,
            type: filters.value.type,
          });
          loading.value = false;
        })
        .catch(() => {
          loading.value = false;
        });
    });
  });

  // Handler accepts a plain value to avoid capturing the outer signal object
  const onFiltersChanged: QRL<(value: FilterState) => void> = $(
    (value: FilterState) => {
      // write new value
      filters.value = {
        keyword: value.keyword,
        location: value.location,
        type: value.type,
      };
      // compute filtered list based on serializable values, not signal refs
      filtered.value = applyFilters(
        jobs.value.slice(),
        {
          keyword: value.keyword,
          location: value.location,
          type: value.type,
        },
      );
    },
  );

  // Zero-arg open/close handlers that touch only their own signals
  const openModal = $(() => {
    modalOpen.value = true;
  });
  const closeModal = $(() => {
    modalOpen.value = false;
  });

  // Zero-arg submit handler which posts from a global pending store to avoid capturing locals.
  const submitNewJob = $(async () => {
    const created = await postJobFromUi$();
    // update lists using serializable snapshots to prevent accidental captures
    const nextJobs = [created, ...jobs.value];
    jobs.value = nextJobs;
    filtered.value = applyFilters(nextJobs, {
      keyword: filters.value.keyword,
      location: filters.value.location,
      type: filters.value.type,
    });
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
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(260px, 1fr))",
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

      <NewJobModal
        open={modalOpen.value}
        onClose$={closeModal}
        onSubmit$={setPendingJobFromUi$}
        onAfterSubmit$={submitNewJob}
      />
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
