<?php

namespace App\Tests\Api;

use App\Entity\ResetPasswordRequest;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/** E-mails de la marque, mot de passe oublié et aperçus du back-office. */
final class EmailTest extends ApiTestCase
{
    private const PASSWORD = 'veilleur-2026';
    private const CARD = ['method' => 'card', 'cardNumber' => '4242 4242 4242 4242', 'expiry' => '12/40', 'cvc' => '123'];

    private function em(): EntityManagerInterface
    {
        return static::getContainer()->get(EntityManagerInterface::class);
    }

    private function user(string $email = 'ana@exemple.fr', bool $admin = false): User
    {
        $user = new User($email, 'Ana', 'Vey');
        $user->setPassword(static::getContainer()->get(UserPasswordHasherInterface::class)->hashPassword($user, self::PASSWORD));
        if ($admin) {
            $user->setRoles(['ROLE_ADMIN']);
        }
        $this->em()->persist($user);
        $this->em()->flush();

        return $user;
    }

    private function signIn(string $email, string $password = self::PASSWORD): int
    {
        return $this->api('POST', '/auth/login', ['email' => $email, 'password' => $password])[0];
    }

    /** @return array{reference: string, token: string} */
    private function paidOrder(): array
    {
        [, $order] = $this->api('POST', '/orders', $this->orderPayload());
        [$status] = $this->api('POST', "/orders/{$order['reference']}/pay?token={$order['token']}", self::CARD);
        self::assertSame(200, $status);

        return $order;
    }

    /** Jeton du lien envoyé par le dernier e-mail de réinitialisation. */
    private function tokenFromMail(): string
    {
        $email = self::getMailerMessage();
        self::assertInstanceOf(Email::class, $email);
        self::assertSame(1, preg_match('#reinitialiser\?token=([a-f0-9]+)#', (string) $email->getTextBody(), $m));

        return $m[1];
    }

    public function testPaymentSendsTheOrderConfirmation(): void
    {
        $order = $this->paidOrder();

        self::assertEmailCount(1);
        $email = self::getMailerMessage();
        self::assertEmailAddressContains($email, 'To', 'theo@exemple.fr');
        self::assertEmailHeaderSame($email, 'Subject', 'Votre relique est en route — '.$order['reference']);
        self::assertEmailTextBodyContains($email, 'N° 001 / 150');
        self::assertEmailHtmlBodyContains($email, 'Votre relique');
        self::assertEmailHtmlBodyContains($email, '/commande/confirmation/'.$order['reference'].'?token='.$order['token']);
        self::assertEmailTextBodyContains($email, 'Total TTC');
    }

    public function testEachFabricationStepSendsAnEmail(): void
    {
        $order = $this->paidOrder();
        $this->user('atelier@noctis.example', admin: true);
        $this->signIn('atelier@noctis.example');

        $this->api('POST', '/admin/orders/advance', ['references' => [$order['reference']]]);
        self::assertEmailCount(1);
        self::assertEmailHeaderSame(self::getMailerMessage(), 'Subject', 'Votre pièce est coulée');

        $this->api('POST', '/admin/orders/advance', ['references' => [$order['reference']]]);
        self::assertEmailHeaderSame(self::getMailerMessage(), 'Subject', 'Polie et rhodiée');
    }

    public function testForgotPasswordNeverRevealsWhetherTheAccountExists(): void
    {
        $this->user();

        [$status] = $this->api('POST', '/auth/forgot', ['email' => 'ana@exemple.fr']);
        self::assertSame(204, $status);
        self::assertEmailCount(1);
        self::assertEmailHeaderSame(self::getMailerMessage(), 'Subject', 'Réinitialiser votre mot de passe');

        [$status] = $this->api('POST', '/auth/forgot', ['email' => 'inconnu@exemple.fr']);
        self::assertSame(204, $status);
        self::assertEmailCount(0);
    }

