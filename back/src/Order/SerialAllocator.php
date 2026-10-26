<?php

namespace App\Order;

use App\Entity\Order;
use App\Entity\Product;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Numérote les pièces d'une commande payée (N° 001 / 150…) et enregistre le paiement.
 * Les lignes produit sont verrouillées (SELECT … FOR UPDATE) : deux paiements simultanés
 * ne peuvent ni recevoir le même numéro ni dépasser la série.
 */
final class SerialAllocator
{
    public function __construct(private readonly EntityManagerInterface $em)
    {
    }

    /** @throws SoldOutException s'il ne reste plus assez de pièces au moment de numéroter */
    public function allocate(Order $order): void
    {
        $conn = $this->em->getConnection();
        $conn->beginTransaction();
        try {
            $wanted = [];
            foreach ($order->getItems() as $item) {
                $id = $item->getProduct()->getId();
                $wanted[$id] = ($wanted[$id] ?? 0) + $item->getQuantity();
            }
            // Verrou dans un ordre fixe (id croissant) : pas d'interblocage entre deux commandes.
            ksort($wanted);
            $products = [];
            foreach ($wanted as $id => $quantity) {
                // Relu sous verrou : la valeur en mémoire peut dater d'avant un autre paiement.
                $product = $this->em->find(Product::class, $id);
                $this->em->refresh($product, LockMode::PESSIMISTIC_WRITE);
                if ($quantity > $product->getRemaining()) {
                    throw new SoldOutException();
                }
                $products[$id] = $product;
            }
            foreach ($order->getItems() as $item) {
                $item->setSerials($products[$item->getProduct()->getId()]->takeSerials($item->getQuantity()));
            }
            $this->em->flush();
            $conn->commit();
        } catch (\Throwable $e) {
            $conn->rollBack();
            throw $e;
        }
    }
}
