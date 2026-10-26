<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/** Commandes à faire avancer d'une étape depuis le back-office. */
final readonly class AdvanceInput
{
    /** @param list<string> $references */
    public function __construct(
        #[Assert\Count(min: 1, max: 100, minMessage: 'Aucune commande sélectionnée.', maxMessage: 'Cent commandes au plus à la fois.')]
        #[Assert\All([new Assert\Type('string'), new Assert\NotBlank()])]
        public array $references = [],
    ) {
    }
}
