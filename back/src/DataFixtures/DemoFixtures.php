<?php

namespace App\DataFixtures;

use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\Product;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Compte de démonstration : theo@exemple.fr / veilleur-2026.
 * Deux commandes livrées et une en cours de fabrication, toutes de Couronne I.
 */
final class DemoFixtures extends Fixture implements DependentFixtureInterface
{
    public function __construct(private readonly UserPasswordHasherInterface $hasher)
    {
    }

    public function getDependencies(): array
    {
        return [AppFixtures::class];
    }

    public function load(ObjectManager $manager): void
    {
        $user = new User('theo@exemple.fr', 'Théo', 'Michel', new \DateTimeImmutable('2026-08-12 21:40'));
        $user->setPassword($this->hasher->hashPassword($user, 'veilleur-2026'));
        $manager->persist($user);

        $ring = $manager->getRepository(Product::class)->findOneBy(['slug' => 'couronne-i']);
        // Date de paiement, finition, taille, étapes franchies après le paiement (4 = livrée).
        $history = [
            ['2026-08-14 22:10', 'Argent rhodié', 57, 4],
            ['2026-09-02 23:05', 'Argent oxydé', 60, 4],
            ['2026-10-22 21:30', 'Argent rhodié', 57, 1],
        ];

        $orders = [];
        foreach ($history as [$date, $finish, $size, $steps]) {
            $at = new \DateTimeImmutable($date);
            $order = new Order();
            $order->placedAt($at);
            $order->setReference('TMP-'.bin2hex(random_bytes(6)));
            $order->setUser($user);
            $order->setCustomer($user->getEmail(), $user->getFirstName(), $user->getLastName());
            $order->setShippingAddress('12 rue des Veilleurs', '10000', 'Troyes', 'France');
            $order->setAmounts('colissimo', 690, 14000, 0, null, 14690);
            $item = new OrderItem($order, $ring, $ring->getName(), $finish, $size, 1, 14000);
            $item->setSerials($ring->takeSerials(1));
            $order->addItem($item);
            $order->markPaid('card', $at);
            for ($i = 0; $i < $steps; ++$i) {
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
}
