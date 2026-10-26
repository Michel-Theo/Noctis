<?php

namespace App\Entity;

use App\Repository\ResetPasswordRequestRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Demande de réinitialisation de mot de passe. Le lien envoyé contient « sélecteur + vérificateur » :
 * le sélecteur retrouve la demande, seul le hachage du vérificateur est stocké.
 */
#[ORM\Entity(repositoryClass: ResetPasswordRequestRepository::class)]
class ResetPasswordRequest
{
    public const LIFETIME = '+1 hour';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private \DateTimeImmutable $requestedAt;

    #[ORM\Column]
    private \DateTimeImmutable $expiresAt;

    public function __construct(
        #[ORM\ManyToOne]
        #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
        private User $user,
        #[ORM\Column(length: 20, unique: true)]
        private string $selector,
        #[ORM\Column(length: 64)]
        private string $hashedVerifier,
    ) {
        $this->requestedAt = new \DateTimeImmutable();
        $this->expiresAt = $this->requestedAt->modify(self::LIFETIME);
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getSelector(): string
    {
        return $this->selector;
    }

    public function isExpired(?\DateTimeImmutable $now = null): bool
    {
        return $this->expiresAt <= ($now ?? new \DateTimeImmutable());
    }

    /** Comparaison à temps constant du vérificateur reçu avec le hachage stocké. */
    public function matches(string $verifier): bool
    {
        return hash_equals($this->hashedVerifier, hash('sha256', $verifier));
    }

    /** Vieillit la demande (tests : lien expiré). */
    public function expireAt(\DateTimeImmutable $at): void
    {
        $this->expiresAt = $at;
    }
}
