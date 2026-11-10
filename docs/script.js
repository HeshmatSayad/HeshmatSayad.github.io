import { initReveal } from "./reveal.js";
import { applyKashida } from "./kashida-dom.js";

initReveal();

// Kashida needs final font metrics, so it runs once fonts are ready. If the
// font set fails to resolve, stretching still runs with the fallback metrics.
const runKashida = () => applyKashida();
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(runKashida, runKashida);
} else {
  window.addEventListener("load", runKashida);
}
