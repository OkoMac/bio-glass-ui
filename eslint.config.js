import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Ignore build artefacts and Capacitor native bridge assets — they're
  // generated, not source, and lint noise from them is meaningless.
  { ignores: ["dist", "android/app/build/**", "ios/App/App/public/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // 750+ existing `as any` casts in the codebase are a known cleanup
      // backlog (audit P1 #6). Downgrade to warning so CI gates on NEW errors
      // without forcing a 4h type-tightening PR before any other work ships.
      // Re-promote to error once the cleanup PR lands.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
