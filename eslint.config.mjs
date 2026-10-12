import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "convex/_generated/**",
    "playwright-report/**",
    "test-results/**",
  ]),
  {
    files: ["e2e/**"],
    rules: {
      // Playwright fixture callbacks use a param often named `use`; not React's use().
      "react-hooks/rules-of-hooks": "off",
    },
  },
]);

export default eslintConfig;
