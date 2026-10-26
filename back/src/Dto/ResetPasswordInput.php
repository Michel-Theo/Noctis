<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class ResetPasswordInput
{
    public function __construct(
        #[Assert\NotBlank(message: 'Ce lien n\'est plus valable. Demandez-en un nouveau.')]
        public string $token = '',
        #[Assert\Length(min: 8, max: 4096, minMessage: '8 caractères au moins.')]
        public string $password = '',
    ) {
    }
}
