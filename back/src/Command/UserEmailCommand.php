<?php

namespace App\Command;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\Argument;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Validator\Constraints\Email;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/** Change l'e-mail de connexion d'un compte (les commandes passées restent rattachées au compte). */
#[AsCommand(name: 'app:user:email', description: 'Change l\'e-mail de connexion d\'un compte')]
final class UserEmailCommand
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly ValidatorInterface $validator,
        private readonly EntityManagerInterface $em,
    ) {
    }

    public function __invoke(
        SymfonyStyle $io,
        #[Argument('E-mail actuel')] string $current,
        #[Argument('Nouvel e-mail')] string $new,
    ): int {
        $user = $this->users->findOneByEmail($current);
        if (!$user) {
            $io->error(\sprintf('Aucun compte pour %s.', $current));

            return Command::FAILURE;
        }
        $new = User::normalizeEmail($new);
        if (\count($this->validator->validate($new, new Email()))) {
            $io->error(\sprintf('%s n\'est pas un e-mail valide.', $new));

            return Command::FAILURE;
        }
        if ($this->users->findOneByEmail($new)) {
            $io->error(\sprintf('Un compte existe déjà avec %s.', $new));

            return Command::FAILURE;
        }

        $user->setEmail($new);
        $this->em->flush();
        $io->success(\sprintf('Le compte %s se connecte désormais avec %s.', $current, $new));

        return Command::SUCCESS;
    }
}
