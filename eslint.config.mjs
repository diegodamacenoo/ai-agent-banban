import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import nextPlugin from "@next/eslint-plugin-next";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: true,
});

export default [
  {
    ignores: [
      // Supabase functions (Deno environment)
      "supabase/functions/",
      "supabase/functions/**/*",
      
      // Backend
      "backend/",

      // Node modules
      "node_modules/",
      
      // Build outputs
      ".next/",
      "out/",
      "dist/",
      "build/",
      
      // Type definitions
      "**/*.d.ts",
      
      // Arquivos específicos
      "src/shared/ui/Alert/AlertExamples.tsx",
      "src/features/multi-tenant/APITester.tsx",
      "src/features/multi-tenant/OrganizationSetup.tsx",
      "src/shared/utils/tenant-middleware.ts",
      "src/shared/utils/subdomain-middleware.ts",
      "src/shared/utils/api-router.ts",
      "src/shared/utils/audit-logger.ts",
      "src/features/security/safe-logger.ts",
      "src/core/supabase/admin.ts",
      "src/core/supabase/auth-helpers.ts",
      "src/app/auth/callback/route.ts"
    ],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": typescriptPlugin,
      "@next/next": nextPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      // Desabilitar regras que estão causando muitos warnings
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^(_|ip|request|cookieStore|userEmail|error|options|data|userId|organizationId|userAgent|ipAddress|cookies|headers|formData|formErrors|handleInputChange|handleSelectChange|router|loading|index|className|redirectUrl|T)$",
        "varsIgnorePattern": "^(_|ip|request|cookieStore|userEmail|error|options|data|userId|organizationId|userAgent|ipAddress|cookies|headers|formData|formErrors|handleInputChange|handleSelectChange|router|loading|index|className|redirectUrl|T|THEMES|TOAST_REMOVE_DELAY|actionTypes|MENU_DATA|logger|Comp|onDrag|onDragStart|onDragEnd|onAnimationStart|onAnimationEnd|onAnimationIteration|onTransitionEnd)$",
        "caughtErrorsIgnorePattern": "^(_|error)$"
      }],
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "react/no-array-index-key": "off",
      "no-console": ["warn", {
        "allow": ["warn", "error", "info", "debug"]
      }],
      "no-duplicate-imports": "warn",
      "require-await": "off",
      "prefer-template": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",
      "react-hooks/exhaustive-deps": "warn",
      
      // Regras específicas do Next.js
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-img-element": "off",
      
      // Regras para reduzir warnings comuns
      "no-unused-expressions": "off",
      "no-empty": "off",
      "no-fallthrough": "off",
      
      // Regras de acessibilidade
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
      
      // Regras React
      "react/no-unescaped-entities": "off",
      "react/jsx-key": "warn",
      "react/jsx-no-target-blank": "warn",
      
      // Regras TypeScript
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-extra-semi": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/explicit-function-return-type": "off"
    },
  },
];


// import { FlatCompat } from "@eslint/eslintrc";
// import { dirname } from "path";
// import { fileURLToPath } from "url";
// import typescriptPlugin from "@typescript-eslint/eslint-plugin";
// import typescriptParser from "@typescript-eslint/parser";
// import nextPlugin from "@next/eslint-plugin-next";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const compat = new FlatCompat({
//   baseDirectory: __dirname,
//   recommendedConfig: true,
// });

// export default [
//   {
//     ignores: [
//       // Supabase functions (Deno environment)
//       "supabase/functions/",
//       "supabase/functions/**/*",
      
//       // Node modules
//       "node_modules/",
      
//       // Build outputs
//       ".next/",
//       "out/",
//       "dist/",
//       "build/",
      
//       // Type definitions
//       "**/*.d.ts",
      
