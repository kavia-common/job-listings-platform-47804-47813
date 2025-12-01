import { component$, Slot } from "@builder.io/qwik";

/**
 * PUBLIC_INTERFACE
 * Header component with brand and right-aligned actions slot.
 */
export default component$(() => {
  return (
    <header class="header">
      <div class="container header-inner">
        <a class="brand" href="/">
          <div class="brand-badge">JB</div>
          <div class="brand-title">
            Job Board
            <div class="text-muted" style={{ fontSize: "0.85rem" }}>
              Ocean Professional
            </div>
          </div>
        </a>
        <div>
          <Slot />
        </div>
      </div>
    </header>
  );
});