    public function testForgotPasswordIsRateLimited(): void
    {
        for ($i = 0; $i < 3; ++$i) {
            self::assertSame(204, $this->api('POST', '/auth/forgot', ['email' => 'x@exemple.fr'])[0]);
        }
        [$status, $body] = $this->api('POST', '/auth/forgot', ['email' => 'x@exemple.fr']);

        self::assertSame(429, $status);
        self::assertSame('Trop de demandes. Réessayez dans quelques minutes.', $body['error']);
    }

    public function testResetChangesThePasswordOnce(): void
    {
        $this->user();
        $this->api('POST', '/auth/forgot', ['email' => 'ana@exemple.fr']);
        $token = $this->tokenFromMail();

        [$status, $body] = $this->api('POST', '/auth/reset', ['token' => $token, 'password' => 'court']);
        self::assertSame(422, $status);
        self::assertArrayHasKey('password', $body['violations']);

        self::assertSame(204, $this->api('POST', '/auth/reset', ['token' => $token, 'password' => 'une-nuit-sans-fin'])[0]);
        self::assertSame(200, $this->signIn('ana@exemple.fr', 'une-nuit-sans-fin'));

        [$status, $body] = $this->api('POST', '/auth/reset', ['token' => $token, 'password' => 'encore-une-nuit']);
        self::assertSame(422, $status, 'un lien ne sert qu’une fois');
        self::assertSame("Ce lien n'est plus valable. Demandez-en un nouveau.", $body['violations']['token']);
    }

    public function testExpiredOrForgedLinksAreRefused(): void
    {
        $this->user();
        $this->api('POST', '/auth/forgot', ['email' => 'ana@exemple.fr']);
        $token = $this->tokenFromMail();

        $forged = substr($token, 0, 20).str_repeat('0', 32);
        self::assertSame(422, $this->api('POST', '/auth/reset', ['token' => $forged, 'password' => 'une-nuit-sans-fin'])[0]);

        $em = $this->em();
        $em->clear();
        $em->getRepository(ResetPasswordRequest::class)->findOneBy(['selector' => substr($token, 0, 20)])->expireAt(new \DateTimeImmutable('-1 minute'));
        $em->flush();
        self::assertSame(422, $this->api('POST', '/auth/reset', ['token' => $token, 'password' => 'une-nuit-sans-fin'])[0]);
    }

    public function testContactSendsTheMessageAndAReceipt(): void
    {
        $this->api('POST', '/contact', ['firstName' => 'Inès', 'lastName' => 'Roche', 'email' => 'ines@exemple.fr', 'subject' => 'sur-mesure', 'message' => 'Une Couronne I en taille 66 ?']);

        self::assertEmailCount(2);
        [$toAtelier, $receipt] = self::getMailerMessages();
        self::assertEmailAddressContains($toAtelier, 'To', 'atelier@noctis.example');
        self::assertEmailAddressContains($toAtelier, 'Reply-To', 'ines@exemple.fr');
        self::assertEmailHeaderSame($toAtelier, 'Subject', 'Nouveau message — Sur mesure — Inès Roche');
        self::assertEmailAddressContains($receipt, 'To', 'ines@exemple.fr');
        self::assertEmailHeaderSame($receipt, 'Subject', 'Votre message est bien arrivé');
    }

    public function testPreviewsAreForTheAtelierOnly(): void
    {
        self::assertSame(401, $this->api('GET', '/admin/emails')[0]);

        $this->user();
        $this->signIn('ana@exemple.fr');
        self::assertSame(403, $this->api('GET', '/admin/emails')[0]);

        $this->user('atelier@noctis.example', admin: true);
        $this->signIn('atelier@noctis.example');
        [$status, $list] = $this->api('GET', '/admin/emails');
        self::assertSame(200, $status);
        self::assertCount(8, $list);
        self::assertSame('Votre pièce est coulée', array_column($list, 'subject', 'key')['fabrication-cast']);

        $this->client->request('GET', '/api/admin/emails/fabrication-shipped');
        self::assertResponseIsSuccessful();
        self::assertStringContainsString('Votre relique est en chemin.', (string) $this->client->getResponse()->getContent());
        self::assertSame(404, $this->api('GET', '/admin/emails/inconnu')[0]);
        self::assertEmailCount(0);
    }
}
