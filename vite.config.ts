import { defineConfig, PluginOption } from "vite";

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

export default defineConfig({
  plugins: [customHmr()],
});
