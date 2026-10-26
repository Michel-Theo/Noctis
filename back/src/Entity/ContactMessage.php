<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/** Message envoyé depuis la page Contact (lu par l'atelier ; l'envoi d'e-mail viendra avec le serveur). */
#[ORM\Entity]
class ContactMessage
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct(
        #[ORM\Column(length: 80)]
        private string $firstName,
        #[ORM\Column(length: 80)]
        private string $lastName,
        #[ORM\Column(length: 180)]
        private string $email,
        #[ORM\Column(length: 20)]
        private string $subject,
        #[ORM\Column(type: 'text')]
        private string $message,
    ) {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getSubject(): string
    {
        return $this->subject;
    }

    public function getMessage(): string
    {
        return $this->message;
    }
}
