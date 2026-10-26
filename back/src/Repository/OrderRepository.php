<?php

namespace App\Repository;

use App\Entity\Order;
use App\Entity\OrderStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<Order> */
class OrderRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Order::class);
    }

    /** Commande retrouvée par sa référence ET son jeton (comparaison à temps constant). */
    public function findOneByReferenceAndToken(string $reference, ?string $token): ?Order
    {
        $order = $this->findOneBy(['reference' => $reference]);
        if (null === $order || null === $token || !hash_equals($order->getToken(), $token)) {
            return null;
        }

        return $order;
    }

    /**
     * Réserve la commande pour un paiement : passe de « en attente » à « en cours » en une seule
     * requête conditionnelle. Deux paiements simultanés : un seul obtient true.
     */
    public function claimForPayment(Order $order): bool
    {
        return 1 === $this->switchStatus($order, OrderStatus::Pending, OrderStatus::Processing);
    }

    /** Paiement échoué : la commande redevient payable. */
    public function releasePayment(Order $order): void
    {
        $this->switchStatus($order, OrderStatus::Processing, OrderStatus::Pending);
    }

    private function switchStatus(Order $order, OrderStatus $from, OrderStatus $to): int
    {
        return $this->createQueryBuilder('o')
            ->update()
            ->set('o.status', ':to')
            ->where('o.id = :id AND o.status = :from')
            ->setParameter('to', $to)
            ->setParameter('from', $from)
            ->setParameter('id', $order->getId())
            ->getQuery()
            ->execute();
    }
}
