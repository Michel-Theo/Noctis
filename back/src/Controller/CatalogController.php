<?php

namespace App\Controller;

use App\Dto\QuoteInput;
use App\Entity\Product;
use App\Pricing\PriceCalculator;
use App\Repository\ProductRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api')]
final class CatalogController extends AbstractController
{
    #[Route('/products', methods: ['GET'])]
    public function products(ProductRepository $products): JsonResponse
    {
        return $this->json(array_map(static fn (Product $p) => [
            'slug' => $p->getSlug(),
            'name' => $p->getName(),
            'collection' => $p->getCollection(),
            'price' => $p->getPrice(),
            'available' => $p->isAvailable(),
            'editionTotal' => $p->getEditionTotal(),
            'finishes' => $p->getFinishes(),
            'sizes' => $p->getSizes(),
        ], $products->findBy([], ['id' => 'ASC'])));
    }

    /** Totaux du panier recalculés côté serveur (livraison, code, TVA). */
    #[Route('/quote', methods: ['POST'])]
    public function quote(#[MapRequestPayload] QuoteInput $input, PriceCalculator $calculator): JsonResponse
    {
        return $this->json($calculator->quote($input->items, $input->shipping, $input->code)->toArray());
    }
}
