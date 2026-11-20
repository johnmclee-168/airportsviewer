// Lint and format only the files staged in the current commit (run by the Husky pre-commit hook).
const config = {
  "*.{ts,tsx,js,mjs}": ["eslint --max-warnings=0 --fix", "prettier --write"],
  "*.{json,md,css,yml,yaml}": ["prettier --write"],
};

export default config;
