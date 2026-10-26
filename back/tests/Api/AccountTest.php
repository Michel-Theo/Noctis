<?php

namespace App\Tests\Api;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Component\Console\Tester\CommandTester;

/** Comptes clients : inscription, session, commandes du compte, séries limitées. */
final class AccountTest extends ApiTestCase
{
    private const PASSWORD = 'nuit-noire';
    private const CARD_OK = ['method' => 'card', 'cardNumber' => '4242424242424242', 'expiry' => '12/40', 'cvc' => '123'];

    /** @return array{0: int, 1: array<string, mixed>} */
    private function register(string $email = 'ana@exemple.fr'): array
    {
        return $this->api('POST', '/auth/register', ['email' => $email, 'password' => self::PASSWORD, 'firstName' => 'Ana', 'lastName' => 'Vey']);
    }

    /** Crée et règle une commande ; renvoie [référence, jeton]. */
    private function paidOrder(int $quantity = 1): array
    {
        [, $order] = $this->api('POST', '/orders', $this->orderPayload(['items' => [['quantity' => $quantity] + self::ITEM]]));
        [$status] = $this->api('POST', "/orders/{$order['reference']}/pay?token={$order['token']}", self::CARD_OK);
        self::assertSame(200, $status);

        return [$order['reference'], $order['token']];
    }

    private function setEditionSold(int $sold): void
    {
        static::getContainer()->get(EntityManagerInterface::class)
            ->createQuery('UPDATE App\Entity\Product p SET p.editionSold = :n WHERE p.slug = :slug')
            ->execute(['n' => $sold, 'slug' => 'couronne-i']);
        // Le produit déjà chargé en mémoire serait périmé.
        static::getContainer()->get(EntityManagerInterface::class)->clear();
    }

    public function testRegisterOpensASession(): void
    {
        [$status, $user] = $this->register('Ana@Exemple.fr');
        self::assertSame(201, $status);
        self::assertSame('ana@exemple.fr', $user['email']);

        [$status, $me] = $this->api('GET', '/me');
        self::assertSame(200, $status);
        self::assertSame(['email', 'firstName', 'lastName', 'createdAt', 'admin'], array_keys($me));
        self::assertFalse($me['admin']);
    }

    public function testRegisterRefusesTakenEmailAndShortPassword(): void
    {
        $this->register();
        $this->api('POST', '/auth/logout');

        [$status, $body] = $this->register('ANA@exemple.fr');
        self::assertSame(422, $status);
        self::assertSame('Un compte existe déjà avec cet e-mail.', $body['violations']['email']);

        [$status, $body] = $this->api('POST', '/auth/register', ['email' => 'bo@exemple.fr', 'password' => 'court', 'firstName' => 'Bo', 'lastName' => 'Lu']);
        self::assertSame(422, $status);
        self::assertSame('8 caractères au moins.', $body['violations']['password']);
    }

    public function testLoginAndLogout(): void
    {
        $this->register();
        [$status, $body] = $this->api('POST', '/auth/logout');
        self::assertSame(204, $status);
        self::assertSame([401, ['error' => 'Non connecté.']], $this->api('GET', '/me'));

        [$status, $body] = $this->api('POST', '/auth/login', ['email' => 'ana@exemple.fr', 'password' => 'mauvais']);
        self::assertSame(401, $status);
        self::assertSame('E-mail ou mot de passe incorrect.', $body['error']);

        [$status, $user] = $this->api('POST', '/auth/login', ['email' => 'ana@exemple.fr', 'password' => self::PASSWORD]);
        self::assertSame(200, $status);
        self::assertSame('Ana', $user['firstName']);
        self::assertSame(200, $this->api('GET', '/me')[0]);
    }

    public function testRememberMeSetsALongLivedCookie(): void
    {
        $this->register();
        $this->api('POST', '/auth/logout');

        $this->api('POST', '/auth/login', ['email' => 'ana@exemple.fr', 'password' => self::PASSWORD]);
        self::assertNull($this->client->getCookieJar()->get('REMEMBERME'));

        $this->api('POST', '/auth/login', ['email' => 'ana@exemple.fr', 'password' => self::PASSWORD, 'remember' => true]);
        self::assertNotNull($this->client->getCookieJar()->get('REMEMBERME'));
    }

    public function testLoginIsThrottledAfterFiveAttempts(): void
    {
        $this->register();
        $this->api('POST', '/auth/logout');

        for ($i = 0; $i < 5; ++$i) {
            self::assertSame(401, $this->api('POST', '/auth/login', ['email' => 'ana@exemple.fr', 'password' => 'mauvais'])[0]);
        }
        [$status, $body] = $this->api('POST', '/auth/login', ['email' => 'ana@exemple.fr', 'password' => self::PASSWORD]);
        self::assertSame(429, $status);
        self::assertSame('Trop de tentatives. Réessayez dans une minute.', $body['error']);
    }

