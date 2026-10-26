<?php

namespace App\DataFixtures;

use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\Product;
use App\Entity\User;
use App\Pricing\Shipping;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Données de démonstration, identiques à chaque chargement (graine fixe) :
 * - theo@exemple.fr / veilleur-2026 : compte client ET administrateur de l'atelier,
 *   avec deux commandes livrées et une en cours de fabrication ;
 * - une trentaine de clients invités et ~40 commandes de Couronne I, de mai à octobre 2026
 *   (lancement le 12 septembre), numérotées dans l'ordre des paiements.
 */
final class DemoFixtures extends Fixture implements DependentFixtureInterface
{
    /** « Aujourd'hui » de la démo : aucune commande après, statuts calculés depuis cette date. */
    private const TODAY = '2026-10-26 18:00';

    private const CUSTOMERS = [
        ['Inès', 'Roux'], ['Malo', 'Dupré'], ['Sacha', 'Lemoine'], ['Lou', 'Bertin'], ['Nora', 'Kader'],
        ['Yanis', 'Perrot'], ['Eva', 'Garnier'], ['Jade', 'Moreau'], ['Noé', 'Fabre'], ['Lina', 'Chevalier'],
        ['Adam', 'Royer'], ['Mila', 'Lambert'], ['Hugo', 'Mercier'], ['Zoé', 'Blanc'], ['Léon', 'Guérin'],
        ['Rose', 'Faure'], ['Gabin', 'André'], ['Alma', 'Henry'], ['Axel', 'Rivière'], ['Iris', 'Dumas'],
        ['Nils', 'Caron'], ['Romy', 'Picard'], ['Elio', 'Lacroix'], ['Maëlle', 'Vidal'], ['Côme', 'Joly'],
        ['Salomé', 'Brun'], ['Ilyes', 'Renaud'], ['Anouk', 'Arnaud'], ['Tristan', 'Leclerc'], ['Ambre', 'Marchand'],
    ];

    private const CITIES = [
        ['Troyes', '10000'], ['Paris', '75011'], ['Lyon', '69003'], ['Lille', '59000'], ['Reims', '51100'],
        ['Nantes', '44000'], ['Bordeaux', '33000'], ['Strasbourg', '67000'], ['Rennes', '35000'], ['Bruxelles', '1000'],
    ];

    /** Commandes par mois : faible avant le lancement, en hausse ensuite. */
    private const VOLUME = ['2026-05' => 2, '2026-06' => 3, '2026-07' => 3, '2026-08' => 3, '2026-09' => 12, '2026-10' => 15];

    public function __construct(private readonly UserPasswordHasherInterface $hasher)
    {
    }

    public function getDependencies(): array
    {
        return [AppFixtures::class];
    }

