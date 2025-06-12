import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Permitir variáveis não utilizadas (útil durante desenvolvimento)
      "@typescript-eslint/no-unused-vars": "warn",
      
      // Permitir uso de 'any' em alguns casos
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Permitir caracteres especiais em strings JSX
      "react/no-unescaped-entities": "off",
      
      // Permitir prefer-const como warning
      "prefer-const": "warn",
      
      // Tornar regras de hooks menos rigorosas
      "react-hooks/exhaustive-deps": "warn",
      
      // Permitir namespaces em TypeScript
      "@typescript-eslint/no-namespace": "warn",
      
      // Permitir expressões não utilizadas (útil para debug)
      "@typescript-eslint/no-unused-expressions": "warn"
    }
  }
];

export default eslintConfig;
