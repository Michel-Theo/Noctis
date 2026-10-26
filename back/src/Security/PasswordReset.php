<?php

namespace App\Security;

use App\Entity\ResetPasswordRequest;
use App\Entity\User;
use App\Repository\ResetPasswordRequestRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Mot de passe oublié. Le lien porte « sélecteur (20) + vérificateur (32) » ; seul le hachage
 * SHA-256 du vérificateur est stocké. Une nouvelle demande remplace les précédentes.
 */
final class PasswordReset
{
    private const SELECTOR = 20;

    public function __construct(
        private readonly ResetPasswordRequestRepository $requests,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly EntityManagerInterface $em,
    ) {
    }

    /** Crée une demande et renvoie le jeton à mettre dans le lien. */
    public function request(User $user): string
    {
        $this->requests->removeForUser($user);
        $selector = bin2hex(random_bytes(self::SELECTOR / 2));
        $verifier = bin2hex(random_bytes(16));
        $this->em->persist(new ResetPasswordRequest($user, $selector, hash('sha256', $verifier)));
        $this->em->flush();

        return $selector.$verifier;
    }

    /** Change le mot de passe si le jeton est valable ; la demande est alors consommée. */
    public function reset(string $token, string $password): bool
    {
        $request = $this->requests->findOneBy(['selector' => substr($token, 0, self::SELECTOR)]);
        if (null === $request || $request->isExpired() || !$request->matches(substr($token, self::SELECTOR))) {
            return false;
        }
        $user = $request->getUser();
        $user->setPassword($this->hasher->hashPassword($user, $password));
        $this->requests->removeForUser($user);
        $this->em->flush();

        return true;
    }
}
