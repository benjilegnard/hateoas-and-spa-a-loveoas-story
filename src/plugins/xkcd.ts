import type { RevealApi, RevealPlugin } from "reveal.js";
import sprite from "./xkcd.svg?raw";
import fontUrl from "./xkcd-script.woff?url";

export interface XkcdPlugin extends RevealPlugin {
  id: "xkcd";
}

const POSES = ["idle", "talk", "shrug", "armsup", "point", "facepalm"] as const;
type Pose = (typeof POSES)[number];
type Speaker = "A" | "B";

interface Utterance {
  speaker: Speaker;
  pose: Pose;
  text: string;
}

const SVG_NS = "http://www.w3.org/2000/svg";

// Layout, in viewBox units (the symbols in xkcd.svg are 200x280)
const WIDTH = 1280;
const HEIGHT = 720;
const FIGURE = { width: 200, height: 280, y: HEIGHT - 280 };
const SPEAKER_X: Record<Speaker, number> = { A: 200, B: WIDTH - 200 };
const TEXT_MARGIN = 60;
const TEXT_TOP = 20;
const TEXT_BOTTOM = FIGURE.y; // keep the text above the heads
const TEXT_WIDTH = 760; // max width of a line, wrapping is done to fit it
const CHAR_WIDTH = 0.45; // average character width of xkcd Script, in em
const FONT_SIZE = 48;
const LINE_HEIGHT = 1.2;
const POINTER = 46; // length of the line from the text to the speaker
const GAP = 14;

const LINE_PATTERN = /^\s*([AB])(?:\((\w+)\))?\s*:\s*(.*)$/;

const isPose = (pose: string): pose is Pose =>
  (POSES as readonly string[]).includes(pose);

/**
 * Parses lines like `A: Hello` or `B(shrug): Dunno`.
 * A line that doesn't match continues the previous utterance.
 */
export const parse = (source: string): Utterance[] => {
  const utterances: Utterance[] = [];
  for (const line of source.split("\n")) {
    if (!line.trim()) continue;

    const match = LINE_PATTERN.exec(line);
    if (match) {
      const [, speaker, pose = "talk", text = ""] = match;
      if (!isPose(pose)) {
        console.warn(`[xkcd] unknown pose "${pose}", using "talk"`);
      }
      utterances.push({
        speaker: speaker as Speaker,
        pose: isPose(pose) ? pose : "talk",
        text: text.trim(),
      });
      continue;
    }

    const previous = utterances.at(-1);
    if (!previous) throw new Error(`[xkcd] expected "A: ..." or "B: ...", got "${line}"`);
    previous.text = `${previous.text} ${line.trim()}`;
  }
  return utterances;
};

