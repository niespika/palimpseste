# Les deux outils de recette de C4-L8

Ils appellent **le même code que les écrans** — le parseur de fiche et l'écrivain
d'import — avec le client admin, pour prouver en base ce que l'écran fait à la
main. Ils ne remplacent pas la recette à l'écran : ils la doublent par requête.

    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
         --import ./scripts/register-ts-resolver.mjs \
         scripts/recette/deposer-fiches.mjs

    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
         --import ./scripts/register-ts-resolver.mjs \
         scripts/recette/deposer-import.mjs <chemin-du-fichier.json>

`deposer-fiches.mjs` lit les sept fiches de `competences/` dans l'autre dépôt et
les dépose ; `deposer-import.mjs` dépose un fichier d'import et imprime le
verdict — refus, blocages, signalements, comptes entrés / refusés / bloqués /
ignorés.
