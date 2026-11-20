// Lint only the files staged in the current commit (run by the Husky pre-commit hook).
const config = {
  "*.{ts,tsx,js,mjs}": ["eslint --max-warnings=0 --fix"],
};

export default config;
