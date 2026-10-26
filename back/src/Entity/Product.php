<?php

namespace App\Entity;

use App\Repository\ProductRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ProductRepository::class)]
class Product
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /** Pièces déjà numérotées (vendues) sur les editionTotal de la série. */
    #[ORM\Column(options: ['default' => 0])]
    private int $editionSold = 0;

    /**
     * @param list<string> $finishes
     * @param list<int>    $sizes
     */
    public function __construct(
        #[ORM\Column(length: 80, unique: true)]
        private string $slug,
        #[ORM\Column(length: 120)]
        private string $name,
        #[ORM\Column(length: 80)]
        private string $collection,
        /** Prix en centimes ; null = pièce « en forge », pas encore en vente. */
        #[ORM\Column(nullable: true)]
        private ?int $price = null,
        #[ORM\Column]
        private int $editionTotal = 150,
        #[ORM\Column(type: Types::JSON)]
        private array $finishes = [],
        #[ORM\Column(type: Types::JSON)]
        private array $sizes = [],
    ) {
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSlug(): string
    {
        return $this->slug;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getCollection(): string
    {
        return $this->collection;
    }

    public function getPrice(): ?int
    {
        return $this->price;
    }

    public function isAvailable(): bool
    {
        return null !== $this->price;
    }

    public function getEditionTotal(): int
    {
        return $this->editionTotal;
    }

    /** @return list<string> */
    public function getFinishes(): array
    {
        return $this->finishes;
    }

    /** @return list<int> */
    public function getSizes(): array
    {
        return $this->sizes;
    }

    public function getEditionSold(): int
    {
        return $this->editionSold;
    }

    /** Pièces encore disponibles dans la série. */
    public function getRemaining(): int
    {
        return max(0, $this->editionTotal - $this->editionSold);
    }

    /**
     * Attribue les prochains numéros de la série (à appeler sous verrou).
     *
     * @return list<int>
     */
    public function takeSerials(int $quantity): array
    {
        if ($quantity > $this->getRemaining()) {
            throw new \LogicException('Série épuisée.');
        }
        $first = $this->editionSold + 1;
        $this->editionSold += $quantity;

        return range($first, $this->editionSold);
    }
}
