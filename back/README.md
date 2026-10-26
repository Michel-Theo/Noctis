# NOCTIS — API

API JSON de la boutique (Symfony 8.1, Doctrine, MariaDB). Elle recalcule chaque panier côté serveur, crée les commandes et simule le paiement.

## Installation

Prérequis :
- PHP 8.4 avec les extensions intl, mbstring, openssl, curl, zip, fileinfo, sodium et pdo_mysql ;
- Composer ;
- MariaDB, avec les bases `noctis` et `noctis_test` et un utilisateur `noctis` (mot de passe `noctis` en local).

```sql
CREATE DATABASE noctis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE noctis_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'noctis'@'localhost' IDENTIFIED BY 'noctis';
GRANT ALL PRIVILEGES ON noctis.* TO 'noctis'@'localhost';
GRANT ALL PRIVILEGES ON noctis_test.* TO 'noctis'@'localhost';
```

```sh
composer install
php bin/console doctrine:migrations:migrate -n   # crée les tables
php bin/console doctrine:fixtures:load -n        # catalogue + compte de démo (voir « Comptes »)
php -S 127.0.0.1:8000 -t public                  # ou : symfony serve
```

En développement, le front (Vite) relaie `/api` vers `127.0.0.1:8000`.

## Tests

```sh
php bin/phpunit
```

Les tests fonctionnels (`tests/Api`) recréent le schéma de la base `noctis_test` à chaque test.

## Contrat

Tous les montants sont en centimes, TVA incluse. Les erreurs sont toujours en JSON :

- cas général : `{ "error": "…" }` ;
- validation : `{ "error": "Validation", "violations": { "champ": "message" } }`, en 422.

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/products` | Catalogue : `slug, name, collection, pitch, price, published, available, editionTotal, editionSold, finishes, sizes` (`available` = publiée, avec un prix, pas épuisée) |
| POST | `/api/quote` | `{items:[{slug, finish, size, quantity}], shipping?, code?}`. Renvoie les lignes et les totaux (`subtotal, shipping, discount, tax, total`) |
| POST | `/api/orders` | Client + adresse + `shipping` + `items` + `code?`. Renvoie en 201 `{reference, token, total, status}` |
| POST | `/api/orders/{ref}/pay?token=…` | `{method: card\|applepay\|paypal, cardNumber?, expiry? (MM/AA), cvc?}`. Renvoie la commande payée |
| POST | `/api/orders/{ref}/code?token=…` | `{code}` (vide ou `null` pour retirer). Recalcule une commande en attente ; 409 si elle est réglée |
| GET | `/api/orders/{ref}?token=…` | Commande, avec sa frise de fabrication (`timeline`) |

### Règles du panier

- Livraison :
  - Colissimo : 6,90 €, offerte dès 150 € ;
  - Chronopost : 12 € ;
  - retrait à l'atelier : gratuit.
- Le code `NUIT10` retire 10 % du sous-total. Un code inconnu est renvoyé avec `valid: false`, sans erreur.
- Le panier est refusé en 422 si :
  - une pièce est inconnue ou encore en forge ;
  - la finition ou la taille n'est pas proposée ;
  - la quantité n'est pas comprise entre 1 et 5 ;
  - le panier compte plus de dix lignes ;
  - la série limitée n'a plus assez de pièces (« Couronne I : plus que 2 pièces dans la série. », « … est épuisée. »).

### Commandes et paiement

- Une commande n'est lisible et payable qu'avec son `token` ; sans le bon jeton, l'API répond 404.
- Une commande déjà réglée répond 409. Le paiement réserve d'abord la commande par une mise à jour conditionnelle (`pending` → `processing`) : deux paiements simultanés ne peuvent pas passer tous les deux.
- Paiement **simulé**, calqué sur les cartes de test Stripe :

  | Carte | Résultat |
  |---|---|
  | `4242 4242 4242 4242` | Accepté |
  | `4000 0000 0000 0002` | Refusé (402) |
  | Numéro hors Luhn, date passée ou CVC invalide | Erreur de validation (422) |

  Apple Pay et PayPal sont acceptés directement.
- Le paiement passe par l'interface `App\Payment\PaymentGateway`. Brancher Stripe revient à écrire une autre implémentation.

## Comptes

Session par cookie (pare-feu `main`), sur le même domaine que le front.

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/auth/register` | `{email, password (≥ 8), firstName, lastName}` → 201 + compte, déjà connecté. E-mail pris → 422 |
| POST | `/api/auth/login` | `{email, password, remember?}` → 200 + compte ; 401 si refusé ; 429 après 5 essais par minute |
| POST | `/api/auth/logout` | 204 |
| GET | `/api/me` | Compte connecté `{email, firstName, lastName, createdAt}`, sinon 401 |
| GET | `/api/me/orders` | `{current, history, pieces}` : commande en cours (frise en 5 étapes), historique, pièces numérotées |

- `"remember": true` pose un cookie `REMEMBERME` valable un an.
- Une commande passée connecté rejoint le compte. Une commande invité n'est jamais rattachée par e-mail : sans vérification de l'adresse, ce serait une fuite.
- Série limitée : les numéros (N° 001 / 150…) sont attribués au paiement, sous verrou sur la ligne produit. Si la série s'épuise pendant le paiement, l'API répond 409 et la commande redevient payable.
- CSRF : le cookie de session est `SameSite=Lax` et les routes n'acceptent que du JSON. Un formulaire d'un autre site ne peut donc pas agir au nom du client.

