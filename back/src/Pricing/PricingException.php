<?php

namespace App\Pricing;

use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/** Panier refusé : pièce inconnue, en forge, finition ou taille hors liste. */
final class PricingException extends UnprocessableEntityHttpException
{
}
