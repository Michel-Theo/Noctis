<?php

namespace App\Controller;

use App\Dto\OrderInput;
use App\Dto\PaymentInput;
use App\Entity\Order;
use App\Order\OrderFactory;
use App\Order\OrderPresenter;
use App\Payment\PaymentGateway;
use App\Repository\OrderRepository;
use Doctrine\ORM\EntityManagerInterface;
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
        EntityManagerInterface $em,
        #[MapQueryParameter] ?string $token = null,
    ): JsonResponse {
        $order = $this->find($reference, $token);
        if ($order->isPaid()) {
            throw new ConflictHttpException('Cette commande est déjà réglée.');
        }
        $gateway->charge($order, $payment);
        $em->flush();

        return $this->json($this->presenter->present($order));
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
