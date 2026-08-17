import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // Tests index into fixture arrays constantly, and `noUncheckedIndexedAccess`
    // makes every one of those reads `T | undefined`. A `!` there asserts the
    // fixture the test itself just built — the alternative is a guard clause per
    // lookup that can only ever fail if the test is already broken. Production
    // code keeps the rule.
    files: ["tests/**/*.ts", "tests/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  {
    ignores: ["dist/", "node_modules/", "*.config.*"],
  },
);
