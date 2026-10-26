<?php

namespace App\Pricing;

/** Modes de livraison et leur coût (centimes). */
final class Shipping
{
    public const COLISSIMO = 'colissimo';
    public const CHRONOPOST = 'chronopost';
    public const ATELIER = 'atelier';

    /** Colissimo offert dès ce sous-total. */
    public const FREE_FROM = 15000;

    /** @return list<string> */
    public static function methods(): array
    {
        return [self::COLISSIMO, self::CHRONOPOST, self::ATELIER];
    }

    public static function cost(string $method, int $subtotal): int
    {
        return match ($method) {
            self::COLISSIMO => $subtotal >= self::FREE_FROM ? 0 : 690,
            self::CHRONOPOST => 1200,
            self::ATELIER => 0,
            default => throw new \InvalidArgumentException('Mode de livraison inconnu.'),
        };
    }
}
