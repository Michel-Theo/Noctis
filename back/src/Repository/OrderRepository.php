<?php

namespace App\Repository;

use App\Entity\Order;
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

    /** Prochaine référence de l'année : NX-2026-0001, NX-2026-0002… */
    public function nextReference(\DateTimeImmutable $now): string
    {
        $prefix = 'NX-'.$now->format('Y').'-';
        $last = $this->createQueryBuilder('o')
            ->select('o.reference')
            ->where('o.reference LIKE :p')
            ->setParameter('p', $prefix.'%')
            ->orderBy('o.reference', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
        $n = $last ? (int) substr($last['reference'], -4) + 1 : 1;

        return $prefix.str_pad((string) $n, 4, '0', STR_PAD_LEFT);
    }
}
