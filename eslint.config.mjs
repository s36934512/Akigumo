import importPlugin from "eslint-plugin-import";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
    {
        ignores: [
            "**/node_modules/**",
            "**/dist/**",
            "**/coverage/**",
            "eslint.config.mjs",
            "generated/**",
            "uploads/**",
            "storage/**",
            "tmp/**"
        ]
    },
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts,tsx}"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module"
        },
        plugins: {
            import: importPlugin,
            "@typescript-eslint": tsEslintPlugin
        },
        rules: {
            "import/order": [
                "error",
                {
                    groups: ["builtin", "external", "internal", ["parent", "sibling"]],
                    pathGroups: [
                        {
                            pattern: "@akigumo/**",
                            group: "internal",
                            position: "before"
                        }
                    ],
                    pathGroupsExcludedImportTypes: ["builtin"],
                    "newlines-between": "always",
                    alphabetize: {
                        order: "asc",
                        caseInsensitive: true
                    }
                }
            ],
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["**/internal/**"],
                            message: "禁止直接匯入其他模組的 internal 資料夾，請透過該模組的 index.ts (Public API) 存取。"
                        }
                    ]
                }
            ]
        }
    }
];
