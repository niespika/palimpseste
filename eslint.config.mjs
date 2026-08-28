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
    // Artefacts de design (handoffs, références, code d'exemple) — PAS du code
    // source : rien de l'application ne les importe, et leur appliquer les règles
    // de l'app revient à linter une maquette livrée.
    //
    // ⚠️ DEUX FORMES, ET C'EST HISTORIQUE. La convention est `design_handoff_*`
    //    (treize dossiers la suivent). `handoff_en_tete/` est ANTÉRIEUR à elle
    //    (07/07/2026) et ne la suit pas — il était donc le SEUL artefact de
    //    design encore linté, et la seule source des deux erreurs permanentes du
    //    dépôt (`ReactDOM.render` déprécié, assignation à `module`) sur les
    //    56 Ko de `support.js` d'une maquette.
    // ⛔ On ne le RENOMME pas : son chemin est cité dans des relevés de séance
    //    déjà clos (`RELEVE_C4_L4`, `SUIVI_tests_manuels.md`) et dans deux autres
    //    handoffs. Réécrire un compte rendu passé pour qu'il colle à un chemin
    //    neuf, c'est falsifier une trace. On élargit l'exclusion, et le
    //    renommage reste une décision à prendre avec ses renvois.
    //    *(Ligne posée à `IDEES_post_rentree.md` — C6-L1, 28/08.)*
    "**/design_handoff_*/**",
    "**/handoff_*/**",
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
