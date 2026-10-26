<?php

namespace App\Order;

use App\Entity\Order;
use App\Repository\OrderRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/** Avancée de la fabrication (payée → coulée → polie → expédiée → livrée), commande console et back-office. */
final class Fabrication
{
    public function __construct(
        private readonly OrderRepository $orders,
        private readonly EntityManagerInterface $em,
    ) {
    }

    /**
     * Fait avancer chaque commande d'une étape. Tout ou rien : si une seule référence
     * est inconnue ou ne peut pas avancer, aucune commande n'est modifiée.
     *
     * @param list<string> $references
     *
     * @return list<Order>
     *
     * @throws UnprocessableEntityHttpException avec le détail des refus
     */
    public function advance(array $references): array
    {
        $found = [];
        $errors = [];
        foreach (array_values(array_unique($references)) as $reference) {
            $order = $this->orders->findOneBy(['reference' => $reference]);
            if (null === $order) {
                $errors[] = \sprintf('Commande %s introuvable.', $reference);
            } elseif (null === $order->getStatus()->next()) {
                $errors[] = \sprintf('La commande %s ne peut pas avancer (%s).', $reference, AdminOrderPresenter::label($order->getStatus()));
            } else {
                $found[] = $order;
            }
        }
        if ($errors) {
            throw new UnprocessableEntityHttpException(implode(' ', $errors));
        }

        $this->em->wrapInTransaction(static function () use ($found): void {
            foreach ($found as $order) {
                $order->advance();
            }
        });

        return $found;
    }
}
