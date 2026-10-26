<?php

namespace App\DataFixtures;

use App\Entity\Product;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

/** Catalogue NOCTIS, aligné sur front/src/data/products.ts. */
final class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $finishes = ['Argent rhodié', 'Argent oxydé'];
        $sizes = [52, 54, 56, 57, 58, 60, 62, 64];

        $catalog = [
            new Product('couronne-i', 'Couronne I', 'Nocturne', 14000, 150, $finishes, $sizes),
            // Pièces « en forge » : visibles, pas encore en vente.
            new Product('couronne-ii', 'Couronne II', 'Nocturne', null, 150, $finishes, $sizes),
            new Product('spina', 'Spina', 'Nocturne', null, 150, $finishes, $sizes),
            new Product('vigile', 'Vigile', 'Nocturne', null, 150, $finishes, $sizes),
            new Product('chaine-veille', 'Chaîne Veille', 'Nocturne', null, 150, ['Argent 925'], []),
        ];
        foreach ($catalog as $p) {
            $manager->persist($p);
        }
        $manager->flush();
    }
}
