<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class ContactInput
{
    public const SUBJECTS = ['commande', 'sur-mesure', 'autre'];

    public function __construct(
        #[Assert\NotBlank(message: 'Votre prénom est requis.')]
        #[Assert\Length(max: 80)]
        public string $firstName = '',
        #[Assert\Length(max: 80)]
        public string $lastName = '',
        #[Assert\NotBlank(message: 'Votre e-mail est requis.')]
        #[Assert\Email(message: 'Cet e-mail n\'est pas valide.')]
        #[Assert\Length(max: 180)]
        public string $email = '',
        #[Assert\Choice(choices: self::SUBJECTS, message: 'Sujet inconnu.')]
        public string $subject = 'autre',
        #[Assert\Length(min: 10, max: 4000, minMessage: 'Quelques mots de plus, s\'il vous plaît.', maxMessage: 'Message trop long (4 000 caractères au plus).')]
        public string $message = '',
    ) {
    }
}