    public function load(ObjectManager $manager): void
    {
        mt_srand(2026);
        $today = new \DateTimeImmutable(self::TODAY);
        $ring = $manager->getRepository(Product::class)->findOneBy(['slug' => 'couronne-i']);

        $theo = new User('theo@exemple.fr', 'Théo', 'Michel', new \DateTimeImmutable('2026-08-12 21:40'));
        $theo->setPassword($this->hasher->hashPassword($theo, 'veilleur-2026'));
        $theo->setRoles(['ROLE_ADMIN']);
        $manager->persist($theo);

        // [paiement, client, ville, finition, taille, quantité, code, livraison, étapes imposées (null = selon l'âge)]
        $plan = [
            ['2026-08-14 22:10', $theo, ['Troyes', '10000'], 'Argent rhodié', 57, 1, null, Shipping::COLISSIMO, 4],
            ['2026-09-02 23:05', $theo, ['Troyes', '10000'], 'Argent oxydé', 60, 1, null, Shipping::COLISSIMO, 4],
            ['2026-10-22 21:30', $theo, ['Troyes', '10000'], 'Argent rhodié', 57, 1, null, Shipping::COLISSIMO, 1],
        ];
        foreach (self::VOLUME as $month => $count) {
            for ($i = 0; $i < $count; ++$i) {
                // Septembre : une commande avant le lancement, les autres après le 12.
                // Octobre : surtout la seconde quinzaine, encore en fabrication aujourd'hui.
                $minDay = match (true) {
                    '2026-09' === $month && $i > 0 => 12,
                    '2026-10' === $month && $i > 2 => 14,
                    default => 1,
                };
                $maxDay = '2026-10' === $month ? 25 : (int) (new \DateTimeImmutable($month.'-01'))->format('t');
                $at = \sprintf('%s-%02d %02d:%02d', $month, mt_rand($minDay, $maxDay), mt_rand(18, 23), mt_rand(0, 59));
                $plan[] = [
                    $at,
                    self::CUSTOMERS[mt_rand(0, \count(self::CUSTOMERS) - 1)],
                    self::CITIES[mt_rand(0, \count(self::CITIES) - 1)],
                    mt_rand(1, 3) < 3 ? 'Argent rhodié' : 'Argent oxydé',
                    $ring->getSizes()[mt_rand(0, \count($ring->getSizes()) - 1)],
                    1 === mt_rand(1, 9) ? 2 : 1,
                    1 === mt_rand(1, 6) ? 'NUIT10' : null,
                    match (mt_rand(1, 10)) { 1, 2 => Shipping::CHRONOPOST, 3 => Shipping::ATELIER, default => Shipping::COLISSIMO },
                    null,
                ];
            }
        }
        // Numéros de série dans l'ordre des paiements.
        usort($plan, static fn (array $a, array $b) => strcmp($a[0], $b[0]));

        $orders = [];
        foreach ($plan as [$date, $customer, [$city, $postalCode], $finish, $size, $quantity, $code, $shipping, $steps]) {
            $at = new \DateTimeImmutable($date);
            $order = new Order();
            $order->placedAt($at->modify('-3 minutes'));
            $order->setReference('TMP-'.bin2hex(random_bytes(6)));
            if ($customer instanceof User) {
                $order->setUser($customer);
                $order->setCustomer($customer->getEmail(), $customer->getFirstName(), $customer->getLastName());
                $order->setShippingAddress('12 rue des Veilleurs', $postalCode, $city, 'France');
            } else {
                [$first, $last] = $customer;
                $order->setCustomer(self::email($first, $last), $first, $last);
                $order->setShippingAddress(mt_rand(1, 80).' rue de la Nuit', $postalCode, $city, 'Bruxelles' === $city ? 'Belgique' : 'France');
            }

            $subtotal = $ring->getPrice() * $quantity;
            $discount = $code ? (int) round($subtotal / 10) : 0;
            $cost = Shipping::cost($shipping, $subtotal);
            $order->setAmounts($shipping, $cost, $subtotal, $discount, $code, $subtotal - $discount + $cost);

            $item = new OrderItem($order, $ring, $ring->getName(), $finish, $size, $quantity, $ring->getPrice());
            $item->setSerials($ring->takeSerials($quantity));
            $order->addItem($item);
            $order->markPaid(1 === mt_rand(1, 4) ? 'paypal' : 'card', $at);
            for ($i = 0, $n = $steps ?? self::stepsFor($at, $today); $i < $n; ++$i) {
                $order->advance();
            }
            $manager->persist($order);
            $orders[] = $order;
        }
        $manager->flush();

        // Même règle de numérotation que les commandes passées sur le site.
        foreach ($orders as $order) {
            $order->setReference(\sprintf('NX-%s-%04d', $order->getCreatedAt()->format('Y'), $order->getId()));
        }
        $manager->flush();
    }

    /** Étapes franchies selon l'ancienneté : coulée à 3 jours, polie à 6, expédiée à 8, livrée à 12. */
    private static function stepsFor(\DateTimeImmutable $paidAt, \DateTimeImmutable $today): int
    {
        $days = (int) $paidAt->diff($today)->days;

        return match (true) {
            $days < 3 => 0,
            $days < 6 => 1,
            $days < 8 => 2,
            $days < 12 => 3,
            default => 4,
        };
    }

    private static function email(string $first, string $last): string
    {
        $ascii = static fn (string $s) => strtolower(strtr($s, ['é' => 'e', 'è' => 'e', 'ë' => 'e', 'ô' => 'o', 'É' => 'e', 'ï' => 'i']));

        return $ascii($first).'.'.$ascii($last).'@exemple.fr';
    }
}
