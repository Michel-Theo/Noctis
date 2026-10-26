<?php

namespace App\Payment;

use App\Dto\PaymentInput;
use App\Entity\Order;

/**
 * Encaisse une commande. Implémentation actuelle : SimulatedGateway (portfolio, aucun argent réel).
 * Une StripeGateway pourra la remplacer sans toucher aux contrôleurs.
 */
interface PaymentGateway
{
    /**
     * @throws InvalidPaymentException  données de paiement invalides (422)
     * @throws PaymentDeclinedException paiement refusé (402)
     */
    public function charge(Order $order, PaymentInput $payment): void;
}
