import type { RevealApi } from "reveal.js";

/**
 * Replaces <img class="inline-svg" src="…svg"> with the svg markup itself,
 * so reveal.js sees the fragments inside it (an svg loaded as an image is opaque).
 *
 * Must be registered after Markdown, and init is async: reveal.js waits for it
 * before looking for fragments.
 */
const InlineSvg = () => ({
  id: "inline-svg",

  async init(deck: RevealApi) {
    const images = deck.getRevealElement()?.querySelectorAll<HTMLImageElement>("img.inline-svg") ?? [];

    await Promise.all(
      [...images].map(async (img) => {
        try {
          const response = await fetch(img.src);
          if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
          const svg = new DOMParser().parseFromString(await response.text(), "image/svg+xml").documentElement;
          if (!(svg instanceof SVGSVGElement)) throw new Error("not an svg document");
          svg.classList.add("inline-svg");
          img.replaceWith(svg);
        } catch (error) {
          // Keep the image: still visible, only without fragments
          console.error(`[inline-svg] failed to inline ${img.src}`, error);
        }
      }),
    );
  },
});

export default InlineSvg;
