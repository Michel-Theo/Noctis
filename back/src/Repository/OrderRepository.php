<?php

namespace App\Repository;

use App\Entity\Order;
use App\Entity\OrderStatus;
use App\Entity\User;
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
     * Commandes réglées d'un compte, de la plus récente à la plus ancienne.
     *
     * @return list<Order>
     */
    public function findPaidByUser(User $user): array
    {
        return $this->createQueryBuilder('o')
            ->addSelect('i', 'p')
            ->join('o.items', 'i')
            ->join('i.product', 'p')
            ->where('o.user = :user AND o.status NOT IN (:unpaid)')
            ->setParameter('user', $user)
            ->setParameter('unpaid', [OrderStatus::Pending->value, OrderStatus::Processing->value])
            ->orderBy('o.createdAt', 'DESC')
            ->addOrderBy('o.id', 'DESC')
            ->getQuery()
            ->getResult();
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
