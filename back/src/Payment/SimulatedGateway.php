<?php

namespace App\Payment;

use App\Dto\PaymentInput;
use App\Entity\Order;
use Symfony\Component\DependencyInjection\Attribute\AsAlias;

/**
 * Paiement simulé, calqué sur les cartes de test Stripe :
 * 4242 4242 4242 4242 passe, 4000 0000 0000 0002 est refusée, un numéro hors Luhn est invalide.
 */
#[AsAlias(PaymentGateway::class)]
final class SimulatedGateway implements PaymentGateway
{
    public const DECLINED_CARD = '4000000000000002';

    public function charge(Order $order, PaymentInput $payment): void
    {
        if ('card' === $payment->method) {
            $this->checkCard($payment);
        }
        $order->markPaid($payment->method);
    }

    private function checkCard(PaymentInput $payment): void
    {
        $number = preg_replace('/\D/', '', (string) $payment->cardNumber);
        $violations = [];

        if (!self::luhn($number)) {
            $violations['cardNumber'] = 'Numéro de carte invalide.';
        }
        if (!self::notExpired((string) $payment->expiry)) {
            $violations['expiry'] = 'Date d\'expiration invalide ou dépassée.';
        }
        if (!preg_match('/^\d{3,4}$/', (string) $payment->cvc)) {
            $violations['cvc'] = 'Cryptogramme invalide.';
        }
        if ($violations) {
            throw new InvalidPaymentException($violations);
        }
        if (self::DECLINED_CARD === $number) {
            throw new PaymentDeclinedException();
        }
    }

    private static function luhn(string $number): bool
    {
        $len = \strlen($number);
        if ($len < 13 || $len > 19) {
            return false;
        }
        $sum = 0;
        for ($i = 0; $i < $len; ++$i) {
            $d = (int) $number[$len - 1 - $i];
            if (1 === $i % 2) {
                $d *= 2;
                if ($d > 9) {
                    $d -= 9;
                }
            }
            $sum += $d;
        }

        return 0 === $sum % 10;
    }

    /** MM/AA, valable jusqu'à la fin du mois indiqué. */
    private static function notExpired(string $expiry): bool
    {
        if (!preg_match('#^(0[1-9]|1[0-2])\s*/\s*(\d{2})$#', trim($expiry), $m)) {
            return false;
        }
        $end = (new \DateTimeImmutable(\sprintf('20%s-%s-01', $m[2], $m[1])))->modify('first day of next month');

        return $end > new \DateTimeImmutable();
    }
}
