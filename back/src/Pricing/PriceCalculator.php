<?php

namespace App\Pricing;

use App\Dto\CartItemInput;
use App\Repository\ProductRepository;

/** Recalcule le panier à partir du catalogue : les prix envoyés par le client ne comptent jamais. */
final class PriceCalculator
{
    /** Codes promo : code => [libellé, pourcentage]. */
    private const CODES = [
        'NUIT10' => ['Code de la nuit −10 %', 10],
    ];

    public function __construct(private readonly ProductRepository $products)
    {
    }

    /**
     * @param list<CartItemInput> $items
     */
    public function quote(array $items, string $shippingMethod, ?string $code = null): Quote
    {
        $catalog = $this->products->findBySlugs(array_map(static fn (CartItemInput $i) => $i->slug, $items));
        $lines = [];
        $wanted = [];
        $subtotal = 0;

        foreach ($items as $item) {
            $product = $catalog[$item->slug] ?? throw new PricingException(\sprintf('Pièce inconnue : %s.', $item->slug));
            if (!$product->isPublished()) {
                throw new PricingException(\sprintf('%s n\'est pas en vente.', $product->getName()));
            }
            if (null === $product->getPrice()) {
                throw new PricingException(\sprintf('%s est encore en forge.', $product->getName()));
            }
            if (!\in_array($item->finish, $product->getFinishes(), true)) {
                throw new PricingException(\sprintf('Finition indisponible pour %s.', $product->getName()));
            }
            if (!\in_array($item->size, $product->getSizes(), true)) {
                throw new PricingException(\sprintf('Taille %d indisponible pour %s.', $item->size, $product->getName()));
            }

            // Série limitée : plusieurs lignes d'une même pièce comptent ensemble.
            $wanted[$item->slug] = ($wanted[$item->slug] ?? 0) + $item->quantity;
            if ($wanted[$item->slug] > $product->getRemaining()) {
                throw new PricingException(0 === $product->getRemaining()
                    ? \sprintf('%s est épuisée.', $product->getName())
                    : \sprintf('%s : plus que %d pièce%s dans la série.', $product->getName(), $product->getRemaining(), $product->getRemaining() > 1 ? 's' : ''));
            }

            $total = $product->getPrice() * $item->quantity;
            $subtotal += $total;
            $lines[] = [
                'product' => $product,
                'finish' => $item->finish,
                'size' => $item->size,
                'quantity' => $item->quantity,
                'unitPrice' => $product->getPrice(),
                'total' => $total,
            ];
        }

        [$discount, $codeInfo] = $this->discount($code, $subtotal);
        $shipping = Shipping::cost($shippingMethod, $subtotal);

        return new Quote($lines, $shippingMethod, $subtotal, $shipping, $discount, $subtotal - $discount + $shipping, $codeInfo);
    }

    /** @return array{0: int, 1: array{code: string, label: string, valid: bool}|null} */
    private function discount(?string $code, int $subtotal): array
    {
        $code = strtoupper(trim((string) $code));
        if ('' === $code) {
            return [0, null];
        }
        if (!isset(self::CODES[$code])) {
            return [0, ['code' => $code, 'label' => 'Code inconnu', 'valid' => false]];
        }
        [$label, $percent] = self::CODES[$code];

        return [(int) round($subtotal * $percent / 100), ['code' => $code, 'label' => $label, 'valid' => true]];
    }
}
