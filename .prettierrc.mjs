/**
 * Prettier formatting rules (run via `npm run format` and the Husky pre-commit hook).
 * ESLint handles code-quality rules; eslint-config-prettier turns off any
 * ESLint stylistic rules that would conflict with these.
 *
 * @type {import("prettier").Config}
 */
const config = {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  plugins: ["prettier-plugin-tailwindcss"],
  // Tailwind v4: point the class-sorting plugin at the CSS entry point.
  tailwindStylesheet: "./src/app/globals.css",
};

export default config;
