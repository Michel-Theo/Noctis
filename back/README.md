# NOCTIS — API

API JSON de la boutique (Symfony 8.1, Doctrine, SQLite). Elle recalcule chaque panier côté serveur, crée les commandes et simule le paiement.

## Installation

Prérequis : PHP 8.4 avec les extensions intl, mbstring, openssl, curl, zip, fileinfo, sodium, pdo_sqlite et sqlite3, plus Composer.

```sh
composer install
php bin/console doctrine:migrations:migrate -n   # crée var/data.db
php bin/console doctrine:fixtures:load -n        # catalogue (5 pièces, seule Couronne I en vente)
php -S 127.0.0.1:8000 -t public                  # ou : symfony serve
```

En développement, le front (Vite) relaie `/api` vers `127.0.0.1:8000`.

## Tests

```sh
php bin/phpunit
```

Les tests fonctionnels (`tests/Api`) recréent une base SQLite de test (`var/test.db`) à chaque test.

## Contrat

Tous les montants sont en centimes, TVA incluse. Les erreurs sont toujours en JSON :

- cas général : `{ "error": "…" }` ;
- validation : `{ "error": "Validation", "violations": { "champ": "message" } }`, en 422.

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/products` | Catalogue : `slug, name, collection, price, available, editionTotal, finishes, sizes` |
| POST | `/api/quote` | `{items:[{slug, finish, size, quantity}], shipping?, code?}`. Renvoie les lignes et les totaux (`subtotal, shipping, discount, tax, total`) |
| POST | `/api/orders` | Client + adresse + `shipping` + `items` + `code?`. Renvoie en 201 `{reference, token, total, status}` |
| POST | `/api/orders/{ref}/pay?token=…` | `{method: card\|applepay\|paypal, cardNumber?, expiry? (MM/AA), cvc?}`. Renvoie la commande payée |
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
  - la quantité n'est pas comprise entre 1 et 5.

### Commandes et paiement

- Une commande n'est lisible et payable qu'avec son `token` ; sans le bon jeton, l'API répond 404.
- Une commande déjà réglée répond 409.
- Paiement **simulé**, calqué sur les cartes de test Stripe :

  | Carte | Résultat |
  |---|---|
  | `4242 4242 4242 4242` | Accepté |
  | `4000 0000 0000 0002` | Refusé (402) |
  | Numéro hors Luhn, date passée ou CVC invalide | Erreur de validation (422) |

  Apple Pay et PayPal sont acceptés directement.
- Le paiement passe par l'interface `App\Payment\PaymentGateway`. Brancher Stripe revient à écrire une autre implémentation.
