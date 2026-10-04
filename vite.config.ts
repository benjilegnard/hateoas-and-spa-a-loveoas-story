import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, PluginOption, type Plugin } from "vite";

/**
 * Reload all on markdown change
 */
const customHmr: () => PluginOption = () => ({
  name: "custom-hmr",
  enforce: "post",
  apply: "serve",
  handleHotUpdate({ file, server }) {
    if (file.endsWith(".md")) {
      console.log("markdown file changed, reloading...");

      server.ws.send({
        type: "full-reload",
        path: "*",
      });
    }
  },
});
/**
 * Inlines public/xkcd.svg at the top of <body>, so the symbols, filters and
 * styles it defines can be referenced by the diagrams of src/plugins/xkcd.ts.
 * (files of public/ can't be imported from JS)
 */
const inlineXkcdSprite = (): Plugin => {
  let sprite = "";
  return {
    name: "inline-xkcd-sprite",
    configResolved(config) {
      sprite = resolve(config.publicDir, "xkcd.svg");
    },
    configureServer(server) {
      server.watcher.add(sprite);
      server.watcher.on("change", (file) => {
        if (file === sprite) server.ws.send({ type: "full-reload" });
      });
    },
    transformIndexHtml(html) {
      return html.replace(/<body[^>]*>/, (body) => `${body}\n${readFileSync(sprite, "utf-8")}`);
    },
  };
};

export default defineConfig({
  plugins: [customHmr(), inlineXkcdSprite()],
});
