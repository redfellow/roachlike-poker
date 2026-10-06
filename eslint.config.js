import js from "@eslint/js";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";

export default tseslint.config(
	{ ignores: ["**/.history/**", "**/dist/**", "node_modules/**", "data/**", "playwright-report/**", "test-results/**"] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		languageOptions: { globals: { ...globals.node, ...globals.browser } },
		plugins: { "@stylistic": stylistic },
		rules: {
			"@stylistic/brace-style": ["error", "stroustrup", { allowSingleLine: true }],
			"@stylistic/indent": ["error", "tab", { SwitchCase: 1 }],
			"@stylistic/quotes": ["error", "double", { avoidEscape: true }],
			"@stylistic/semi": ["error", "always"],
			"@typescript-eslint/no-explicit-any": "error",
			"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
			"no-restricted-syntax": ["error", { selector: "ArrowFunctionExpression[body.type='BlockStatement']", message: "Use a named/function expression for multiline functions." }]
		}
	},
	{
		files: ["**/*.ts", "**/*.tsx"],
		rules: { "@typescript-eslint/explicit-module-boundary-types": "error" }
	}
);
