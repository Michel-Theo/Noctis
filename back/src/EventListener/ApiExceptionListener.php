<?php

namespace App\EventListener;

use App\Payment\InvalidPaymentException;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Validator\Exception\ValidationFailedException;

/** Sous /api, toute erreur répond en JSON : {error} ou {error: 'Validation', violations: {champ: message}}. */
#[AsEventListener(event: KernelEvents::EXCEPTION)]
final class ApiExceptionListener
{
    private const DEFAULTS = [
        400 => 'Requête invalide.',
        404 => 'Introuvable.',
        405 => 'Méthode non autorisée.',
        415 => 'Le corps de la requête doit être du JSON.',
        422 => 'Requête invalide.',
    ];

    public function __construct(
        #[Autowire('%kernel.project_dir%')] private readonly string $projectDir,
        #[Autowire('%kernel.debug%')] private readonly bool $debug,
    ) {
    }

    public function __invoke(ExceptionEvent $event): void
    {
        if (!str_starts_with($event->getRequest()->getPathInfo(), '/api')) {
            return;
        }
        $e = $event->getThrowable();

        if ($e instanceof InvalidPaymentException) {
            $event->setResponse(new JsonResponse(['error' => 'Validation', 'violations' => $e->violations], 422));

            return;
        }

        // #[MapRequestPayload] : la ValidationFailedException est l'exception précédente.
        $validation = $e->getPrevious() instanceof ValidationFailedException ? $e->getPrevious() : null;
        if ($validation) {
            $violations = [];
            foreach ($validation->getViolations() as $v) {
                $violations[$v->getPropertyPath() ?: 'body'] ??= $v->getMessage();
            }
            $event->setResponse(new JsonResponse(['error' => 'Validation', 'violations' => $violations], 422));

            return;
        }

        $status = $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500;
        // Les messages des erreurs HTTP levées dans src/ sont destinés au client (en français) ;
        // ceux du framework et ceux des pannes internes (500), jamais.
        $ours = $status < 500 && str_starts_with(str_replace('\\', '/', $e->getFile()), str_replace('\\', '/', $this->projectDir).'/src/');
        $body = ['error' => $ours && $e->getMessage() ? $e->getMessage() : (self::DEFAULTS[$status] ?? 'Erreur interne.')];
        if ($this->debug && !$ours) {
            $body['detail'] = ($e->getPrevious() ?? $e)->getMessage();
        }

        $event->setResponse(new JsonResponse($body, $status, $e instanceof HttpExceptionInterface ? $e->getHeaders() : []));
    }
}
