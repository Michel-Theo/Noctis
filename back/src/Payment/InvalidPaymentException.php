<?php

namespace App\Payment;

use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/** Données de carte invalides ; violations par champ, comme une erreur de validation. */
final class InvalidPaymentException extends UnprocessableEntityHttpException
{
    /** @param array<string, string> $violations */
    public function __construct(public readonly array $violations)
    {
        parent::__construct('Validation');
    }
}
