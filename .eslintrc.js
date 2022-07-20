module.exports = {
	"env": {
		"browser": true,
		"es2022": true
	},
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended"
	],
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"ecmaVersion": "latest",
		"sourceType": "module"
	},
	"plugins": [
		"@typescript-eslint"
	],
	"ignorePatterns": ["*.js", "*.html"],
	"rules": {
		"no-undef": "off",
		"@typescript-eslint/no-unused-vars": "off",
		"@typescript-eslint/ban-ts-comment": "off",
		"@typescript-eslint/no-this-alias": "off"
	}
}
