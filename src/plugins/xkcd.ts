import type { RevealApi, RevealPlugin } from "reveal.js";

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

// Layout, in viewBox units (the symbols in public/xkcd.svg are 200x280)
const WIDTH = 1280;
const HEIGHT = 720;
const FIGURE = { width: 200, height: 280, y: HEIGHT - 280 };
const SPEAKER_X: Record<Speaker, number> = { A: 200, B: WIDTH - 200 };
const TEXT_MARGIN = 60;
const TEXT_TOP = 40;
const TEXT_BOTTOM = FIGURE.y - 20; // keep the text above the heads
const FONT_SIZE = 40;
const LINE_HEIGHT = 1.2;
const POINTER = 46; // length of the line from the text to the speaker
const GAP = 14;
const WRAP = 36; // max characters per line

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

const wrap = (text: string): string[] => {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    if (current && current.length + word.length + 1 > WRAP) {
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
  group.append(
    svgElement("use", {
      class: "xkcd-body",
      href: "#xkcd-pose-idle",
      x: SPEAKER_X.A - FIGURE.width / 2,
      y: FIGURE.y,
      width: FIGURE.width,
      height: FIGURE.height,
    }),
  );
  return group;
};

export const render = (utterances: Utterance[]): SVGSVGElement => {
  const svg = svgElement("svg", {
    class: "xkcd",
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    role: "img",
  });
  svg.append(figure("A"), figure("B"));

  // Shrink everything proportionally when the dialogue is too long
  const wrapped = utterances.map(({ text }) => wrap(text));
  const naturalHeight = wrapped.reduce(
    (total, lines) => total + lines.length * FONT_SIZE * LINE_HEIGHT + POINTER + GAP,
    0,
  );
  const scale = Math.min(1, (TEXT_BOTTOM - TEXT_TOP) / naturalHeight);
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
 * Renders ```xkcd code blocks produced by the markdown plugin
 * (marked outputs them as <pre><code class="language-xkcd">) into inline SVG
 * dialogues, using the definitions of public/xkcd.svg.
 *
 * Must be registered after Markdown and before Highlight, so it runs once
 * slides are converted and before highlight.js touches the code blocks.
 */
const Xkcd = (): XkcdPlugin => ({
  id: "xkcd",

  init(deck: RevealApi) {
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
