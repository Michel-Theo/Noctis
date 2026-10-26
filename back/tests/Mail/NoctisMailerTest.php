<?php

namespace App\Tests\Mail;

use App\Entity\ContactMessage;
use App\Mail\NoctisMailer;
use PHPUnit\Framework\TestCase;
use Psr\Log\AbstractLogger;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\RawMessage;

/** Un serveur de mail en panne ne fait jamais échouer l'action métier : l'erreur est journalisée. */
final class NoctisMailerTest extends TestCase
{
    public function testTransportFailureIsLoggedNotThrown(): void
    {
        $mailer = new class implements MailerInterface {
            public function send(RawMessage $message, ?Envelope $envelope = null): void
            {
                throw new TransportException('Connexion SMTP refusée.');
            }
        };
        $logger = new class extends AbstractLogger {
            /** @var list<string> */
            public array $errors = [];

            public function log($level, \Stringable|string $message, array $context = []): void
            {
                $this->errors[] = strtr((string) $message, ['{what}' => $context['what'] ?? '', '{error}' => $context['error'] ?? '']);
            }
        };

        (new NoctisMailer($mailer, $logger, 'NOCTIS <atelier@noctis.example>', 'atelier@noctis.example', 'https://noctis.test'))
            ->contact(new ContactMessage('Inès', 'Roche', 'ines@exemple.fr', 'autre', 'Bonsoir, une question.'));

        self::assertCount(2, $logger->errors);
        self::assertStringContainsString('Connexion SMTP refusée.', $logger->errors[0]);
    }
}
