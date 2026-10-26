<?php

namespace App\Order;

use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\OrderStatus;

/** Commandes vues depuis l'espace compte : frise de fabrication en 5 étapes et pièces numérotées. */
final class AccountOrderPresenter
{
    /** Clé, libellé, délai en jours après le paiement, statut atteint une fois l'étape franchie. */
    private const STEPS = [
        ['ordered', 'Commandée', 0, OrderStatus::Paid],
        ['cast', 'Coulée', 4, OrderStatus::Cast],
        ['polished', 'Polie & rhodiée', 8, OrderStatus::Polished],
        ['shipped', 'Expédiée', 10, OrderStatus::Shipped],
        ['delivered', 'Livrée', 12, OrderStatus::Delivered],
    ];

    private const LABELS = [
        'paid' => 'En cours de fonte',
        'cast' => 'Au polissage',
        'polished' => 'Prête à partir',
        'shipped' => 'En route',
        'delivered' => 'Livrée',
    ];

    /** Délai estimé entre le paiement et la coulée. */
    private const CAST_AFTER_DAYS = 4;

    /**
     * @param list<Order> $orders commandes payées, de la plus récente à la plus ancienne
     *
     * @return array{current: array<string, mixed>|null, history: list<array<string, mixed>>, pieces: list<array<string, mixed>>}
     */
    public function present(array $orders): array
    {
        $current = null;
        $history = [];
        foreach ($orders as $order) {
            if (null === $current && OrderStatus::Delivered !== $order->getStatus()) {
                $current = $this->order($order);
            } else {
                $history[] = $this->order($order);
            }
        }

        return ['current' => $current, 'history' => $history, 'pieces' => $this->pieces($orders)];
    }

    /** @return array<string, mixed> */
    private function order(Order $order): array
    {
        $start = $order->getPaidAt() ?? $order->getCreatedAt();
        $reached = array_search($order->getStatus(), array_column(self::STEPS, 3), true);
        $reached = false === $reached ? -1 : $reached;

        return [
            'reference' => $order->getReference(),
            'token' => $order->getToken(),
            'createdAt' => $order->getCreatedAt()->format(\DATE_ATOM),
            'paidAt' => $order->getPaidAt()?->format(\DATE_ATOM),
            'status' => $order->getStatus()->value,
            'statusLabel' => self::LABELS[$order->getStatus()->value] ?? '',
            'total' => $order->getTotal(),
            'lines' => array_map(static fn (OrderItem $i) => [
                'slug' => $i->getProduct()->getSlug(),
                'name' => $i->getName(),
                'finish' => $i->getFinish(),
                'size' => $i->getSize(),
                'quantity' => $i->getQuantity(),
                'serials' => $i->getSerials(),
            ], $order->getItems()->toArray()),
            'timeline' => array_map(static fn (array $s, int $k) => [
                'key' => $s[0],
                'label' => $s[1],
                'date' => $start->modify(\sprintf('+%d days', $s[2]))->format(\DATE_ATOM),
                'done' => $k <= $reached,
                // Prochaine étape à franchir.
                'current' => $k === $reached + 1,
            ], self::STEPS, array_keys(self::STEPS)),
        ];
    }

    /**
     * Une entrée par pièce numérotée.
     *
     * @param list<Order> $orders
     *
     * @return list<array<string, mixed>>
     */
    private function pieces(array $orders): array
    {
        $pieces = [];
        foreach ($orders as $order) {
            $castAt = ($order->getPaidAt() ?? $order->getCreatedAt())->modify(\sprintf('+%d days', self::CAST_AFTER_DAYS));
            foreach ($order->getItems() as $item) {
                foreach ($item->getSerials() as $serial) {
                    $pieces[] = [
                        'slug' => $item->getProduct()->getSlug(),
                        'name' => $item->getName(),
                        'finish' => $item->getFinish(),
                        'size' => $item->getSize(),
                        'serial' => $serial,
                        'editionTotal' => $item->getProduct()->getEditionTotal(),
                        'orderReference' => $order->getReference(),
                        'castAt' => $castAt->format(\DATE_ATOM),
                    ];
                }
            }
        }

        return $pieces;
    }
}
