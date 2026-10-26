<?php

namespace App\Dto;

use App\Pricing\Shipping;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class OrderInput
{
    /**
     * @param list<CartItemInput> $items
     */
    public function __construct(
        #[Assert\NotBlank(message: 'Votre e-mail est requis.')]
        #[Assert\Email(message: 'Cet e-mail n\'est pas valide.')]
        public string $email = '',
        #[Assert\NotBlank(message: 'Votre prénom est requis.')]
        #[Assert\Length(max: 80)]
        public string $firstName = '',
        #[Assert\NotBlank(message: 'Votre nom est requis.')]
        #[Assert\Length(max: 80)]
        public string $lastName = '',
        #[Assert\NotBlank(message: 'L\'adresse est requise.')]
        #[Assert\Length(max: 200)]
        public string $address = '',
        #[Assert\NotBlank(message: 'Le code postal est requis.')]
        #[Assert\Regex(pattern: '/^[0-9A-Za-z \-]{3,10}$/', message: 'Code postal invalide.')]
        public string $postalCode = '',
        #[Assert\NotBlank(message: 'La ville est requise.')]
        #[Assert\Length(max: 80)]
        public string $city = '',
        #[Assert\NotBlank(message: 'Le pays est requis.')]
        #[Assert\Length(max: 80)]
        public string $country = '',
        #[Assert\Choice(callback: [Shipping::class, 'methods'], message: 'Mode de livraison inconnu.')]
        public string $shipping = Shipping::COLISSIMO,
        #[Assert\Count(min: 1, minMessage: 'Le panier est vide.')]
        #[Assert\Valid]
        public array $items = [],
        public ?string $code = null,
    ) {
    }
}
