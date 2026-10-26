<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/** Fiche produit éditée dans le back-office. */
final readonly class ProductInput
{
    public const SIZES = [50, 52, 54, 56, 57, 58, 60, 62, 64, 66];
    public const FINISHES = ['Argent rhodié', 'Argent oxydé', 'Or 18 k'];

    /**
     * @param list<int>    $sizes
     * @param list<string> $finishes
     */
    public function __construct(
        #[Assert\NotBlank(message: 'Le nom est requis.')]
        #[Assert\Length(max: 80, maxMessage: 'Le nom tient en 80 caractères.')]
        public string $name = '',
        #[Assert\Length(max: 400, maxMessage: 'L\'accroche tient en 400 caractères.')]
        public string $pitch = '',
        /** Centimes ; null = pièce en forge. */
        #[Assert\GreaterThanOrEqual(100, message: 'Le prix doit être d\'au moins 1 €.')]
        public ?int $price = null,
        public bool $published = false,
        #[Assert\Range(notInRangeMessage: 'La série compte entre {{ min }} et {{ max }} pièces.', min: 1, max: 999)]
        public int $editionTotal = 150,
        #[Assert\Count(min: 1, minMessage: 'Choisissez au moins une taille.')]
        #[Assert\All([new Assert\Choice(choices: self::SIZES, message: 'Taille inconnue.')])]
        public array $sizes = [],
        #[Assert\Count(min: 1, minMessage: 'Choisissez au moins une finition.')]
        #[Assert\All([new Assert\Choice(choices: self::FINISHES, message: 'Finition inconnue.')])]
        public array $finishes = [],
    ) {
    }
}
