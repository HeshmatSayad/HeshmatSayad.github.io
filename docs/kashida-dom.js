import { stretch } from "./kashida.js";

// Kashida stretching per FONT_RULES.md — display-only: applied to every visible
// text node at render time, so the crawled HTML source stays raw (Rule 2).
const EXCLUDED = "script, style, noscript, textarea, input, [contenteditable]";

// Cheap pre-filter: text without any Arabic-script character cannot contain a
// valid join, so stretching would return it unchanged. Avoids canvas measuring
// Latin/digit-only nodes.
const JOINABLE = /[\u0600-\u06FF]/;

// Rewrites text nodes in place. Measurements are collected first and applied in
// one batch, so DOM writes never invalidate a getComputedStyle() read; the
// canvas context font is set only when it changes between nodes.
export function applyKashida(root = document.body) {
  const ctx = document.createElement("canvas").getContext("2d");
  const measureByFont = new Map();
  let activeFont = "";
  const pending = [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest(EXCLUDED)) return NodeFilter.FILTER_REJECT;
      const text = node.nodeValue;
      return text.trim() && JOINABLE.test(text)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const cs = getComputedStyle(node.parentElement);
    const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;

    let measure = measureByFont.get(font);
    if (!measure) {
      measure = (s) => ctx.measureText(s).width;
      measureByFont.set(font, measure);
    }
    if (font !== activeFont) {
      ctx.font = font;
      activeFont = font;
    }

    const text = node.nodeValue;
    const result = stretch(text, measure);
    if (result !== text) pending.push(node, result);
  }

  for (let i = 0; i < pending.length; i += 2) {
    pending[i].nodeValue = pending[i + 1];
  }
}
