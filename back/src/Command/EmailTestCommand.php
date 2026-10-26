<?php

namespace App\Command;

use App\Entity\User;
use App\Mail\EmailSamples;
use Symfony\Component\Console\Attribute\Argument;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

/** Envoie les huit e-mails d'exemple à une adresse, pour vérifier le rendu dans une vraie messagerie. */
#[AsCommand(name: 'app:email:test', description: 'Envoie les 8 e-mails d\'exemple à une adresse (vérifie MAILER_DSN)')]
final class EmailTestCommand
{
    public function __construct(
        private readonly EmailSamples $samples,
        private readonly MailerInterface $mailer,
    ) {
    }

    public function __invoke(SymfonyStyle $io, #[Argument('Adresse de destination')] string $to): int
    {
        $user = new User($to, 'Théo', 'Michel');
        foreach (EmailSamples::EMAILS as $key => $label) {
            // Tous les e-mails vont à l'adresse de test, quel que soit leur destinataire réel.
            $email = $this->samples->build($key, $user)->to(new Address($to));
            try {
                $this->mailer->send($email);
                $io->writeln(\sprintf('  ✓ %s', $label));
            } catch (\Throwable $e) {
                $io->error(\sprintf('%s : %s', $label, $e->getMessage()));

                return Command::FAILURE;
            }
        }
        $io->success(\sprintf('8 e-mails envoyés à %s.', $to));

        return Command::SUCCESS;
    }
}
