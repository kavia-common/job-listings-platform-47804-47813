import { component$, $, type PropFunction } from "@builder.io/qwik";
import type { JobType } from "~/services/jobs";

export interface FilterState {
  keyword: string;
  location: string;
  type: "" | JobType;
}

interface Props {
  value: FilterState;
  onChange$: PropFunction<(value: FilterState) => void>;
}

/**
 * PUBLIC_INTERFACE
 * Sidebar filters component: keyword, location and type.
 */
export default component$<Props>(({ value, onChange$ }) => {
  // Wrap in $() to make it serializable for Qwik
  const apply = $((patch: Partial<FilterState>) => {
    onChange$({ ...value, ...patch });
  });

  return (
    <aside class="card sidebar">
      <div style={{ padding: "16px" }}>
        <h3 class="h2">Filters</h3>
        <div style={{ display: "grid", gap: "12px" }}>
          <div>
            <label class="label" for="kw">
              Keyword
            </label>
            <input
              id="kw"
              class="input"
              type="text"
              placeholder="Search by title or company"
              value={value.keyword}
              onInput$={(e) =>
                apply({ keyword: (e.target as HTMLInputElement).value })
              }
            />
          </div>
          <div>
            <label class="label" for="loc">
              Location
            </label>
            <input
              id="loc"
              class="input"
              type="text"
              placeholder="City, State or Remote"
              value={value.location}
              onInput$={(e) =>
                apply({ location: (e.target as HTMLInputElement).value })
              }
            />
          </div>
          <div>
            <label class="label" for="type">
              Job Type
            </label>
            <select
              id="type"
              class="select"
              value={value.type}
              onChange$={(e) =>
                apply({ type: (e.target as HTMLSelectElement).value as any })
              }
            >
              <option value="">Any</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
});
