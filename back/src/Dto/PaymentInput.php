<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class PaymentInput
{
    public const METHODS = ['card', 'applepay', 'paypal'];

    public function __construct(
        #[Assert\Choice(choices: self::METHODS, message: 'Moyen de paiement inconnu.')]
        public string $method = 'card',
        public ?string $cardNumber = null,
        /** Format MM/AA. */
        public ?string $expiry = null,
        public ?string $cvc = null,
    ) {
    }
}
