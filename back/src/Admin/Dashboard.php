<?php

namespace App\Admin;

use App\Entity\Order;
use App\Entity\OrderStatus;
use App\Entity\Product;
use App\Order\AdminOrderPresenter;
use App\Repository\OrderRepository;
use App\Repository\ProductRepository;

/** Tableau de bord de l'atelier : chiffres du mois, ventes sur six mois, fabrication en cours. */
final class Dashboard
{
    private const MONTHS = 6;

    public function __construct(
        private readonly OrderRepository $orders,
        private readonly ProductRepository $products,
        private readonly AdminOrderPresenter $presenter,
    ) {
    }

    /** @param \DateTimeImmutable $month premier jour du mois affiché */
    public function build(\DateTimeImmutable $month): array
    {
        $first = $month->modify('first day of this month')->setTime(0, 0);
        $start = $first->modify(\sprintf('-%d months', self::MONTHS - 1));
        $end = $first->modify('+1 month');

        // Toutes les commandes réglées de la fenêtre, regroupées par mois de paiement.
        $byMonth = [];
        foreach ($this->orders->findPaidBetween($start, $end) as $order) {
            $byMonth[$order->getPaidAt()->format('Y-m')][] = $order;
        }
        $monthly = [];
        for ($m = $start; $m < $end; $m = $m->modify('+1 month')) {
            $key = $m->format('Y-m');
            $list = $byMonth[$key] ?? [];
            $monthly[] = ['month' => $key, 'revenue' => self::revenue($list), 'orders' => \count($list)];
        }

        $previous = $monthly[self::MONTHS - 2];
        $current = $byMonth[$first->format('Y-m')] ?? [];
        $revenue = self::revenue($current);
        $basket = $current ? (int) round($revenue / \count($current)) : 0;
        $previousBasket = $previous['orders'] ? (int) round($previous['revenue'] / $previous['orders']) : null;

        $production = ['paid' => 0, 'cast' => 0, 'polished' => 0, 'shipped' => 0];
        foreach ($this->orders->countPaidByStatus() as $status => $n) {
            if (isset($production[$status])) {
                $production[$status] = $n;
            }
        }

        return [
            'month' => $first->format('Y-m'),
            'revenue' => $revenue,
            'revenueDelta' => $previous['revenue'] > 0 ? (int) round(($revenue - $previous['revenue']) / $previous['revenue'] * 100) : null,
            'orders' => \count($current),
            'inProduction' => \count(array_filter($current, static fn (Order $o) => \in_array($o->getStatus(), [OrderStatus::Paid, OrderStatus::Cast, OrderStatus::Polished], true))),
            'averageBasket' => $basket,
            'averageBasketDelta' => null !== $previousBasket && $current ? $basket - $previousBasket : null,
            'series' => array_values(array_map(static fn (Product $p) => [
                'slug' => $p->getSlug(),
                'name' => $p->getName(),
                'sold' => $p->getEditionSold(),
                'total' => $p->getEditionTotal(),
            ], array_filter($this->products->findBy([], ['id' => 'ASC']), static fn (Product $p) => $p->isPublished() && null !== $p->getPrice()))),
            'monthly' => $monthly,
            'production' => $production,
            'latest' => $this->presenter->presentAll($this->orders->findPaidForAdmin(null, null, 5)),
        ];
    }

    /** @param list<Order> $orders */
    private static function revenue(array $orders): int
    {
        return array_sum(array_map(static fn (Order $o) => $o->getTotal(), $orders));
    }
}
