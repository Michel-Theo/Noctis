<?php

namespace App\Controller;

use App\Dto\ContactInput;
use App\Entity\ContactMessage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Symfony\Component\RateLimiter\RateLimiterFactoryInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api')]
final class ContactController extends AbstractController
{
    /** Message à l'atelier, limité à 3 envois par tranche de 10 minutes et par IP. */
    #[Route('/contact', methods: ['POST'])]
    public function send(
        #[MapRequestPayload] ContactInput $input,
        Request $request,
        RateLimiterFactoryInterface $contactLimiter,
        EntityManagerInterface $em,
    ): JsonResponse {
        if (!$contactLimiter->create($request->getClientIp())->consume()->isAccepted()) {
            throw new TooManyRequestsHttpException(600, 'Trop de messages. Réessayez dans quelques minutes.');
        }

        $em->persist(new ContactMessage(trim($input->firstName), trim($input->lastName), trim($input->email), $input->subject, trim($input->message)));
        $em->flush();

        return $this->json(['ok' => true], 201);
    }
}
