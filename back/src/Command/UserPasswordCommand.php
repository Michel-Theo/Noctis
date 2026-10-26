<?php

namespace App\Command;

use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\Argument;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Question\Question;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/** Change le mot de passe d'un compte. Saisie masquée : le mot de passe n'apparaît ni à l'écran ni dans l'historique. */
#[AsCommand(name: 'app:user:password', description: 'Change le mot de passe d\'un compte (saisie masquée)')]
final class UserPasswordCommand
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly EntityManagerInterface $em,
    ) {
    }

    public function __invoke(SymfonyStyle $io, #[Argument('E-mail du compte')] string $email): int
    {
        $user = $this->users->findOneByEmail($email);
        if (!$user) {
            $io->error(\sprintf('Aucun compte pour %s.', $email));

            return Command::FAILURE;
        }

        $ask = static fn (string $label) => (new Question($label))->setHidden(true)->setHiddenFallback(false);
        $password = (string) $io->askQuestion($ask('Nouveau mot de passe (12 caractères au moins)'));
        if (mb_strlen($password) < 12) {
            $io->error('Trop court : 12 caractères au moins.');

            return Command::FAILURE;
        }
        if ($password !== (string) $io->askQuestion($ask('Confirmez'))) {
            $io->error('Les deux saisies diffèrent.');

            return Command::FAILURE;
        }

        $user->setPassword($this->hasher->hashPassword($user, $password));
        $this->em->flush();
        $io->success(\sprintf('Mot de passe de %s changé.', $email));

        return Command::SUCCESS;
    }
}
