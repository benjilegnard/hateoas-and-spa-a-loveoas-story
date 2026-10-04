import "reveal.js/reveal.css";
import "./style.scss";

import Reveal from "reveal.js";
import Markdown from "reveal.js/plugin/markdown";
import Notes from "reveal.js/plugin/notes";
import Highlight from "reveal.js/plugin/highlight";
import Mermaid from "@benjilegnard/reveal.js-mermaid-plugin";
import Xkcd from "./plugins/xkcd";
import { flavors } from "@catppuccin/palette";
const { colors } = flavors.latte;

let deck = new Reveal({
  plugins: [Markdown, Mermaid, Xkcd, Notes, Highlight],
});

deck.initialize({
  progress: false,
  controls: false,
  slideNumber: "c/t",
  showSlideNumber: "speaker",
  hashOneBasedIndex: true,
  hash: true,
  transition: "none",
  history: true,
  mermaid: {
    theme: "base",
    themeVariables: {
      darkMode: false,
      background: colors.crust.hex,
      fontFamily: "Poppins, Helvetica, sans-serif",
      primaryColor: colors.surface0.hex,
      primaryTextColor: colors.text.hex,
      primaryBorderColor: colors.mauve.hex,
      secondaryBorderColor: colors.pink.hex,
      secondaryColor: colors.mantle.hex,
      tertiaryColor: colors.base.hex,
      lineColor: colors.overlay2.hex,
      textColor: colors.subtext1.hex,
      edgeLabelBackground: colors.base.hex,
      relationLabelBackground: colors.base.hex,
      // sequence diagram
      noteBkgColor: colors.mantle.hex,
      noteBorderColor: colors.pink.hex,
      noteTextColor: colors.text.hex,
      activationBkgColor: colors.surface1.hex,
      activationBorderColor: colors.mauve.hex,
      actorLineColor: colors.overlay1.hex,
      signalColor: colors.overlay2.hex,
    },
  },
});
