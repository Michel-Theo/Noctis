<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/** Ligne de commande : nom et prix figés au moment de l'achat. */
#[ORM\Entity]
class OrderItem
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /** @var list<int> Numéros dans la série (N° 001 / 150…), attribués au paiement. */
    #[ORM\Column(type: Types::JSON)]
    private array $serials = [];

    public function __construct(
        #[ORM\ManyToOne(inversedBy: 'items')]
        #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
        private Order $order,
        #[ORM\ManyToOne]
        #[ORM\JoinColumn(nullable: false)]
        private Product $product,
        #[ORM\Column(length: 120)]
        private string $name,
        #[ORM\Column(length: 40)]
        private string $finish,
        #[ORM\Column]
        private int $size,
        #[ORM\Column]
        private int $quantity,
        #[ORM\Column]
        private int $unitPrice,
    ) {
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getOrder(): Order
    {
        return $this->order;
    }

    public function getProduct(): Product
    {
        return $this->product;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getFinish(): string
    {
        return $this->finish;
    }

    public function getSize(): int
    {
        return $this->size;
    }

    public function getQuantity(): int
    {
        return $this->quantity;
    }

    public function getUnitPrice(): int
    {
        return $this->unitPrice;
    }

    public function getTotal(): int
    {
        return $this->unitPrice * $this->quantity;
    }

    /** @return list<int> */
    public function getSerials(): array
    {
        return $this->serials;
    }

    /** @param list<int> $serials */
    public function setSerials(array $serials): void
    {
        $this->serials = $serials;
    }
}
