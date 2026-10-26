#!/usr/bin/env bash
# Mise en ligne de NOCTIS : construit sur cette machine, envoie par SSH, migre la base.
# Prérequis : alias SSH « noctis » (~/.ssh/config), serveur préparé (voir deploy/README.md).
# Usage : bash deploy/deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${NOCTIS_HOST:-noctis}"
REMOTE=/var/www/noctis
# Pas « COMPOSER » : Composer lit cette variable comme le nom de son composer.json.
COMPOSER_BIN="${COMPOSER_BIN:-composer}"
BUILD="$(mktemp -d)"
trap 'rm -rf "$BUILD"' EXIT

echo "→ Front : build Vite"
(cd "$ROOT/front" && npm run build --silent)

echo "→ Back : copie du code commité + dépendances de production"
git -C "$ROOT" archive HEAD back | tar -x -C "$BUILD"
(cd "$BUILD/back" && $COMPOSER_BIN install --no-dev --optimize-autoloader --classmap-authoritative --no-scripts --no-interaction --quiet)

echo "→ Envoi"
tar -C "$ROOT/front/dist" -czf "$BUILD/front.tgz" .
tar -C "$BUILD/back" --exclude=./var --exclude=./tests --exclude='./.env.local' -czf "$BUILD/back.tgz" .
scp -q "$BUILD/front.tgz" "$BUILD/back.tgz" "$HOST:/tmp/"

echo "→ Installation sur le serveur"
ssh "$HOST" bash -s <<EOF
set -euo pipefail
cd $REMOTE
# Le back est remplacé en gardant .env.local (secrets) et var/ (cache, journaux).
sudo rm -rf back.new && mkdir back.new && tar -xzf /tmp/back.tgz -C back.new
cp back/.env.local back.new/.env.local
mkdir -p back.new/var && sudo rm -rf back.old && { [ -d back ] && mv back back.old || true; } && mv back.new back
rm -rf front.new && mkdir front.new && tar -xzf /tmp/front.tgz -C front.new
sudo rm -rf front.old && { [ -d front ] && mv front front.old || true; } && mv front.new front
rm -f /tmp/front.tgz /tmp/back.tgz
cd back
php8.4 bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration
sudo chgrp www-data .env.local && chmod 640 .env.local
php8.4 bin/console cache:clear --no-warmup && php8.4 bin/console cache:warmup
sudo chgrp -R www-data var && sudo chmod -R g+w var
sudo systemctl reload php8.4-fpm
# Le cache de l'ancienne version appartient à www-data (PHP-FPM) : suppression en sudo.
sudo rm -rf ../back.old ../front.old
EOF
echo "✓ En ligne : https://noctis.mmi24e13.mmi-troyes.fr"
