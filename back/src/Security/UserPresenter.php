<?php

namespace App\Security;

use App\Entity\User;

/** Représentation JSON d'un compte (jamais le hash). */
final class UserPresenter
{
    /** @return array{email: string, firstName: string, lastName: string, createdAt: string, admin: bool} */
    public function present(User $user): array
    {
        return [
            'email' => $user->getEmail(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'createdAt' => $user->getCreatedAt()->format(\DATE_ATOM),
            'admin' => $user->isAdmin(),
        ];
    }
}
