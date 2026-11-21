/**
 * Commit message rules enforced by the Husky `commit-msg` hook.
 *
 * Format:  <type>(<optional scope>): <subject>
 * Allowed types: feature | chore | hotfix | fix
 * Example: feature(list): show airports with name and country
 */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", ["feature", "chore", "hotfix", "fix"]],
    "subject-case": [0],
    "body-max-line-length": [1, "always", 100],
  },
};

export default config;
