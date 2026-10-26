<?php

namespace App\Mail;

use App\Entity\ContactMessage;
use App\Entity\Order;
use App\Entity\OrderStatus;
use App\Entity\User;
use App\Order\OrderPresenter;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

/**
 * E-mails de la marque. Les méthodes build*() construisent le message (réutilisées par les aperçus
 * du back-office) ; les autres l'envoient. Un envoi raté est journalisé, jamais remonté :
 * une commande payée ou un message reçu ne doit pas échouer à cause du serveur de mail.
 */
final class NoctisMailer
{
    /** Étapes de fabrication annoncées par e-mail : sujet, titre, texte. */
    private const STEPS = [
        'cast' => ['Votre pièce est coulée', 'Votre pièce est coulée.', 'L’argent a rempli le moule cette nuit. Votre pièce sort du plâtre, brute et grise : place à l’ébavurage et au polissage.'],
        'polished' => ['Polie et rhodiée', 'Polie et rhodiée.', 'Polissage miroir terminé, bain de rhodium appliqué. Le numéro est gravé à l’intérieur de l’anneau. Prochaine étape : l’expédition.'],
        'shipped' => ['Votre relique est expédiée', 'Votre relique est en chemin.', 'Elle a quitté l’atelier ce soir, en suivi. Comptez deux à trois jours.'],
        'delivered' => ['Livrée', 'Livrée.', 'Votre relique est arrivée. Un chiffon doux suffit à lui rendre son éclat ; son certificat vous attend dans votre compte.'],
    ];

    private const SUBJECTS = ['commande' => 'Commande', 'sur-mesure' => 'Sur mesure', 'autre' => 'Autre'];

    private const SHIPPING = ['colissimo' => 'Colissimo suivi', 'chronopost' => 'Chronopost 24 h', 'atelier' => 'Retrait à l’atelier'];

    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly LoggerInterface $logger,
        #[Autowire('%env(MAILER_FROM)%')] private readonly string $from,
        #[Autowire('%env(CONTACT_TO)%')] private readonly string $contactTo,
        #[Autowire('%env(DEFAULT_URI)%')] private readonly string $site,
    ) {
    }

    public function orderConfirmation(Order $order): void
    {
        $this->send($this->buildOrderConfirmation($order), 'confirmation de commande '.$order->getReference());
    }

    /** E-mail de l'étape atteinte par la commande (après une avance de fabrication). */
    public function fabricationStep(Order $order): void
    {
        if (!isset(self::STEPS[$order->getStatus()->value])) {
            return;
        }
        $this->send($this->buildFabricationStep($order, $order->getStatus()), 'suivi '.$order->getReference());
    }

    public function passwordReset(User $user, string $token): void
    {
        $this->send($this->buildPasswordReset($user, $token), 'réinitialisation '.$user->getEmail());
    }

    /** Message du formulaire : transmis à l'atelier, accusé de réception au client. */
    public function contact(ContactMessage $message): void
    {
        $this->send($this->buildContactNotification($message), 'contact atelier');
        $this->send($this->buildContactReceipt($message), 'accusé contact');
    }

    public function buildOrderConfirmation(Order $order): TemplatedEmail
    {
        return $this->email($order->getEmail(), $order->getFirstName(), \sprintf('Votre relique est en route — %s', $order->getReference()), 'order_confirmation', [
            'order' => $order,
            'shipping' => self::SHIPPING[$order->getShippingMethod()] ?? $order->getShippingMethod(),
            'timeline' => $this->timeline($order, OrderStatus::Paid),
            'trackUrl' => $this->trackUrl($order),
        ]);
    }

    public function buildFabricationStep(Order $order, OrderStatus $step): TemplatedEmail
    {
        [$subject, $title, $text] = self::STEPS[$step->value] ?? throw new \InvalidArgumentException(\sprintf('Pas d\'e-mail pour l\'étape %s.', $step->value));
        if (OrderStatus::Shipped === $step && 'atelier' === $order->getShippingMethod()) {
            [$title, $text] = ['Elle vous attend à l’atelier.', 'Votre relique est prête. Écrivez-nous pour convenir d’un rendez-vous de retrait, à Troyes.'];
        }

        return $this->email($order->getEmail(), $order->getFirstName(), $subject, 'fabrication', [
            'order' => $order,
            'step' => $step->value,
            'title' => $title,
            'text' => $text,
            'timeline' => $this->timeline($order, $step),
            'trackUrl' => $this->trackUrl($order),
        ]);
    }

    public function buildPasswordReset(User $user, string $token): TemplatedEmail
    {
        return $this->email($user->getEmail(), $user->getFirstName(), 'Réinitialiser votre mot de passe', 'password_reset', [
            'firstName' => $user->getFirstName(),
            'resetUrl' => \sprintf('%s/compte/reinitialiser?token=%s', rtrim($this->site, '/'), rawurlencode($token)),
        ]);
    }

    public function buildContactNotification(ContactMessage $message): TemplatedEmail
    {
        $name = trim($message->getFirstName().' '.$message->getLastName());
        $subject = self::SUBJECTS[$message->getSubject()] ?? $message->getSubject();

        return $this->email($this->contactTo, null, \sprintf('Nouveau message — %s — %s', $subject, $name), 'contact_notification', [
            'message' => $message,
            'name' => $name,
            'subject' => $subject,
        ])->replyTo(new Address($message->getEmail(), $name));
    }

    public function buildContactReceipt(ContactMessage $message): TemplatedEmail
    {
        return $this->email($message->getEmail(), $message->getFirstName(), 'Votre message est bien arrivé', 'contact_receipt', [
            'message' => $message,
            'subject' => self::SUBJECTS[$message->getSubject()] ?? $message->getSubject(),
        ]);
    }

    /** @param array<string, mixed> $context */
    private function email(string $to, ?string $name, string $subject, string $template, array $context): TemplatedEmail
    {
        return (new TemplatedEmail())
            ->from(Address::create($this->from))
            ->to(new Address($to, $name ?? ''))
            ->subject($subject)
            ->htmlTemplate(\sprintf('email/%s.html.twig', $template))
            ->textTemplate(\sprintf('email/%s.txt.twig', $template))
            ->context($context + ['subject_line' => $subject]);
    }

    private function send(TemplatedEmail $email, string $what): void
    {
        try {
            $this->mailer->send($email);
        } catch (\Throwable $e) {
            $this->logger->error('E-mail non envoyé ({what}) : {error}', ['what' => $what, 'error' => $e->getMessage()]);
        }
    }

    private function trackUrl(Order $order): string
    {
        return \sprintf('%s/commande/confirmation/%s?token=%s', rtrim($this->site, '/'), rawurlencode($order->getReference()), $order->getToken());
    }

    /**
     * Frise de l'e-mail : les étapes jusqu'à $step sont faites, $step est l'étape courante.
     *
     * @return list<array{label: string, date: \DateTimeImmutable, done: bool, current: bool}>
     */
    private function timeline(Order $order, OrderStatus $step): array
    {
        $reached = match ($step) {
            OrderStatus::Cast => 1,
            OrderStatus::Polished => 2,
            OrderStatus::Shipped => 3,
            OrderStatus::Delivered => 4,
            default => 0,
        };

        return array_map(static fn (array $s, int $i) => [
            'label' => $s['label'],
            'date' => $s['date'],
            'done' => $i <= $reached,
            'current' => $i === $reached,
        ], OrderPresenter::timeline($order), array_keys(OrderPresenter::timeline($order)));
    }
}
