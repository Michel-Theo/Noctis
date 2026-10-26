<?php

namespace App\Order;

use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\OrderStatus;

/** Représentation JSON d'une commande, avec la frise de fabrication. */
final class OrderPresenter
{
    /** Étapes de fabrication : clé, libellé, délai en jours après la commande, statuts où l'étape est faite. */
    private const TIMELINE = [
        ['ordered', 'Commandée', 0, [OrderStatus::Paid, OrderStatus::Cast, OrderStatus::Polished, OrderStatus::Shipped, OrderStatus::Delivered]],
        ['cast', 'Coulée', 4, [OrderStatus::Cast, OrderStatus::Polished, OrderStatus::Shipped, OrderStatus::Delivered]],
        ['polished', 'Polie & rhodiée', 8, [OrderStatus::Polished, OrderStatus::Shipped, OrderStatus::Delivered]],
        ['shipped', 'Expédiée', 10, [OrderStatus::Shipped, OrderStatus::Delivered]],
    ];

    /**
     * Frise à 4 étapes (dates estimées à partir du paiement), partagée par l'API et les e-mails.
     *
     * @return list<array{key: string, label: string, date: \DateTimeImmutable, done: bool}>
     */
    public static function timeline(Order $order): array
    {
        $start = $order->getPaidAt() ?? $order->getCreatedAt();

        return array_map(static fn (array $s) => [
            'key' => $s[0],
            'label' => $s[1],
            'date' => $start->modify(\sprintf('+%d days', $s[2])),
            'done' => \in_array($order->getStatus(), $s[3], true),
        ], self::TIMELINE);
    }

    /** @return array<string, mixed> */
    public function present(Order $order): array
    {

        return [
            'reference' => $order->getReference(),
            'status' => $order->getStatus()->value,
            'email' => $order->getEmail(),
            'firstName' => $order->getFirstName(),
            'shippingMethod' => $order->getShippingMethod(),
            'createdAt' => $order->getCreatedAt()->format(\DATE_ATOM),
            'paidAt' => $order->getPaidAt()?->format(\DATE_ATOM),
            'lines' => array_map(static fn (OrderItem $i) => [
                'slug' => $i->getProduct()->getSlug(),
                'name' => $i->getName(),
                'finish' => $i->getFinish(),
                'size' => $i->getSize(),
                'quantity' => $i->getQuantity(),
                'unitPrice' => $i->getUnitPrice(),
                'total' => $i->getTotal(),
                'serials' => $i->getSerials(),
            ], $order->getItems()->toArray()),
            'subtotal' => $order->getSubtotal(),
            'shipping' => $order->getShippingCost(),
            'discount' => $order->getDiscount(),
            'tax' => (int) round($order->getTotal() / 6),
            'total' => $order->getTotal(),
            'timeline' => array_map(static fn (array $s) => array_replace($s, ['date' => $s['date']->format(\DATE_ATOM)]), self::timeline($order)),
        ];
    }
}
