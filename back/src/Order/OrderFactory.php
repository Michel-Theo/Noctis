<?php

namespace App\Order;

use App\Dto\CartItemInput;
use App\Dto\OrderInput;
use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\User;
use App\Pricing\PriceCalculator;
use App\Pricing\Quote;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

/** Crée une commande en attente de paiement, au prix du catalogue. */
final class OrderFactory
{
    public function __construct(
        private readonly PriceCalculator $calculator,
        private readonly EntityManagerInterface $em,
        private readonly Security $security,
    ) {
    }

    public function create(OrderInput $input): Order
    {
        $quote = $this->calculator->quote($input->items, $input->shipping, $input->code);

        $order = new Order();
        // Client connecté : la commande rejoint son compte. Les commandes invité restent anonymes.
        $user = $this->security->getUser();
        $order->setUser($user instanceof User ? $user : null);
        $order->setCustomer(trim($input->email), trim($input->firstName), trim($input->lastName));
        $order->setShippingAddress(trim($input->address), trim($input->postalCode), trim($input->city), trim($input->country));
        $order->setAmounts($quote->shippingMethod, $quote->shipping, $quote->subtotal, $quote->discount, $quote->validCode(), $quote->total);
        foreach ($quote->lines as $l) {
            $order->addItem(new OrderItem($order, $l['product'], $l['product']->getName(), $l['finish'], $l['size'], $l['quantity'], $l['unitPrice']));
        }

        // Le numéro vient de l'identifiant attribué par la base : deux commandes simultanées
        // ne peuvent pas recevoir le même (une référence provisoire unique tient la place).
        $this->em->wrapInTransaction(function () use ($order): void {
            $order->setReference('TMP-'.bin2hex(random_bytes(6)));
            $this->em->persist($order);
            $this->em->flush();
            $order->setReference(\sprintf('NX-%s-%04d', $order->getCreatedAt()->format('Y'), $order->getId()));
            $this->em->flush();
        });

        return $order;
    }

    /** Applique (ou retire) un code sur une commande en attente : tout est recalculé au prix du catalogue. */
    public function applyCode(Order $order, ?string $code): Quote
    {
        $items = array_map(
            static fn (OrderItem $i) => new CartItemInput($i->getProduct()->getSlug(), $i->getFinish(), $i->getSize(), $i->getQuantity()),
            $order->getItems()->toArray(),
        );
        $quote = $this->calculator->quote(array_values($items), $order->getShippingMethod(), $code);
        $order->setAmounts($quote->shippingMethod, $quote->shipping, $quote->subtotal, $quote->discount, $quote->validCode(), $quote->total);
        $this->em->flush();

        return $quote;
    }
}
