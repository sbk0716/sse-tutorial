import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    ignores: ["dist/**/*"],
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "prettier/prettier": "error",
      "no-console": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.json",
      },
      globals: {
        node: true,
        es6: true,
        console: true,
        process: true,
        require: true,
        module: true,
        exports: true,
      },
    },
  },
];
