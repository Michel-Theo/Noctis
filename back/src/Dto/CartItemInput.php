<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/** Une ligne du panier telle qu'envoyée par le client (sans prix : il est recalculé). */
final readonly class CartItemInput
{
    public function __construct(
        #[Assert\NotBlank(message: 'Pièce manquante.')]
        public string $slug = '',
        #[Assert\NotBlank(message: 'Finition manquante.')]
        public string $finish = '',
        #[Assert\Positive(message: 'Taille invalide.')]
        public int $size = 0,
        #[Assert\Range(notInRangeMessage: 'Quantité entre {{ min }} et {{ max }}.', min: 1, max: 5)]
        public int $quantity = 1,
    ) {
    }
}
