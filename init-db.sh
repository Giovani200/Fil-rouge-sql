#!/usr/bin/env bash
# Recrée la base filmbox de la démo : scripts du fil rouge (sans le volume de s3), puis front.sql.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
    echo "Fichier .env manquant : copier .env.example en .env et choisir les mots de passe." >&2
    exit 1
fi
set -a
source .env
set +a

psql_postgres() {
    docker compose exec -T postgres psql -U postgres "$@"
}

docker compose up -d --wait
psql_postgres -d postgres -q -c "DROP DATABASE IF EXISTS filmbox WITH (FORCE)" -c "CREATE DATABASE filmbox"

for script in filmbox.sql filmbox-s2.sql filmbox-s4.sql filmbox-s5.sql; do
    echo "→ $script"
    psql_postgres -d filmbox -q < "sql/$script" 2>&1 | grep '^ERROR' | sed 's/^/   erreur volontaire des exercices : /' || true
done

echo "→ front.sql"
psql_postgres -d filmbox -q -v ON_ERROR_STOP=1 -v mot_de_passe="$FILMBOX_APP_PASSWORD" < sql/front.sql

printf 'DATABASE_URL=postgres://filmbox_app:%s@localhost:%s/filmbox\n' "$FILMBOX_APP_PASSWORD" "$POSTGRES_PORT" > web/.env.local
echo "Base prête. web/.env.local mis à jour."
