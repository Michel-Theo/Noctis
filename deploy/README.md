# Déploiement NOCTIS

En ligne : **https://noctis.mmi24e13.mmi-troyes.fr** (VPS PulseHeberg, Debian 12, Apache, PHP 8.4 FPM, MariaDB 10.11).

## Mettre à jour le site

Depuis Git Bash, à la racine du dépôt, après avoir commité le back :

```sh
export PATH="$PATH:$(cygpath "$LOCALAPPDATA")/Microsoft/WinGet/Packages/PHP.PHP.NTS.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe"
COMPOSER_BIN=/c/Users/theom/tools/composer/composer bash deploy/deploy.sh
```

Le script :
1. construit le front (Vite) ;
2. installe les dépendances de production du back, à partir du code commité ;
3. envoie le tout par SSH (alias `noctis` dans `~/.ssh/config`, clé `~/.ssh/noctis_vps`) ;
4. remplace les dossiers sur le serveur en gardant `.env.local` ;
5. lance les migrations et vide le cache.

## Sur le serveur

| Élément | Emplacement |
|---|---|
| Front (build) | `/var/www/noctis/front` |
| Symfony | `/var/www/noctis/back` |
| Secrets (APP_SECRET, base) | `/var/www/noctis/back/.env.local` (groupe www-data, jamais commité) |
| Site Apache | `/etc/apache2/sites-available/noctis.conf` (copie de `deploy/apache-noctis.conf`) + `noctis-le-ssl.conf` (certbot) |
| Journaux | `/var/log/apache2/noctis-error.log` |
| Base | `noctis`, utilisateur `noctis@localhost` |

Le certificat Let's Encrypt se renouvelle tout seul (timer certbot déjà actif sur le VPS).

Les autres projets du VPS tournent sur PHP 8.3 FPM, NOCTIS sur PHP 8.4 FPM : les deux cohabitent.
