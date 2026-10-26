<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/** Code de la nuit saisi pendant le tunnel (vide = retirer le code). */
final readonly class CodeInput
{
    public function __construct(
        #[Assert\Length(max: 20, maxMessage: 'Code trop long.')]
        public ?string $code = null,
    ) {
    }
}
