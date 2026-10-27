<?php

namespace App\Tests\Api;

use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\Product;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/** Back-office : accès, tableau de bord, commandes, export, édition produit. */
final class AdminTest extends ApiTestCase
{
    private const PASSWORD = 'veilleur-2026';

    private function em(): EntityManagerInterface
    {
        return static::getContainer()->get(EntityManagerInterface::class);
    }

    /** Crée un compte (admin ou client) et ouvre sa session. */
    private function signIn(bool $admin = true): void
    {
        $email = $admin ? 'theo@exemple.fr' : 'ana@exemple.fr';
        $user = new User($email, $admin ? 'Théo' : 'Ana', $admin ? 'Michel' : 'Vey');
        $user->setPassword(static::getContainer()->get(UserPasswordHasherInterface::class)->hashPassword($user, self::PASSWORD));
        if ($admin) {
            $user->setRoles(['ROLE_ADMIN']);
        }
        $this->em()->persist($user);
        $this->em()->flush();
        [$status] = $this->api('POST', '/auth/login', ['email' => $email, 'password' => self::PASSWORD]);
        self::assertSame(200, $status);
    }

    /** Commande réglée de Couronne I, à une date donnée, avancée de $steps étapes. */
    private function paidOrder(string $paidAt, int $steps = 0, int $quantity = 1, string $lastName = 'Roux', string $firstName = 'Inès'): Order
    {
        $ring = $this->em()->getRepository(Product::class)->findOneBy(['slug' => 'couronne-i']);
        $order = new Order();
        $order->setReference(\sprintf('NX-TEST-%04d', $ring->getEditionSold() + 1));
        $order->setCustomer(strtolower($firstName).'@exemple.fr', $firstName, $lastName);
        $order->setShippingAddress('1 rue de la Nuit', '10000', 'Troyes', 'France');
        $subtotal = 14000 * $quantity;
        $order->setAmounts('colissimo', 0, $subtotal, 0, null, $subtotal);
        $item = new OrderItem($order, $ring, 'Couronne I', 'Argent rhodié', 57, $quantity, 14000);
        $item->setSerials($ring->takeSerials($quantity));
        $order->addItem($item);
        $order->markPaid('card', new \DateTimeImmutable($paidAt));
        for ($i = 0; $i < $steps; ++$i) {
            $order->advance();
        }
        $this->em()->persist($order);
        $this->em()->flush();

        return $order;
    }

    public function testAccessIsReservedToTheWorkshop(): void
    {
        [$status, $body] = $this->api('GET', '/admin/dashboard');
        self::assertSame(401, $status);
        self::assertSame('Non connecté.', $body['error']);

        $this->signIn(admin: false);
        [$status, $body] = $this->api('GET', '/admin/orders');
        self::assertSame(403, $status);
        self::assertSame("Accès réservé à l'atelier.", $body['error']);
        self::assertFalse($this->api('GET', '/me')[1]['admin']);
    }

