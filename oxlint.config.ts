import { defineConfig } from 'oxlint';

export default defineConfig({
	rules: {
		// Только логика и безопасность
		"curly": ["error", "all"],
		"no-debugger": "error",
		"no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
		"no-explicit-any": "warn",
		"consistent-type-imports": ["error", { "prefer": "type-imports" }],
	},
	ignorePatterns: ["**/node_modules/**", "**/dist/**", "**/build/**"]
})