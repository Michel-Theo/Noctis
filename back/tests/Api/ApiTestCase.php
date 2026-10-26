<?php

namespace App\Tests\Api;

use App\DataFixtures\AppFixtures;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/** Base SQLite de test recréée à chaque test, catalogue chargé. */
abstract class ApiTestCase extends WebTestCase
{
    protected KernelBrowser $client;

    protected const ITEM = ['slug' => 'couronne-i', 'finish' => 'Argent rhodié', 'size' => 57, 'quantity' => 1];

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $tool = new SchemaTool($em);
        $meta = $em->getMetadataFactory()->getAllMetadata();
        $tool->dropSchema($meta);
        $tool->createSchema($meta);
        (new AppFixtures())->load($em);
        // Le limiteur de connexion est stocké sur disque : on repart de zéro à chaque test.
        static::getContainer()->get('cache.rate_limiter')->clear();
    }

    /** @return array{0: int, 1: array<string, mixed>} */
    protected function api(string $method, string $uri, ?array $body = null): array
    {
        $this->client->request($method, '/api'.$uri, server: ['CONTENT_TYPE' => 'application/json'], content: null === $body ? null : json_encode($body));
        $response = $this->client->getResponse();

        return [$response->getStatusCode(), json_decode((string) $response->getContent(), true)];
    }

    /** @return array<string, mixed> */
    protected function orderPayload(array $overrides = []): array
    {
        return $overrides + [
            'email' => 'theo@exemple.fr',
            'firstName' => 'Théo',
            'lastName' => 'Michel',
            'address' => '12 rue des Veilleurs',
            'postalCode' => '10000',
            'city' => 'Troyes',
            'country' => 'France',
            'shipping' => 'colissimo',
            'items' => [self::ITEM],
        ];
    }
}
