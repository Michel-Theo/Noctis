<?php

namespace App\Command;

use App\Entity\OrderStatus;
use App\Order\Fabrication;
use Symfony\Component\Console\Attribute\Argument;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/** Fait avancer la fabrication d'une commande payée d'une étape (même règle que le back-office). */
#[AsCommand(name: 'app:order:advance', description: 'Fait avancer une commande payée d\'une étape (payée → coulée → polie → expédiée → livrée)')]
final class AdvanceOrderCommand
{
    public function __construct(private readonly Fabrication $fabrication)
    {
    }

    public function __invoke(SymfonyStyle $io, #[Argument('Référence, ex. NX-2026-0003')] string $reference): int
    {
        try {
            [$order] = $this->fabrication->advance([$reference]);
        } catch (UnprocessableEntityHttpException $e) {
            $io->error($e->getMessage());

            return Command::FAILURE;
        }
        $to = $order->getStatus();
        // Les cas de l'énumération suivent l'ordre de fabrication : l'étape quittée est la précédente.
        $from = OrderStatus::cases()[array_search($to, OrderStatus::cases(), true) - 1];
        $io->success(\sprintf('%s : %s → %s', $reference, $from->value, $to->value));

        return Command::SUCCESS;
    }
}
