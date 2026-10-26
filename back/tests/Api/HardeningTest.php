<?php

namespace App\Tests\Api;

use App\Repository\OrderRepository;

/** Code saisi pendant le tunnel, limites et concurrence. */
final class HardeningTest extends ApiTestCase
{
    public function testCodeCanBeAppliedAndRemovedOnPendingOrder(): void
    {
        [, $order] = $this->api('POST', '/orders', $this->orderPayload());
        $uri = "/orders/{$order['reference']}/code?token={$order['token']}";
        self::assertSame(14690, $order['total']);

        [$status, $quote] = $this->api('POST', $uri, ['code' => ' nuit10 ']);
        self::assertSame(200, $status);
        self::assertSame(1400, $quote['discount']);
        self::assertSame(13290, $quote['total']);
        self::assertTrue($quote['code']['valid']);

        [, $quote] = $this->api('POST', $uri, ['code' => null]);
        self::assertSame(14690, $quote['total']);

        $this->api('POST', $uri, ['code' => 'NUIT10']);
        [, $paid] = $this->api('POST', "/orders/{$order['reference']}/pay?token={$order['token']}", ['method' => 'paypal']);
        self::assertSame(13290, $paid['total']);

        [$status] = $this->api('POST', $uri, ['code' => null]);
        self::assertSame(409, $status);
    }

    public function testCodeNeedsTheToken(): void
    {
        [, $order] = $this->api('POST', '/orders', $this->orderPayload());
        [$status] = $this->api('POST', "/orders/{$order['reference']}/code?token=faux", ['code' => 'NUIT10']);

        self::assertSame(404, $status);
    }

    public function testOnlyOnePaymentCanClaimTheOrder(): void
    {
        [, $created] = $this->api('POST', '/orders', $this->orderPayload());
        $orders = static::getContainer()->get(OrderRepository::class);
        $order = $orders->findOneByReferenceAndToken($created['reference'], $created['token']);

        self::assertTrue($orders->claimForPayment($order));
        self::assertFalse($orders->claimForPayment($order), 'un second paiement simultané doit être refusé');
        $orders->releasePayment($order);
        self::assertTrue($orders->claimForPayment($order), 'après un échec, la commande redevient payable');
    }

    public function testCartIsLimitedToTenLines(): void
    {
        [$status, $body] = $this->api('POST', '/quote', ['items' => array_fill(0, 11, self::ITEM)]);

        self::assertSame(422, $status);
        self::assertSame('Dix lignes au plus par commande.', $body['violations']['items']);
    }

    public function testFrameworkMessagesAreFrench(): void
    {
        [$status, $body] = $this->api('POST', '/quote', ['items' => [['quantity' => '2'] + self::ITEM]]);

        self::assertSame(422, $status);
        self::assertStringNotContainsString('This value', $body['violations']['items[0].quantity']);
    }
}
