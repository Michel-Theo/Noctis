<?php

namespace App\Pricing;

use App\Entity\Product;

/** Résultat du calcul : tout est en centimes, TVA incluse. */
final readonly class Quote
{
    /**
     * @param list<array{product: Product, finish: string, size: int, quantity: int, unitPrice: int, total: int}> $lines
     * @param array{code: string, label: string, valid: bool}|null                                                $code
     */
    public function __construct(
        public array $lines,
        public string $shippingMethod,
        public int $subtotal,
        public int $shipping,
        public int $discount,
        public int $total,
        public ?array $code,
    ) {
    }

    /** TVA à 20 % comprise dans le total. */
    public function tax(): int
    {
        return (int) round($this->total / 6);
    }

    public function validCode(): ?string
    {
        return ($this->code['valid'] ?? false) ? $this->code['code'] : null;
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'lines' => array_map(static fn (array $l) => [
                'slug' => $l['product']->getSlug(),
                'name' => $l['product']->getName(),
                'finish' => $l['finish'],
                'size' => $l['size'],
                'quantity' => $l['quantity'],
                'unitPrice' => $l['unitPrice'],
                'total' => $l['total'],
            ], $this->lines),
            'subtotal' => $this->subtotal,
            'shipping' => $this->shipping,
            'discount' => $this->discount,
            'tax' => $this->tax(),
            'total' => $this->total,
            'freeShippingFrom' => Shipping::FREE_FROM,
            'code' => $this->code,
        ];
    }
}
