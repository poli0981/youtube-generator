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

      // eslint-plugin-react-hooks 7 turned on the React Compiler diagnostics.
      // They are worth having — four of the seven they flagged on arrival were
      // real extra render passes and were fixed (use-online-status moved to
      // `useSyncExternalStore`, ShortcutHelpModal now derives instead of
      // resetting in an effect, DraftIndicator and use-languages-ready were
      // guarded).
      //
      // Three remain, all genuinely syncing state FROM an external source:
      //   src/hooks/use-languages-ready.ts   — i18next bundle readiness
      //   src/components/editor/PlaytestEditor.tsx — text mirror of a store number
      //   src/components/editor/StoreLinkEditor.tsx — compiler can't preserve a useMemo
      //
      // Each needs a real restructure, not a guard, so they are warnings rather
      // than a reason to hold back the ESLint 10 upgrade or to delete the rule.
      // Downgrade — do not remove: the signal is the point.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
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
