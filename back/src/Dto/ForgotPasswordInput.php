<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class ForgotPasswordInput
{
    public function __construct(
        #[Assert\NotBlank(message: 'Votre e-mail est requis.')]
        #[Assert\Email(message: 'Cet e-mail n\'est pas valide.')]
        public string $email = '',
    ) {
    }
}
