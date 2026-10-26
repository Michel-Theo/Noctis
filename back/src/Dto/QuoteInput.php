<?php

namespace App\Dto;

use App\Pricing\Shipping;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class QuoteInput
{
    /**
     * @param list<CartItemInput> $items
     */
    public function __construct(
        #[Assert\Count(min: 1, max: 10, minMessage: 'Le panier est vide.', maxMessage: 'Dix lignes au plus par commande.')]
        #[Assert\Valid]
        public array $items = [],
        #[Assert\Choice(callback: [Shipping::class, 'methods'], message: 'Mode de livraison inconnu.')]
        public string $shipping = Shipping::COLISSIMO,
        public ?string $code = null,
    ) {
    }
}
