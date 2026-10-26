<?php

namespace App\Controller;

use App\Dto\RegisterInput;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Security\UserPresenter;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api')]
final class AuthController extends AbstractController
{
    public function __construct(private readonly UserPresenter $presenter)
    {
    }

    /** Inscription : le compte est créé puis connecté dans la foulée. */
    #[Route('/auth/register', methods: ['POST'])]
    public function register(
        #[MapRequestPayload] RegisterInput $input,
        UserRepository $users,
        UserPasswordHasherInterface $hasher,
        EntityManagerInterface $em,
        Security $security,
    ): JsonResponse {
        $taken = new JsonResponse(['error' => 'Validation', 'violations' => ['email' => 'Un compte existe déjà avec cet e-mail.']], 422);
        if ($users->findOneByEmail($input->email)) {
            return $taken;
        }

        $user = new User($input->email, trim($input->firstName), trim($input->lastName));
        $user->setPassword($hasher->hashPassword($user, $input->password));
        try {
            $em->persist($user);
            $em->flush();
        } catch (UniqueConstraintViolationException) {
            // Deux inscriptions simultanées avec le même e-mail.
            return $taken;
        }
        $security->login($user, 'json_login', 'main');

        return new JsonResponse($this->presenter->present($user), 201);
    }

    /** Traité par le pare-feu (json_login) : cette méthode n'est jamais exécutée. */
    #[Route('/auth/login', name: 'api_auth_login', methods: ['POST'])]
    public function login(): never
    {
        throw new \LogicException('Intercepté par json_login.');
    }

    /** Traité par le pare-feu (logout) : cette méthode n'est jamais exécutée. */
    #[Route('/auth/logout', name: 'api_auth_logout', methods: ['POST'])]
    public function logout(): never
    {
        throw new \LogicException('Intercepté par le pare-feu.');
    }

    #[Route('/me', methods: ['GET'])]
    public function me(#[CurrentUser] User $user): JsonResponse
    {
        return new JsonResponse($this->presenter->present($user));
    }
}
