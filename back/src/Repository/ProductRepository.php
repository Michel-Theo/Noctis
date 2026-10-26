<?php

namespace App\Repository;

use App\Entity\Product;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<Product> */
class ProductRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Product::class);
    }

    /**
     * Produits indexés par slug.
     *
     * @param list<string> $slugs
     *
     * @return array<string, Product>
     */
    public function findBySlugs(array $slugs): array
    {
        $out = [];
        foreach ($this->findBy(['slug' => array_values(array_unique($slugs))]) as $p) {
            $out[$p->getSlug()] = $p;
        }

        return $out;
    }
}
