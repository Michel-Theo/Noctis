<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class RegisterInput
{
    public function __construct(
        #[Assert\NotBlank(message: 'Votre e-mail est requis.')]
        #[Assert\Email(message: 'Cet e-mail n\'est pas valide.')]
        #[Assert\Length(max: 180)]
        public string $email = '',
        #[Assert\NotBlank(message: 'Choisissez un mot de passe.')]
        #[Assert\Length(min: 8, max: 4096, minMessage: '8 caractères au moins.')]
        public string $password = '',
        #[Assert\NotBlank(message: 'Votre prénom est requis.')]
        #[Assert\Length(max: 80)]
        public string $firstName = '',
        #[Assert\NotBlank(message: 'Votre nom est requis.')]
        #[Assert\Length(max: 80)]
        public string $lastName = '',
    ) {
    }
}
