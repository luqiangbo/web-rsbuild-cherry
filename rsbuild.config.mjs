import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSvgr } from "@rsbuild/plugin-svgr";
import { TanStackRouterRspack } from "@tanstack/router-plugin/rspack";

export default defineConfig({
  plugins: [pluginReact(), pluginSvgr()],
  server: {
    port: 3009,
  },
  resolve: {
    alias: {
      "@": "./src",
    },
  },
  html: {
    template: "./static/index.html",
  },
  tools: {
    rspack: {
      plugins: [
        TanStackRouterRspack({
          target: "react",
          autoCodeSplitting: true,
          disableTypes: true,
          generatedRouteTree: "./src/routeTree.gen.js",
        }),
      ],
    },
  },
});
