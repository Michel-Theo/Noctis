#!/usr/bin/env bash
# Branche l'envoi d'e-mails de NOCTIS sur une boîte Gmail (mot de passe d'application).
# À lancer sur le serveur : le mot de passe est saisi en masqué et écrit seulement dans .env.local.
# Usage : ssh -t noctis "bash ~/set-mailer.sh"
set -euo pipefail
ENV=/var/www/noctis/back/.env.local

read -rp "Adresse Gmail d'envoi : " ADDR
read -rsp "Mot de passe d'application (16 lettres, espaces acceptés) : " PASS
echo
PASS=${PASS// /}
if [ ${#PASS} -ne 16 ]; then echo "Il faut les 16 lettres du mot de passe d'application." >&2; exit 1; fi

# L'adresse va dans l'URL de connexion : « @ » s'écrit %40.
USER_ENC=${ADDR//@/%40}
sed -i '/^MAILER_DSN=/d;/^MAILER_FROM=/d;/^CONTACT_TO=/d' "$ENV"
{
  echo "MAILER_DSN=\"gmail+smtp://${USER_ENC}:${PASS}@default\""
  echo "MAILER_FROM=\"NOCTIS <${ADDR}>\""
  echo "CONTACT_TO=${ADDR}"
} >> "$ENV"

cd /var/www/noctis/back
php8.4 bin/console cache:clear --quiet
sudo chgrp -R www-data var && sudo chmod -R g+w var
sudo systemctl reload php8.4-fpm
echo "Envoi d'un e-mail de test à ${ADDR}…"
php8.4 bin/console app:email:test "$ADDR"
