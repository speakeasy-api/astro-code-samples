// @ts-check
import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  env: {
    schema: {
      SPEAKEASY_API_KEY: {
        type: "string",
        access: "secret",
        context: "server",
        optional: false,
      },
    },
  },

  integrations: [tailwind(), mdx()],
});