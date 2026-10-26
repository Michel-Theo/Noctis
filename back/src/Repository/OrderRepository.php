<?php

namespace App\Repository;

use App\Entity\Order;
use App\Entity\OrderStatus;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
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

    /** Statuts des commandes réglées, regroupés comme les onglets du back-office. */
    public const ADMIN_FILTERS = [
        'paid' => [OrderStatus::Paid],
        'production' => [OrderStatus::Cast, OrderStatus::Polished],
        'shipped' => [OrderStatus::Shipped],
        'delivered' => [OrderStatus::Delivered],
    ];

    /**
     * Commandes réglées pour le back-office, de la plus récente à la plus ancienne.
     *
     * @param list<OrderStatus>|null $statuses null = tous les statuts réglés
     *
     * @return list<Order>
     */
    public function findPaidForAdmin(?array $statuses = null, ?string $query = null, int $limit = 200): array
    {
        // 1. Les identifiants, limités (la limite porte sur les commandes, pas sur les lignes jointes).
        $ids = $this->paidQuery($query)->select('o.id')->orderBy('o.paidAt', 'DESC')->addOrderBy('o.id', 'DESC')->setMaxResults($limit);
        if (null !== $statuses) {
            $ids->andWhere('o.status IN (:statuses)')->setParameter('statuses', array_map(static fn (OrderStatus $s) => $s->value, $statuses));
        }
        $ids = array_column($ids->getQuery()->getScalarResult(), 'id');
        if (!$ids) {
            return [];
        }

        // 2. Les commandes avec leurs lignes et produits, en une requête.
        return $this->createQueryBuilder('o')
            ->addSelect('i', 'p')
            ->leftJoin('o.items', 'i')
            ->leftJoin('i.product', 'p')
            ->where('o.id IN (:ids)')
            ->setParameter('ids', $ids)
            ->orderBy('o.paidAt', 'DESC')
            ->addOrderBy('o.id', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /** @return array<string, int> nombre de commandes réglées par statut */
    public function countPaidByStatus(?string $query = null): array
    {
        $rows = $this->paidQuery($query)->select('o.status AS status, COUNT(o.id) AS n')->groupBy('o.status')->getQuery()->getScalarResult();
        $out = [];
        foreach ($rows as $row) {
            $status = $row['status'] instanceof OrderStatus ? $row['status']->value : (string) $row['status'];
            $out[$status] = (int) $row['n'];
        }

        return $out;
    }

    /**
     * Commandes réglées entre deux dates de paiement [from, to[.
     *
     * @return list<Order>
     */
    public function findPaidBetween(\DateTimeImmutable $from, \DateTimeImmutable $to): array
    {
        return $this->paidQuery()
            ->andWhere('o.paidAt >= :from AND o.paidAt < :to')
            ->setParameter('from', $from)
            ->setParameter('to', $to)
            ->getQuery()
            ->getResult();
    }

    private function paidQuery(?string $query = null): QueryBuilder
    {
        $qb = $this->createQueryBuilder('o')
            ->where('o.status NOT IN (:unpaid)')
            ->setParameter('unpaid', [OrderStatus::Pending->value, OrderStatus::Processing->value]);
        $query = trim((string) $query);
        if ('' !== $query) {
            $qb->andWhere('o.reference LIKE :q OR o.firstName LIKE :q OR o.lastName LIKE :q OR o.email LIKE :q')
                ->setParameter('q', '%'.addcslashes($query, '%_').'%');
        }

        return $qb;
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
