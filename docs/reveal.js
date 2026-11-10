// Reveal-on-scroll. body.js gates the hidden state so content stays visible
// when JavaScript is unavailable.
export function initReveal() {
  document.body.classList.add("js");

  const items = document.querySelectorAll(".reveal");

  // Older browsers without IntersectionObserver get the final state directly
  // instead of permanently hidden sections.
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08 }
  );

  items.forEach((el) => observer.observe(el));
}
