<?php

namespace App\Tests\Api;

final class OrderTest extends ApiTestCase
{
    private const CARD_OK = ['method' => 'card', 'cardNumber' => '4242 4242 4242 4242', 'expiry' => '12/40', 'cvc' => '123'];

    /** @return array{reference: string, token: string, total: int, status: string} */
    private function createOrder(array $overrides = []): array
    {
        [$status, $order] = $this->api('POST', '/orders', $this->orderPayload($overrides));
        self::assertSame(201, $status);

        return $order;
    }

    public function testCreatesPendingOrderAtCatalogPrice(): void
    {
        $order = $this->createOrder(['shipping' => 'chronopost']);

        self::assertMatchesRegularExpression('/^NX-\d{4}-0001$/', $order['reference']);
        self::assertSame(15200, $order['total']);
        self::assertSame('pending', $order['status']);
        self::assertSame('0002', substr($this->createOrder()['reference'], -4));
    }

    public function testInvalidCustomerReturnsFrenchViolations(): void
    {
        [$status, $body] = $this->api('POST', '/orders', $this->orderPayload(['email' => 'pas-un-mail', 'city' => '']));

        self::assertSame(422, $status);
        self::assertSame('Validation', $body['error']);
        self::assertSame("Cet e-mail n'est pas valide.", $body['violations']['email']);
        self::assertArrayHasKey('city', $body['violations']);
    }

    public function testCardPaymentSucceeds(): void
    {
        $order = $this->createOrder();
        [$status, $paid] = $this->api('POST', "/orders/{$order['reference']}/pay?token={$order['token']}", self::CARD_OK);

        self::assertSame(200, $status);
        self::assertSame('paid', $paid['status']);
        self::assertNotNull($paid['paidAt']);
        self::assertSame(['ordered', 'cast', 'polished', 'shipped'], array_column($paid['timeline'], 'key'));
        self::assertSame([true, false, false, false], array_column($paid['timeline'], 'done'));
    }

    public function testDeclinedCardKeepsOrderPending(): void
    {
        $order = $this->createOrder();
        $uri = "/orders/{$order['reference']}";

        [$status, $body] = $this->api('POST', "$uri/pay?token={$order['token']}", ['cardNumber' => '4000 0000 0000 0002'] + self::CARD_OK);
        self::assertSame(402, $status);
        self::assertSame('Carte refusée.', $body['error']);
        self::assertSame('pending', $this->api('GET', "$uri?token={$order['token']}")[1]['status']);
    }

    public function testInvalidCardDetails(): void
    {
        $order = $this->createOrder();
        [$status, $body] = $this->api('POST', "/orders/{$order['reference']}/pay?token={$order['token']}", ['method' => 'card', 'cardNumber' => '4242 4242 4242 4241', 'expiry' => '01/20', 'cvc' => '1']);

        self::assertSame(422, $status);
        self::assertSame(['cardNumber', 'expiry', 'cvc'], array_keys($body['violations']));
    }

    public function testAlreadyPaidOrderConflicts(): void
    {
        $order = $this->createOrder();
        $uri = "/orders/{$order['reference']}/pay?token={$order['token']}";

        self::assertSame(200, $this->api('POST', $uri, ['method' => 'paypal'])[0]);
        self::assertSame(409, $this->api('POST', $uri, self::CARD_OK)[0]);
    }

    public function testWrongTokenHidesOrder(): void
    {
        $order = $this->createOrder();

        self::assertSame(404, $this->api('GET', "/orders/{$order['reference']}?token=faux")[0]);
        self::assertSame(404, $this->api('GET', "/orders/{$order['reference']}")[0]);
        self::assertSame(404, $this->api('POST', "/orders/{$order['reference']}/pay?token=faux", self::CARD_OK)[0]);
    }
}