**Compte de démo** (chargé par les fixtures) : `theo@exemple.fr` / `veilleur-2026`. C'est à la fois un client (deux commandes livrées, une en fabrication) et l'administrateur de l'atelier (`ROLE_ADMIN`).

**Faire avancer une commande** en ligne de commande (même règle que le back-office) :

```sh
php bin/console app:order:advance NX-2026-0003   # payée → coulée → polie → expédiée → livrée
```

Les références suivent l'identifiant en base : après un `fixtures:load`, qui purge sans remettre le compteur à zéro, les numéros de démo changent.

## Back-office

Routes `/api/admin/*`, réservées à `ROLE_ADMIN` : 401 sans session, 403 `{error: "Accès réservé à l'atelier."}` pour un client. `GET /api/me` et la connexion renvoient `admin: bool`.

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/admin/dashboard?month=AAAA-MM` | Chiffres du mois (CA, évolution, commandes, panier moyen), séries vendues, ventes sur 6 mois, fabrication en cours, 5 dernières commandes |
| GET | `/api/admin/orders?status=all\|paid\|production\|shipped\|delivered&q=` | `{counts, orders}` : commandes réglées, recherche sur référence, nom, e-mail (200 au plus) |
| POST | `/api/admin/orders/advance` | `{references: [...]}` : fait avancer chaque commande d'une étape. Tout ou rien : une référence inconnue ou livrée → 422, rien n'est modifié |
| GET | `/api/admin/orders.csv?status=&q=` | Export tableur : UTF-8 avec BOM, séparateur `;` (s'ouvre tel quel dans Excel) |
| GET | `/api/admin/products` | Liste : `slug, name, price, published, editionTotal, editionSold` |
| GET / PUT | `/api/admin/products/{slug}` | Fiche : `name, pitch, price, published, editionTotal, sizes, finishes`. Publier sans prix → 422 ; série plus courte que les ventes → 422 |

- Seules les commandes réglées comptent, datées par leur paiement. Statuts vus de l'atelier : À couler, Coulée, Polissage, Expédiée, Livrée.
- Une pièce dépubliée disparaît de la vente : le devis répond « … n'est pas en vente. ».
- Les fixtures sont déterministes (graine fixe) : une trentaine de clients, ~40 commandes de Couronne I de mai à octobre 2026, lancement le 12 septembre, série vendue à 43 / 150.

## Mise en production (VPS)

- Variables dans `.env.local` (jamais commité) : `APP_ENV=prod`, `APP_SECRET`, `DATABASE_URL` vers la base MariaDB du serveur.
- `composer install --no-dev --optimize-autoloader`, puis `php bin/console doctrine:migrations:migrate -n`.
- Nginx sert le front (`front/dist`) et relaie `/api` vers PHP-FPM (`public/index.php`) : même domaine, pas de CORS.

## E-mails

E-mails HTML aux couleurs de la marque (gabarits Twig dans `templates/email/`, CSS inliné, version texte pour chacun) :

| E-mail | Envoyé quand |
|---|---|
| Confirmation de commande | le paiement réussit |
| Suivi de fabrication (coulée, polie, expédiée, livrée) | une commande avance d'une étape (back-office ou `app:order:advance`) |
| Mot de passe oublié | `POST /api/auth/forgot` |
| Contact : message à l'atelier (Répondre → client) + accusé au client | `POST /api/contact` |

Un envoi raté est journalisé et n'interrompt jamais l'action (paiement, avance, message).

### Variables

| Variable | Rôle | Défaut |
|---|---|---|
| `MAILER_DSN` | transport | `null://null` (rien n'est envoyé) |
| `MAILER_FROM` | expéditeur | `NOCTIS <atelier@noctis.example>` |
| `CONTACT_TO` | boîte qui reçoit le formulaire Contact | `atelier@noctis.example` |
| `DEFAULT_URI` | adresse du site (liens et images des e-mails) | `http://localhost` ; `http://localhost:5173` en dev |

Envoi réel avec Gmail : `composer require symfony/google-mailer`, créer un « mot de passe d'application » sur le compte Google, puis dans `.env.local` :

```sh
MAILER_DSN=gmail+smtp://ADRESSE%40gmail.com:MOT_DE_PASSE_APPLICATION@default
MAILER_FROM="NOCTIS <ADRESSE@gmail.com>"
```

Avec un autre fournisseur : `MAILER_DSN=smtp://UTILISATEUR:MOT_DE_PASSE@smtp.exemple.fr:587`.

### Mot de passe oublié

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/auth/forgot` | `{email}` → 204 toujours (ne révèle pas si le compte existe). 3 demandes / 15 min par IP, sinon 429 |
| POST | `/api/auth/reset` | `{token, password}` → 204. Lien invalide, expiré (1 h) ou déjà utilisé → 422 `violations.token` |

Le lien contient un sélecteur et un vérificateur ; seul le hachage SHA-256 du vérificateur est stocké (`reset_password_request`).

### Aperçus (back-office)

`GET /api/admin/emails` liste les 8 e-mails ; `GET /api/admin/emails/{clé}` renvoie le HTML rendu avec des données d'exemple (dernière commande réglée, sinon une commande construite en mémoire ; rien n'est écrit en base).
