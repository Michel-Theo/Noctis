<?php

namespace App\Controller;

use App\Entity\User;
use App\Mail\EmailSamples;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mime\BodyRendererInterface;
use Symfony\Component\Mime\Part\DataPart;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/** Aperçus des e-mails dans le back-office, avec des données d'exemple (rien n'est écrit en base). */
#[Route('/api/admin/emails')]
final class AdminEmailController extends AbstractController
{
    public function __construct(private readonly EmailSamples $samples)
    {
    }

    #[Route('', methods: ['GET'])]
    public function list(#[CurrentUser] User $user): JsonResponse
    {
        return $this->json(array_map(
            fn (string $key) => ['key' => $key, 'label' => EmailSamples::EMAILS[$key], 'subject' => $this->samples->build($key, $user)->getSubject()],
            array_keys(EmailSamples::EMAILS),
        ));
    }

    #[Route('/{key}', methods: ['GET'])]
    public function show(string $key, #[CurrentUser] User $user, BodyRendererInterface $renderer): Response
    {
        $email = $this->samples->build($key, $user);
        $renderer->render($email);

        // Les logos sont joints à l'e-mail (cid:…) : dans le navigateur, on les remplace par leur contenu.
        $html = (string) $email->getHtmlBody();
        foreach ($email->getAttachments() as $part) {
            if ($part instanceof DataPart && $part->hasContentId()) {
                $html = str_replace('cid:'.$part->getContentId(), \sprintf('data:%s/%s;base64,%s', $part->getMediaType(), $part->getMediaSubtype(), base64_encode($part->getBody())), $html);
            }
        }

        return new Response($html, 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }
}
