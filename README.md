# FilmBox

Front Next.js branché sur les scripts SQL du fil rouge (`sql/filmbox.sql`, `sql/filmbox-s2.sql`, `sql/filmbox-s4.sql`, `sql/filmbox-s5.sql`).
Chaque bloc de l'interface a un panneau « Voir le SQL » qui montre la requête exécutée et sa mission.

## Lancer la démo

Prérequis : Docker et Node.js 24.

```bash
cp .env.example .env     # puis choisir les mots de passe (lettres et chiffres uniquement)
./init-db.sh             # recrée la base : filmbox.sql → s2 → s4 → s5 → front.sql (7 erreurs volontaires des exercices s'affichent)
cd web
npm install
npm run demo             # compile puis lance http://localhost:3000
```

`./init-db.sh` remet la base à zéro à tout moment.

## Tests

```bash
./init-db.sh             # les tests supposent une base fraîchement recréée
cd web && npm test       # 52 tests : requêtes, RLS, procédure noter, triggers
```

## Organisation

- `sql/front.sql` : droits de `filmbox_app` pour le front, `SECURITY DEFINER` sur les fonctions de trigger, mot de passe du rôle.
- `web/src/lib/db.ts` : connexion avec `filmbox_app` ; chaque requête passe par une transaction qui fixe `app.membre_id` pour la RLS.
- `web/src/lib/requetes/` : une fonction par requête, avec son SQL et sa mission.
- `web/src/app/` : les pages (catalogue, fiche film, classements, membres, Kevin Bacon) et les actions serveur (changer de membre, noter, compter une vue).
