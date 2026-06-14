import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Contenu rédigé en français : l'apostrophe est omniprésente dans le JSX.
      // L'échappement (&apos;) nuit à la lisibilité sans bénéfice réel ici.
      "react/no-unescaped-entities": "off",
      // Les images affichées sont des aperçus dynamiques (object-URL / blob côté
      // client, URLs signées Supabase) pour lesquels next/image est inadapté.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