    public function testAccountRoutesNeedASession(): void
    {
        self::assertSame([401, ['error' => 'Non connecté.']], $this->api('GET', '/me/orders'));
    }

    public function testPaidOrdersOfTheAccountAreListed(): void
    {
        $this->register();
        [$reference] = $this->paidOrder(2);
        // Commande non réglée : jamais listée.
        $this->api('POST', '/orders', $this->orderPayload());

        [$status, $account] = $this->api('GET', '/me/orders');
        self::assertSame(200, $status);
        self::assertSame([], $account['history']);

        $current = $account['current'];
        self::assertSame($reference, $current['reference']);
        self::assertSame('paid', $current['status']);
        self::assertSame('En cours de fonte', $current['statusLabel']);
        self::assertSame([1, 2], $current['lines'][0]['serials']);
        self::assertSame(['ordered', 'cast', 'polished', 'shipped', 'delivered'], array_column($current['timeline'], 'key'));
        self::assertSame([true, false, false, false, false], array_column($current['timeline'], 'done'));
        self::assertSame([false, true, false, false, false], array_column($current['timeline'], 'current'));

        self::assertSame([1, 2], array_column($account['pieces'], 'serial'));
        self::assertSame($reference, $account['pieces'][0]['orderReference']);
        self::assertSame(150, $account['pieces'][0]['editionTotal']);
    }

    public function testGuestOrdersStayOutOfAccounts(): void
    {
        $this->register();
        $this->api('POST', '/auth/logout');
        // Même e-mail, mais passée sans être connecté : pas de rattachement.
        $this->paidOrder();

        $this->api('POST', '/auth/login', ['email' => 'ana@exemple.fr', 'password' => self::PASSWORD]);
        [, $account] = $this->api('GET', '/me/orders');
        self::assertNull($account['current']);
        self::assertSame([], $account['pieces']);
    }

    public function testSerialsFollowEachOtherAcrossOrders(): void
    {
        [$first, $token] = $this->paidOrder(2);
        [$second, $token2] = $this->paidOrder();

        self::assertSame([1, 2], $this->api('GET', "/orders/$first?token=$token")[1]['lines'][0]['serials']);
        self::assertSame([3], $this->api('GET', "/orders/$second?token=$token2")[1]['lines'][0]['serials']);
    }

    public function testLimitedEditionRefusesTooManyPieces(): void
    {
        $this->setEditionSold(149);
        [$status, $body] = $this->api('POST', '/quote', ['items' => [['quantity' => 2] + self::ITEM]]);
        self::assertSame(422, $status);
        self::assertSame('Couronne I : plus que 1 pièce dans la série.', $body['error']);

        $this->setEditionSold(150);
        [$status, $body] = $this->api('POST', '/quote', ['items' => [self::ITEM]]);
        self::assertSame(422, $status);
        self::assertSame('Couronne I est épuisée.', $body['error']);
    }

    public function testSoldOutDuringPaymentReleasesTheOrder(): void
    {
        $this->setEditionSold(149);
        [, $order] = $this->api('POST', '/orders', $this->orderPayload());
        // Une autre commande prend la dernière pièce entre-temps.
        $this->setEditionSold(150);

        [$status, $body] = $this->api('POST', "/orders/{$order['reference']}/pay?token={$order['token']}", self::CARD_OK);
        self::assertSame(409, $status);
        self::assertSame('La série est épuisée.', $body['error']);
        self::assertSame('pending', $this->api('GET', "/orders/{$order['reference']}?token={$order['token']}")[1]['status']);
    }

    public function testAdvanceCommandWalksThroughManufacturing(): void
    {
        $this->register();
        [$reference] = $this->paidOrder();
        $tester = new CommandTester((new Application(self::$kernel))->find('app:order:advance'));

        foreach (['cast', 'polished', 'shipped', 'delivered'] as $expected) {
            self::assertSame(0, $tester->execute(['reference' => $reference]));
            self::assertStringContainsString("→ $expected", $tester->getDisplay());
        }
        self::assertSame(1, $tester->execute(['reference' => $reference]), 'une commande livrée n\'avance plus');
        self::assertSame(1, $tester->execute(['reference' => 'NX-0000-0000']));

        [, $account] = $this->api('GET', '/me/orders');
        self::assertNull($account['current']);
        self::assertSame('Livrée', $account['history'][0]['statusLabel']);
        self::assertSame([true, true, true, true, true], array_column($account['history'][0]['timeline'], 'done'));
        self::assertSame([false, false, false, false, false], array_column($account['history'][0]['timeline'], 'current'));
    }
}
