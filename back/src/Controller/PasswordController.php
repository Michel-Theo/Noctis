<?php

namespace App\Controller;

use App\Dto\ForgotPasswordInput;
use App\Dto\ResetPasswordInput;
use App\Mail\NoctisMailer;
use App\Repository\UserRepository;
use App\Security\PasswordReset;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Symfony\Component\RateLimiter\RateLimiterFactoryInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/auth')]
final class PasswordController extends AbstractController
{
    /** Mot de passe oublié : la réponse est la même que le compte existe ou non. */
    #[Route('/forgot', methods: ['POST'])]
    public function forgot(
        #[MapRequestPayload] ForgotPasswordInput $input,
        Request $request,
        RateLimiterFactoryInterface $forgotLimiter,
        UserRepository $users,
        PasswordReset $reset,
        NoctisMailer $mailer,
    ): Response {
        if (!$forgotLimiter->create($request->getClientIp())->consume()->isAccepted()) {
            throw new TooManyRequestsHttpException(900, 'Trop de demandes. Réessayez dans quelques minutes.');
        }
        $user = $users->findOneByEmail($input->email);
        if ($user) {
            $mailer->passwordReset($user, $reset->request($user));
        }

        return new Response(null, Response::HTTP_NO_CONTENT);
    }

    /** Nouveau mot de passe depuis le lien reçu par e-mail. */
    #[Route('/reset', methods: ['POST'])]
    public function reset(#[MapRequestPayload] ResetPasswordInput $input, PasswordReset $reset): Response
    {
        if (!$reset->reset($input->token, $input->password)) {
            return new JsonResponse(['error' => 'Validation', 'violations' => ['token' => 'Ce lien n\'est plus valable. Demandez-en un nouveau.']], 422);
        }

        return new Response(null, Response::HTTP_NO_CONTENT);
    }
}
