module.exports = {
	printWidth: 100,
	tabWidth: 2,
	useTabs: false,
	semi: true,
	singleQuote: true,
	trailingComma: "es5",
	bracketSpacing: true,
	arrowParens: "avoid",
	endOfLine: "lf",
	plugins: ["@ianvs/prettier-plugin-sort-imports"],
	// Настройки сортировки
	importOrder: [
		"<BUILTIN_MODULES>",
		"<THIRD_PARTY_MODULES>",
		"",
		"^[./]", // Относительные пути
		"",
		"\\.s?css$" // Стили всегда в хвосте
	],
	importOrderTypeScriptVersion: "5.0.0",
	importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
	importOrderCaseInsensitive: true,
};