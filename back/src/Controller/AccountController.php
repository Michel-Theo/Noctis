<?php

namespace App\Controller;

use App\Entity\User;
use App\Order\AccountOrderPresenter;
use App\Repository\OrderRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/** Espace compte : réservé aux clients connectés (access_control ^/api/me). */
#[Route('/api/me')]
final class AccountController extends AbstractController
{
    /** Commande en cours, historique et pièces numérotées. */
    #[Route('/orders', methods: ['GET'])]
    public function orders(#[CurrentUser] User $user, OrderRepository $orders, AccountOrderPresenter $presenter): JsonResponse
    {
        return new JsonResponse($presenter->present($orders->findPaidByUser($user)));
    }
}