const wrap = (text: string, maxChars: number): string[] => {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    if (current && current.length + word.length + 1 > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
};

const svgElement = <K extends keyof SVGElementTagNameMap>(
  name: K,
  attributes: Record<string, string | number> = {},
): SVGElementTagNameMap[K] => {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  return element;
};

const figure = (speaker: Speaker): SVGGElement => {
  const group = svgElement("g", {
    class: `xkcd-figure xkcd-figure-${speaker.toLowerCase()}`,
  });
  // Poses are drawn facing right, B is mirrored to face A
  if (speaker === "B") group.setAttribute("transform", `translate(${WIDTH} 0) scale(-1 1)`);
  const position = {
    x: SPEAKER_X.A - FIGURE.width / 2,
    y: FIGURE.y,
    width: FIGURE.width,
    height: FIGURE.height,
  };
  group.append(
    svgElement("use", { class: "xkcd-body", href: "#xkcd-pose-idle", ...position }),
    svgElement("use", { class: "xkcd-head", href: "#xkcd-head", ...position }),
  );
  return group;
};

/**
 * Finds the biggest scale at which the dialogue fits above the heads.
 * Smaller text also means more characters per line, so lines are re-wrapped
 * at each step.
 */
const layout = (utterances: Utterance[]) => {
  let scale = 1;
  for (;;) {
    const maxChars = Math.floor(TEXT_WIDTH / (CHAR_WIDTH * FONT_SIZE * scale));
    const wrapped = utterances.map(({ text }) => wrap(text, maxChars));
    const lines = wrapped.reduce((total, { length }) => total + length, 0);
    const height =
      (lines * FONT_SIZE * LINE_HEIGHT + utterances.length * (POINTER + GAP) - GAP) * scale;
    if (height <= TEXT_BOTTOM - TEXT_TOP || scale <= 0.2) return { scale, wrapped };
    scale -= 0.01;
  }
};

export const render = (utterances: Utterance[]): SVGSVGElement => {
  const svg = svgElement("svg", {
    class: "xkcd",
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    role: "img",
  });
  svg.append(figure("A"), figure("B"));

  const { scale, wrapped } = layout(utterances);
  const fontSize = FONT_SIZE * scale;
  const lineHeight = fontSize * LINE_HEIGHT;

  let y = TEXT_TOP;
  utterances.forEach(({ speaker, pose }, index) => {
    const lines = wrapped[index] ?? [];
    const group = svgElement("g", {
      class: "fragment xkcd-line",
      "data-speaker": speaker,
      "data-pose": pose,
    });

    const x = speaker === "A" ? TEXT_MARGIN : WIDTH - TEXT_MARGIN;
    const text = svgElement("text", {
      x,
      y,
      "font-size": fontSize,
      "text-anchor": speaker === "A" ? "start" : "end",
      "dominant-baseline": "hanging",
    });
    lines.forEach((line, i) => {
      const tspan = svgElement("tspan", { x, dy: i === 0 ? 0 : lineHeight });
      tspan.textContent = line;
      text.append(tspan);
    });
    y += lines.length * lineHeight;

    // Short hand-drawn line from the text towards the speaker's head
    const direction = speaker === "A" ? 1 : -1;
    const fromX = SPEAKER_X[speaker] + 40 * direction;
    const toX = SPEAKER_X[speaker] + 16 * direction;
    const fromY = y + 6 * scale;
    const toY = y + (POINTER - 6) * scale;
    const pointer = svgElement("path", {
      class: "xkcd-pointer",
      d: `M${fromX} ${fromY} Q${fromX - 4 * direction} ${(fromY + toY) / 2} ${toX} ${toY}`,
    });

    group.append(text, pointer);
    svg.append(group);
    y += (POINTER + GAP) * scale;
  });

  return svg;
};

/**
 * Updates figures from the fragments state: each character takes the pose of
 * their last visible line, and the one of the current fragment is talking.
 */
const sync = (svg: SVGSVGElement) => {
  const lines = [...svg.querySelectorAll<SVGGElement>(".xkcd-line")];
  for (const speaker of ["A", "B"] as const) {
    const last = lines
      .filter((line) => line.dataset.speaker === speaker && line.classList.contains("visible"))
      .at(-1);
    svg
      .querySelector(`.xkcd-figure-${speaker.toLowerCase()} .xkcd-body`)
      ?.setAttribute("href", `#xkcd-pose-${last?.dataset.pose ?? "idle"}`);
  }

  const current = lines.find((line) => line.classList.contains("current-fragment"));
  if (current?.dataset.speaker) svg.dataset.talking = current.dataset.speaker;
  else delete svg.dataset.talking;
};

/**
 * Adds the sprite (symbols and styles) at the top of <body>, and registers the
 * "xkcd Script" font. Done here rather than in the sprite's <style>, so Vite
 * resolves the font URL (base path, hash).
 */
const install = () => {
  if (document.getElementById("xkcd-sprite")) return;
  document.body.insertAdjacentHTML("afterbegin", sprite);
  document.fonts.add(new FontFace("xkcd Script", `url(${fontUrl}) format("woff")`, { display: "block" }));
};

/**
 * Renders ```xkcd code blocks produced by the markdown plugin
 * (marked outputs them as <pre><code class="language-xkcd">) into inline SVG
 * dialogues, using the definitions of xkcd.svg.
 *
 * Must be registered after Markdown and before Highlight, so it runs once
 * slides are converted and before highlight.js touches the code blocks.
 */
const Xkcd = (): XkcdPlugin => ({
  id: "xkcd",

  init(deck: RevealApi) {
    install();

    const blocks =
      deck
        .getRevealElement()
        ?.querySelectorAll<HTMLElement>("pre > code.xkcd, pre > code.language-xkcd") ?? [];

    for (const code of blocks) {
      const pre = code.parentElement!;
      try {
        pre.replaceWith(render(parse(code.textContent ?? "")));
      } catch (error) {
        // Keep the source visible so the error is easy to spot on the slide
        console.error("[xkcd] failed to render dialogue", error);
        pre.classList.add("xkcd-error");
      }
    }

    const syncCurrentSlide = () =>
      deck.getCurrentSlide()?.querySelectorAll<SVGSVGElement>("svg.xkcd").forEach(sync);

    for (const event of ["ready", "slidechanged", "fragmentshown", "fragmenthidden"]) {
      deck.on(event, syncCurrentSlide);
    }
  },
});

export default Xkcd;
