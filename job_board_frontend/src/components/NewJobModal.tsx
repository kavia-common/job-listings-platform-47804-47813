import { component$, useSignal, $, type PropFunction } from "@builder.io/qwik";
import type { JobType } from "~/services/jobs";

interface FormState {
  title: string;
  company: string;
  location: string;
  type: JobType | "";
  description: string;
}

interface Props {
  open: boolean;
  onClose$: PropFunction<() => void>;
  onSubmit$: PropFunction<
    (payload: Omit<FormState, "type"> & { type: JobType }) => Promise<void>
  >;
  onAfterSubmit$?: PropFunction<() => Promise<void> | void>;
}

/**
 * PUBLIC_INTERFACE
 * Modal dialog for posting a new job with client-side required field validation.
 */
export default component$<Props>(({ open, onClose$, onSubmit$, onAfterSubmit$ }) => {
  const form = useSignal<FormState>({
    title: "",
    company: "",
    location: "",
    type: "",
    description: "",
  });
  const error = useSignal<string>("");

  const resetAndClose = $(() => {
    form.value = { title: "", company: "", location: "", type: "", description: "" };
    error.value = "";
    onClose$();
  });

  const submit = $(async () => {
    error.value = "";
    if (!form.value.title || !form.value.company || !form.value.location || !form.value.type || !form.value.description) {
      error.value = "Please fill in all required fields.";
      return;
    }
    await onSubmit$({
      title: form.value.title.trim(),
      company: form.value.company.trim(),
      location: form.value.location.trim(),
      type: form.value.type as JobType,
      description: form.value.description.trim(),
    });
    if (onAfterSubmit$) {
      await onAfterSubmit$();
    }
    await resetAndClose();
  });

  if (!open) return null;

  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Post a new job">
      <div class="modal">
        <div class="modal-header">
          <h3 class="h2" style={{ fontSize: "1.2rem" }}>Post a job</h3>
          <button class="btn btn-secondary" onClick$={resetAndClose} aria-label="Close">Close</button>
        </div>
        <div class="modal-body">
          <div style={{ display: "grid", gap: "12px" }}>
            <div>
              <label class="label" for="title">Title</label>
              <input
                id="title"
                class="input"
                placeholder="e.g., Senior Frontend Engineer"
                value={form.value.title}
                onInput$={(e) => (form.value = { ...form.value, title: (e.target as HTMLInputElement).value })}
                required
              />
            </div>
            <div>
              <label class="label" for="company">Company</label>
              <input
                id="company"
                class="input"
                placeholder="Your company name"
                value={form.value.company}
                onInput$={(e) => (form.value = { ...form.value, company: (e.target as HTMLInputElement).value })}
                required
              />
            </div>
            <div>
              <label class="label" for="location">Location</label>
              <input
                id="location"
                class="input"
                placeholder="City, State or Remote"
                value={form.value.location}
                onInput$={(e) => (form.value = { ...form.value, location: (e.target as HTMLInputElement).value })}
                required
              />
            </div>
            <div>
              <label class="label" for="type">Job Type</label>
              <select
                id="type"
                class="select"
                value={form.value.type}
                onChange$={(e) => (form.value = { ...form.value, type: (e.target as HTMLSelectElement).value as any })}
                required
              >
                <option value="">Select type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
            <div>
              <label class="label" for="desc">Description</label>
              <textarea
                id="desc"
                class="textarea"
                placeholder="Describe the role, responsibilities, and requirements."
                rows={5}
                value={form.value.description}
                onInput$={(e) => (form.value = { ...form.value, description: (e.target as HTMLTextAreaElement).value })}
                required
              />
            </div>
            {error.value && <div class="error">{error.value}</div>}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" onClick$={resetAndClose}>Cancel</button>
          <button class="btn btn-amber" onClick$={submit}>Post Job</button>
        </div>
      </div>
    </div>
  );
});
