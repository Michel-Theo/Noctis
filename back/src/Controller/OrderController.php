<?php

namespace App\Controller;

use App\Dto\CodeInput;
use App\Dto\OrderInput;
use App\Dto\PaymentInput;
use App\Entity\Order;
use App\Entity\OrderStatus;
use App\Mail\NoctisMailer;
use App\Order\OrderFactory;
use App\Order\OrderPresenter;
use App\Order\SerialAllocator;
use App\Payment\PaymentGateway;
use App\Repository\OrderRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapQueryParameter;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/orders')]
final class OrderController extends AbstractController
{
    public function __construct(
        private readonly OrderRepository $orders,
        private readonly OrderPresenter $presenter,
    ) {
    }

    #[Route('', methods: ['POST'])]
    public function create(#[MapRequestPayload] OrderInput $input, OrderFactory $factory): JsonResponse
    {
        $order = $factory->create($input);

        return $this->json([
            'reference' => $order->getReference(),
            'token' => $order->getToken(),
            'total' => $order->getTotal(),
            'status' => $order->getStatus()->value,
        ], 201);
    }

    #[Route('/{reference}/pay', methods: ['POST'])]
    public function pay(
        string $reference,
        #[MapRequestPayload] PaymentInput $payment,
        PaymentGateway $gateway,
        SerialAllocator $serials,
        NoctisMailer $mailer,
        #[MapQueryParameter] ?string $token = null,
    ): JsonResponse {
        $order = $this->find($reference, $token);
        if (!$this->orders->claimForPayment($order)) {
            throw new ConflictHttpException('Cette commande est déjà réglée.');
        }
        try {
            $gateway->charge($order, $payment);
            // Numérotation des pièces + enregistrement du paiement, sous verrou.
            // Série épuisée entre-temps : avec un vrai prestataire, c'est ici qu'on rembourserait.
            $serials->allocate($order);
        } catch (\Throwable $e) {
            $this->orders->releasePayment($order);
            throw $e;
        }
        // Après le paiement enregistré : un e-mail raté ne remet pas la commande en cause.
        $mailer->orderConfirmation($order);

        return $this->json($this->presenter->present($order));
    }

    /** Code de la nuit saisi à l'étape paiement : la commande en attente est recalculée. */
    #[Route('/{reference}/code', methods: ['POST'])]
    public function code(
        string $reference,
        #[MapRequestPayload] CodeInput $input,
        OrderFactory $factory,
        #[MapQueryParameter] ?string $token = null,
    ): JsonResponse {
        $order = $this->find($reference, $token);
        if (OrderStatus::Pending !== $order->getStatus()) {
            throw new ConflictHttpException('Cette commande est déjà réglée.');
        }

        return $this->json(['reference' => $order->getReference()] + $factory->applyCode($order, $input->code)->toArray());
    }

    #[Route('/{reference}', methods: ['GET'])]
    public function show(string $reference, #[MapQueryParameter] ?string $token = null): JsonResponse
    {
        return $this->json($this->presenter->present($this->find($reference, $token)));
    }

    /** Sans le bon jeton, la commande « n'existe pas » : on ne révèle rien. */
    private function find(string $reference, ?string $token): Order
    {
        return $this->orders->findOneByReferenceAndToken($reference, $token)
            ?? throw new NotFoundHttpException('Commande introuvable.');
    }
}
