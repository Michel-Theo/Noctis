<?php

namespace App\Mail;

use App\Entity\ContactMessage;
use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\OrderStatus;
use App\Entity\User;
use App\Repository\OrderRepository;
use App\Repository\ProductRepository;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/** Les e-mails de la boutique, construits avec des données d'exemple (aperçus admin, envoi de test). Rien n'est écrit en base. */
final class EmailSamples
{
    public const EMAILS = [
        'order-confirmation' => 'Confirmation de commande',
        'fabrication-cast' => 'Suivi · coulée',
        'fabrication-polished' => 'Suivi · polie et rhodiée',
        'fabrication-shipped' => 'Suivi · expédiée',
        'fabrication-delivered' => 'Suivi · livrée',
        'password-reset' => 'Mot de passe oublié',
        'contact-notification' => 'Contact · message à l’atelier',
        'contact-receipt' => 'Contact · accusé de réception',
    ];

    public function __construct(
        private readonly NoctisMailer $mailer,
        private readonly OrderRepository $orders,
        private readonly ProductRepository $products,
    ) {
    }

    public function build(string $key, User $user): TemplatedEmail
    {
        return match (true) {
            'order-confirmation' === $key => $this->mailer->buildOrderConfirmation($this->sampleOrder()),
            str_starts_with($key, 'fabrication-') && isset(self::EMAILS[$key]) => $this->mailer->buildFabricationStep($this->sampleOrder(), OrderStatus::from(substr($key, 12))),
            'password-reset' === $key => $this->mailer->buildPasswordReset($user, str_repeat('0', 52)),
            'contact-notification' === $key => $this->mailer->buildContactNotification($this->sampleMessage()),
            'contact-receipt' === $key => $this->mailer->buildContactReceipt($this->sampleMessage()),
            default => throw new NotFoundHttpException('Aperçu introuvable.'),
        };
    }

    /** La dernière commande réglée, sinon une commande construite en mémoire. */
    private function sampleOrder(): Order
    {
        $order = $this->orders->findPaidForAdmin(null, null, 1)[0] ?? null;
        if ($order) {
            return $order;
        }
        $product = $this->products->findOneBy(['slug' => 'couronne-i']) ?? throw new NotFoundHttpException('Catalogue vide : chargez les fixtures.');
        $order = new Order();
        $order->setReference('NX-2026-0042');
        $order->setCustomer('theo@exemple.fr', 'Théo', 'Michel');
        $order->setShippingAddress('12 rue des Veilleurs', '10000', 'Troyes', 'France');
        $order->setAmounts('colissimo', 0, 14000, 1400, 'NUIT10', 12600);
        $item = new OrderItem($order, $product, $product->getName(), 'Argent rhodié', 57, 1, 14000);
        $item->setSerials([42]);
        $order->addItem($item);
        $order->markPaid('card');

        return $order;
    }

    private function sampleMessage(): ContactMessage
    {
        return new ContactMessage('Inès', 'Roche', 'ines.roche@exemple.fr', 'sur-mesure', "Bonsoir,\nUne Couronne I en taille 66, est-ce possible ? Je la voudrais en argent oxydé.\nMerci !");
    }
}
