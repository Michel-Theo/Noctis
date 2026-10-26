<?php

namespace App\Order;

use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\OrderStatus;

/** Représentation JSON d'une commande pour le back-office (statuts vus de l'atelier). */
final class AdminOrderPresenter
{
    public static function label(OrderStatus $status): string
    {
        return match ($status) {
            OrderStatus::Paid => 'À couler',
            OrderStatus::Cast => 'Coulée',
            OrderStatus::Polished => 'Polissage',
            OrderStatus::Shipped => 'Expédiée',
            OrderStatus::Delivered => 'Livrée',
            OrderStatus::Pending, OrderStatus::Processing => 'Non réglée',
        };
    }

    /** « Théo M. » */
    public static function customer(Order $order): string
    {
        $initial = mb_substr(trim($order->getLastName()), 0, 1);

        return trim($order->getFirstName().('' !== $initial ? ' '.mb_strtoupper($initial).'.' : ''));
    }

    /** @return array<string, mixed> */
    public function present(Order $order): array
    {
        return [
            'reference' => $order->getReference(),
            'token' => $order->getToken(),
            'paidAt' => $order->getPaidAt()?->format(\DATE_ATOM),
            'customer' => self::customer($order),
            'email' => $order->getEmail(),
            'items' => array_map(static fn (OrderItem $i) => [
                'slug' => $i->getProduct()->getSlug(),
                'name' => $i->getName(),
                'quantity' => $i->getQuantity(),
                'size' => $i->getSize(),
                'finish' => $i->getFinish(),
                'serials' => $i->getSerials(),
            ], $order->getItems()->toArray()),
            'status' => $order->getStatus()->value,
            'statusLabel' => self::label($order->getStatus()),
            'total' => $order->getTotal(),
        ];
    }

    /**
     * @param iterable<Order> $orders
     *
     * @return list<array<string, mixed>>
     */
    public function presentAll(iterable $orders): array
    {
        $out = [];
        foreach ($orders as $order) {
            $out[] = $this->present($order);
        }

        return $out;
    }
}
