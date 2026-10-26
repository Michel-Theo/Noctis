<?php

namespace App\Order;

use App\Dto\OrderInput;
use App\Entity\Order;
use App\Entity\OrderItem;
use App\Pricing\PriceCalculator;
use App\Repository\OrderRepository;
use Doctrine\ORM\EntityManagerInterface;

/** Crée une commande en attente de paiement, au prix du catalogue. */
final class OrderFactory
{
    public function __construct(
        private readonly PriceCalculator $calculator,
        private readonly OrderRepository $orders,
        private readonly EntityManagerInterface $em,
    ) {
    }

    public function create(OrderInput $input): Order
    {
        $quote = $this->calculator->quote($input->items, $input->shipping, $input->code);

        $order = new Order();
        $order->setReference($this->orders->nextReference($order->getCreatedAt()));
        $order->setCustomer(trim($input->email), trim($input->firstName), trim($input->lastName));
        $order->setShippingAddress(trim($input->address), trim($input->postalCode), trim($input->city), trim($input->country));
        $order->setAmounts($quote->shippingMethod, $quote->shipping, $quote->subtotal, $quote->discount, $quote->validCode(), $quote->total);
        foreach ($quote->lines as $l) {
            $order->addItem(new OrderItem($order, $l['product'], $l['product']->getName(), $l['finish'], $l['size'], $l['quantity'], $l['unitPrice']));
        }

        $this->em->persist($order);
        $this->em->flush();

        return $order;
    }
}
