<?php

namespace App\Tests\Api;

final class CatalogTest extends ApiTestCase
{
    public function testProductsListPiecesOnSale(): void
    {
        [$status, $products] = $this->api('GET', '/products');

        self::assertSame(200, $status);
        self::assertCount(5, $products);
        self::assertSame(['couronne-i', 'spina'], array_values(array_column(array_filter($products, fn ($p) => $p['available']), 'slug')));
    }

    public function testQuoteUnderThresholdPaysColissimo(): void
    {
        [$status, $q] = $this->api('POST', '/quote', ['items' => [self::ITEM]]);

        self::assertSame(200, $status);
        self::assertSame(14000, $q['subtotal']);
        self::assertSame(690, $q['shipping']);
        self::assertSame(14690, $q['total']);
        self::assertSame(2448, $q['tax']);
        self::assertNull($q['code']);
    }

    public function testQuoteFreeShippingAndNightCode(): void
    {
        [, $q] = $this->api('POST', '/quote', ['items' => [['quantity' => 2] + self::ITEM], 'code' => 'nuit10']);

        self::assertSame(28000, $q['subtotal']);
        self::assertSame(0, $q['shipping']);
        self::assertSame(2800, $q['discount']);
        self::assertSame(25200, $q['total']);
        self::assertTrue($q['code']['valid']);
    }

    public function testUnknownCodeIsNotAnError(): void
    {
        [$status, $q] = $this->api('POST', '/quote', ['items' => [self::ITEM], 'code' => 'FAUX', 'shipping' => 'chronopost']);

        self::assertSame(200, $status);
        self::assertFalse($q['code']['valid']);
        self::assertSame(1200, $q['shipping']);
    }

    public function testRejectsForgedPieceSizeAndQuantity(): void
    {
        self::assertSame(422, $this->api('POST', '/quote', ['items' => [['slug' => 'vigile'] + self::ITEM]])[0]);
        self::assertSame(422, $this->api('POST', '/quote', ['items' => [['size' => 50] + self::ITEM]])[0]);
        self::assertSame(422, $this->api('POST', '/quote', ['items' => [['finish' => 'Or'] + self::ITEM]])[0]);

        [$status, $body] = $this->api('POST', '/quote', ['items' => [['quantity' => 9] + self::ITEM]]);
        self::assertSame(422, $status);
        self::assertArrayHasKey('items[0].quantity', $body['violations']);
    }
}
