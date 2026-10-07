# FilmBox — front du fil rouge

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

Pour la démo, utiliser `npm run demo` plutôt que `npm run dev` : en développement, React exécute les effets deux fois et le compteur de vues augmente de 2 par visite.

`./init-db.sh` remet la base à zéro à tout moment.

## Tests

```bash
./init-db.sh             # les tests supposent une base fraîchement recréée
cd web && npm test       # 52 tests : requêtes, RLS, procédure noter, triggers
```

## Parcours de démo

1. **Catalogue** : rechercher « dark », filtrer un genre, ouvrir « Voir le SQL » (`rechercher_films`, M16.3).
2. **Fiche Inception** : durée « 2 h 28 » (M10.1), note pondérée (M10.2), compteur de vues qui augmente à chaque visite (M15.2).
3. **Choisir lea.reel** en haut à droite, puis noter 6 : refus de la procédure (M13.2). Noter 4 : la moyenne change, mise à jour par le trigger (M14.1).
4. **Audit** (M14.2), dans un terminal :
   `docker compose exec postgres psql -U postgres -d filmbox -c "SELECT * FROM audit_notes"`
5. **Profil de lea.reel** : en tant que lea.reel, les entrées 🔒 privées sont visibles ; en tant que nolanfan, elles disparaissent (RLS, M16.2) et la compatibilité s'affiche (M10.3).
6. **Classements** (M5.1, M5.2, M3.3, M10.2) et **Kevin Bacon** (Omar Sy : degré 2, M4.4).

## Organisation

- `sql/front.sql` : droits de `filmbox_app` pour le front, `SECURITY DEFINER` sur les fonctions de trigger, mot de passe du rôle.
- `web/src/lib/db.ts` : connexion avec `filmbox_app` ; chaque requête passe par une transaction qui fixe `app.membre_id` pour la RLS.
- `web/src/lib/requetes/` : une fonction par requête, avec son SQL et sa mission.
- `web/src/app/` : les pages (catalogue, fiche film, classements, membres, Kevin Bacon) et les actions serveur (changer de membre, noter, compter une vue).
