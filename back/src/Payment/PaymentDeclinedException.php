<?php

namespace App\Payment;

use Symfony\Component\HttpKernel\Exception\HttpException;

final class PaymentDeclinedException extends HttpException
{
    public function __construct(string $message = 'Carte refusée.')
    {
        parent::__construct(402, $message);
    }
}