    public function testAdminSeesTheDashboard(): void
    {
        $this->signIn();
        self::assertTrue($this->api('GET', '/me')[1]['admin']);

        $this->paidOrder('2026-09-14 21:00', 4);
        $this->paidOrder('2026-09-20 21:00', 4);
        $this->paidOrder('2026-10-02 21:00', 3);
        $this->paidOrder('2026-10-20 21:00', 1, quantity: 2);
        $this->paidOrder('2026-10-24 21:00');

        [$status, $d] = $this->api('GET', '/admin/dashboard?month=2026-10');
        self::assertSame(200, $status);
        self::assertSame('2026-10', $d['month']);
        self::assertSame(56000, $d['revenue']);
        self::assertSame(100, $d['revenueDelta']);
        self::assertSame(3, $d['orders']);
        self::assertSame(2, $d['inProduction']);
        self::assertSame(18667, $d['averageBasket']);
        self::assertSame(4667, $d['averageBasketDelta']);
        self::assertSame(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'], array_column($d['monthly'], 'month'));
        self::assertSame([0, 0, 0, 0, 28000, 56000], array_column($d['monthly'], 'revenue'));
        self::assertSame(['paid' => 1, 'cast' => 1, 'polished' => 0, 'shipped' => 1], $d['production']);
        self::assertSame([['slug' => 'couronne-i', 'name' => 'Couronne I', 'sold' => 6, 'total' => 150], ['slug' => 'spina', 'name' => 'Spina', 'sold' => 0, 'total' => 150]], $d['series']);
        self::assertCount(5, $d['latest']);
        self::assertSame('À couler', $d['latest'][0]['statusLabel']);
        self::assertSame('Inès R.', $d['latest'][0]['customer']);

        // Mois sans précédent : pas d'évolution calculable.
        [, $d] = $this->api('GET', '/admin/dashboard?month=2026-09');
        self::assertNull($d['revenueDelta']);
        self::assertNull($d['averageBasketDelta']);
        self::assertSame(422, $this->api('GET', '/admin/dashboard?month=octobre')[0]);
    }

    public function testOrdersCanBeFilteredAndSearched(): void
    {
        $this->signIn();
        $this->paidOrder('2026-10-01 21:00', 4, lastName: 'Garnier', firstName: 'Eva');
        $this->paidOrder('2026-10-10 21:00', 1);
        $this->paidOrder('2026-10-12 21:00', 2);
        $this->paidOrder('2026-10-24 21:00');
        // Une commande non réglée n'apparaît jamais.
        $this->api('POST', '/orders', $this->orderPayload());

        [$status, $body] = $this->api('GET', '/admin/orders');
        self::assertSame(200, $status);
        self::assertSame(['all' => 4, 'paid' => 1, 'production' => 2, 'shipped' => 0, 'delivered' => 1], $body['counts']);
        self::assertCount(4, $body['orders']);
        self::assertSame('2026-10-24', substr($body['orders'][0]['paidAt'], 0, 10));

        [, $body] = $this->api('GET', '/admin/orders?status=production');
        self::assertSame(['Coulée', 'Polissage'], array_reverse(array_column($body['orders'], 'statusLabel')));

        [, $body] = $this->api('GET', '/admin/orders?q=garnier');
        self::assertCount(1, $body['orders']);
        self::assertSame('Eva G.', $body['orders'][0]['customer']);
        self::assertSame(1, $body['counts']['all']);
        self::assertSame(422, $this->api('GET', '/admin/orders?status=perdues')[0]);
    }

    public function testAdvanceIsAllOrNothing(): void
    {
        $this->signIn();
        $paid = $this->paidOrder('2026-10-20 21:00')->getReference();
        $delivered = $this->paidOrder('2026-09-01 21:00', 4)->getReference();

        [$status, $body] = $this->api('POST', '/admin/orders/advance', ['references' => [$paid, $delivered]]);
        self::assertSame(422, $status);
        self::assertStringContainsString($delivered, $body['error']);
        $this->em()->clear();
        self::assertSame('paid', $this->em()->getRepository(Order::class)->findOneBy(['reference' => $paid])->getStatus()->value);

        [$status, $body] = $this->api('POST', '/admin/orders/advance', ['references' => [$paid]]);
        self::assertSame(200, $status);
        self::assertSame('cast', $body['orders'][0]['status']);
        self::assertSame('Coulée', $body['orders'][0]['statusLabel']);
        self::assertSame(422, $this->api('POST', '/admin/orders/advance', ['references' => []])[0]);
    }

    public function testOrdersExportAsCsv(): void
    {
        $this->signIn();
        $this->paidOrder('2026-10-20 21:00', quantity: 2);

        $this->client->request('GET', '/api/admin/orders.csv');
        $response = $this->client->getResponse();
        self::assertSame(200, $response->getStatusCode());
        self::assertStringStartsWith('text/csv', $response->headers->get('Content-Type'));
        self::assertMatchesRegularExpression('/attachment; filename="noctis-commandes-\d{4}-\d{2}-\d{2}\.csv"/', $response->headers->get('Content-Disposition'));

        $csv = $response->getContent();
        // Les champs contenant une espace sont mis entre guillemets (CSV standard).
        self::assertStringStartsWith("\u{FEFF}Référence;Date;Client;E-mail;Pièces;Tailles;Statut;\"Total €\"\n", $csv);
        self::assertStringContainsString('20/10/2026;"Inès R.";inès@exemple.fr;"Couronne I ×2";57;"À couler";280,00', $csv);
    }

    public function testProductCanBeEdited(): void
    {
        $this->signIn();
        [$status, $product] = $this->api('GET', '/admin/products/couronne-i');
        self::assertSame(200, $status);
        self::assertStringStartsWith('Quatre griffes', $product['pitch']);
        self::assertCount(5, $this->api('GET', '/admin/products')[1]);

        $payload = ['name' => 'Couronne I', 'pitch' => 'Une relique.', 'price' => 15000, 'published' => true, 'editionTotal' => 150, 'sizes' => [66, 50, 57, 57], 'finishes' => ['Or 18 k', 'Argent rhodié']];
        [$status, $product] = $this->api('PUT', '/admin/products/couronne-i', $payload);
        self::assertSame(200, $status);
        self::assertSame([50, 57, 66], $product['sizes']);
        self::assertSame(['Argent rhodié', 'Or 18 k'], $product['finishes']);
        self::assertSame(15000, $this->api('POST', '/quote', ['items' => [['size' => 66, 'finish' => 'Or 18 k'] + self::ITEM]])[1]['subtotal']);

        [$status, $body] = $this->api('PUT', '/admin/products/couronne-i', ['price' => null] + $payload);
        self::assertSame(422, $status);
        self::assertSame('Un prix est nécessaire pour publier.', $body['violations']['price']);

        [$status, $body] = $this->api('PUT', '/admin/products/couronne-i', ['sizes' => [], 'finishes' => ['Platine'], 'name' => ''] + $payload);
        self::assertSame(422, $status);
        self::assertSame('Choisissez au moins une taille.', $body['violations']['sizes']);
        self::assertSame('Finition inconnue.', $body['violations']['finishes[0]']);
        self::assertSame('Le nom est requis.', $body['violations']['name']);

        $this->paidOrder('2026-10-20 21:00', quantity: 2);
        [$status, $body] = $this->api('PUT', '/admin/products/couronne-i', ['editionTotal' => 1] + $payload);
        self::assertSame(422, $status);
        self::assertSame('La série compte déjà 2 pièces vendues.', $body['violations']['editionTotal']);
        self::assertSame(404, $this->api('GET', '/admin/products/inconnue')[0]);
    }

    public function testUnpublishedPieceIsRefusedAtQuote(): void
    {
        $this->signIn();
        $payload = ['name' => 'Couronne I', 'pitch' => '', 'price' => 14000, 'published' => false, 'editionTotal' => 150, 'sizes' => [57], 'finishes' => ['Argent rhodié']];
        self::assertSame(200, $this->api('PUT', '/admin/products/couronne-i', $payload)[0]);

        [$status, $body] = $this->api('POST', '/quote', ['items' => [self::ITEM]]);
        self::assertSame(422, $status);
        self::assertSame("Couronne I n'est pas en vente.", $body['error']);

        $public = array_column($this->api('GET', '/products')[1], null, 'slug')['couronne-i'];
        self::assertFalse($public['published']);
        self::assertFalse($public['available']);
        self::assertSame(0, $public['editionSold']);
    }
}
