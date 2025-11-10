import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSvgr } from "@rsbuild/plugin-svgr";
import { pluginSass } from "@rsbuild/plugin-sass";
import { tanstackRouter } from "@tanstack/router-plugin/rspack";
import { pluginRem } from "@rsbuild/plugin-rem";

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginSass(),
    pluginSvgr({
      svgrOptions: {
        exportType: "default", // 默认导出组件
        dimensions: false, // 禁用 SVG 文件的宽度和高度属性，使用 CSS 控制大小
      },
    }),
    pluginRem({
      enableRuntime: true,
      inlineRuntime: true,
      screenWidth: 375,
      rootFontSize: 100,
      maxRootFontSize: 120,
      widthQueryKey: "w",
      excludeEntries: [],
      supportLandscape: false,
      useRootFontSizeBeyondMax: false,
    }),
  ],
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
        tanstackRouter({
          target: "react", // 我要 React 路由
          autoCodeSplitting: true, // 帮我自动分包
          disableTypes: true, // 别给我 TS
          generatedRouteTree: "./src/routeTree.gen.js", // 生成的总路由放这
        }),
      ],
    },
  },
});
