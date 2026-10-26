<?php

namespace App\Command;

use App\Repository\OrderRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\Argument;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;

/** Démo sans back-office : fait avancer la fabrication d'une commande payée d'une étape. */
#[AsCommand(name: 'app:order:advance', description: 'Fait avancer une commande payée d\'une étape (payée → coulée → polie → expédiée → livrée)')]
final class AdvanceOrderCommand
{
    public function __construct(
        private readonly OrderRepository $orders,
        private readonly EntityManagerInterface $em,
    ) {
    }

    public function __invoke(SymfonyStyle $io, #[Argument('Référence, ex. NX-2026-0003')] string $reference): int
    {
        $order = $this->orders->findOneBy(['reference' => $reference]);
        if (null === $order) {
            $io->error(\sprintf('Commande %s introuvable.', $reference));

            return Command::FAILURE;
        }
        $from = $order->getStatus();
        try {
            $to = $order->advance();
        } catch (\LogicException $e) {
            $io->error($e->getMessage());

            return Command::FAILURE;
        }
        $this->em->flush();
        $io->success(\sprintf('%s : %s → %s', $reference, $from->value, $to->value));

        return Command::SUCCESS;
    }
}