//       // Arquivos específicos
//       "src/shared/ui/Alert/AlertExamples.tsx",
//       "src/features/multi-tenant/APITester.tsx",
//       "src/features/multi-tenant/OrganizationSetup.tsx",
//       "src/shared/utils/tenant-middleware.ts",
//       "src/shared/utils/subdomain-middleware.ts",
//       "src/shared/utils/api-router.ts",
//       "src/shared/utils/audit-logger.ts",
//       "src/features/security/safe-logger.ts",
//       "src/core/supabase/admin.ts",
//       "src/core/supabase/auth-helpers.ts",
//       "src/app/auth/callback/route.ts"
//     ],
//   },
//   ...compat.extends("next/core-web-vitals"),
//   {
//     files: ["**/*.ts", "**/*.tsx"],
//     plugins: {
//       "@typescript-eslint": typescriptPlugin,
//       "@next/next": nextPlugin,
//     },
//     languageOptions: {
//       parser: typescriptParser,
//       parserOptions: {
//         project: "./tsconfig.json",
//       },
//     },
//     rules: {
//       // Desabilitar regras que estão causando muitos warnings
//       "@typescript-eslint/no-explicit-any": "off",
//       "@typescript-eslint/no-unused-vars": ["warn", {
//         "argsIgnorePattern": "^(_|ip|request|cookieStore|userEmail|error|options|data|userId|organizationId|userAgent|ipAddress|cookies|headers|formData|formErrors|handleInputChange|handleSelectChange|router|loading|index|className|redirectUrl|T)$",
//         "varsIgnorePattern": "^(_|ip|request|cookieStore|userEmail|error|options|data|userId|organizationId|userAgent|ipAddress|cookies|headers|formData|formErrors|handleInputChange|handleSelectChange|router|loading|index|className|redirectUrl|T|THEMES|TOAST_REMOVE_DELAY|actionTypes|MENU_DATA|logger|Comp|onDrag|onDragStart|onDragEnd|onAnimationStart|onAnimationEnd|onAnimationIteration|onTransitionEnd)$",
//         "caughtErrorsIgnorePattern": "^(_|error)$"
//       }],
//       "@typescript-eslint/no-non-null-assertion": "off",
//       "@typescript-eslint/no-floating-promises": "off",
//       "react/no-array-index-key": "off",
//       "no-console": ["warn", {
//         "allow": ["warn", "error", "info", "debug"]
//       }],
//       "no-duplicate-imports": "warn",
//       "require-await": "off",
//       "prefer-template": "warn",
//       "@typescript-eslint/prefer-optional-chain": "warn",
//       "@typescript-eslint/no-unnecessary-type-assertion": "warn",
//       "react-hooks/exhaustive-deps": "warn",
      
//       // Regras específicas do Next.js
//       "@next/next/no-html-link-for-pages": "off",
//       "@next/next/no-img-element": "off",
      
//       // Regras para reduzir warnings comuns
//       "no-unused-expressions": "off",
//       "no-empty": "off",
//       "no-fallthrough": "off",
      
//       // Regras de acessibilidade
//       "jsx-a11y/alt-text": "warn",
//       "jsx-a11y/aria-props": "warn",
//       "jsx-a11y/aria-proptypes": "warn",
//       "jsx-a11y/aria-unsupported-elements": "warn",
//       "jsx-a11y/role-has-required-aria-props": "warn",
//       "jsx-a11y/role-supports-aria-props": "warn",
      
//       // Regras React
//       "react/no-unescaped-entities": "off",
//       "react/jsx-key": "warn",
//       "react/jsx-no-target-blank": "warn",
      
//       // Regras TypeScript
//       "@typescript-eslint/no-empty-function": "off",
//       "@typescript-eslint/no-var-requires": "off",
      
//       // AIDEV-QUESTION: Should we enforce explicit return types for all functions?
//       // This could improve code clarity and catch potential bugs earlier.
//       // Example:
//       // "@typescript-eslint/explicit-function-return-type": "warn"
//       "@typescript-eslint/explicit-module-boundary-types": "off",
//       "@typescript-eslint/explicit-function-return-type": "off"
//     },
//   },
// ];
