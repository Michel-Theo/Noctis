<?php

namespace App\Controller;

use App\Admin\Dashboard;
use App\Dto\AdvanceInput;
use App\Dto\ProductInput;
use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\Product;
use App\Order\AdminOrderPresenter;
use App\Order\Fabrication;
use App\Repository\OrderRepository;
use App\Repository\ProductRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryParameter;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\Routing\Attribute\Route;

/** Back-office de l'atelier : réservé à ROLE_ADMIN (access_control ^/api/admin). */
#[Route('/api/admin')]
final class AdminController extends AbstractController
{
    public function __construct(
        private readonly OrderRepository $orders,
        private readonly ProductRepository $products,
        private readonly AdminOrderPresenter $presenter,
    ) {
    }

    #[Route('/dashboard', methods: ['GET'])]
    public function dashboard(Dashboard $dashboard, #[MapQueryParameter] ?string $month = null): JsonResponse
    {
        $first = null === $month ? new \DateTimeImmutable('first day of this month') : \DateTimeImmutable::createFromFormat('!Y-m', $month);
        if (false === $first || (null !== $month && $first->format('Y-m') !== $month)) {
            throw new UnprocessableEntityHttpException('Mois invalide (format AAAA-MM).');
        }

        return new JsonResponse($dashboard->build($first));
    }

    #[Route('/orders', methods: ['GET'])]
    public function orders(#[MapQueryParameter] string $status = 'all', #[MapQueryParameter] ?string $q = null): JsonResponse
    {
        $counts = $this->orders->countPaidByStatus($q);
        $sum = static fn (string $filter) => array_sum(array_map(static fn ($s) => $counts[$s->value] ?? 0, OrderRepository::ADMIN_FILTERS[$filter]));

        return new JsonResponse([
            'counts' => ['all' => array_sum($counts)] + array_combine(array_keys(OrderRepository::ADMIN_FILTERS), array_map($sum, array_keys(OrderRepository::ADMIN_FILTERS))),
            'orders' => $this->presenter->presentAll($this->orders->findPaidForAdmin($this->statuses($status), $q)),
        ]);
    }

    /** Fait avancer d'une étape les commandes sélectionnées (tout ou rien). */
    #[Route('/orders/advance', methods: ['POST'])]
    public function advance(#[MapRequestPayload] AdvanceInput $input, Fabrication $fabrication): JsonResponse
    {
        return new JsonResponse(['orders' => $this->presenter->presentAll($fabrication->advance($input->references))]);
    }

    /** Export tableur (Excel ouvre directement l'UTF-8 avec BOM et le point-virgule). */
    #[Route('/orders.csv', methods: ['GET'])]
    public function export(#[MapQueryParameter] string $status = 'all', #[MapQueryParameter] ?string $q = null): Response
    {
        $out = fopen('php://temp', 'r+');
        fwrite($out, "\u{FEFF}");
        fputcsv($out, ['Référence', 'Date', 'Client', 'E-mail', 'Pièces', 'Tailles', 'Statut', 'Total €'], ';', '"', '');
        foreach ($this->orders->findPaidForAdmin($this->statuses($status), $q, 10000) as $order) {
            $items = $order->getItems()->toArray();
            fputcsv($out, [
                $order->getReference(),
                $order->getPaidAt()?->format('d/m/Y'),
                AdminOrderPresenter::customer($order),
                $order->getEmail(),
                implode(', ', array_map(static fn (OrderItem $i) => $i->getName().($i->getQuantity() > 1 ? ' ×'.$i->getQuantity() : ''), $items)),
                implode(', ', array_map(static fn (OrderItem $i) => (string) $i->getSize(), $items)),
                AdminOrderPresenter::label($order->getStatus()),
                number_format($order->getTotal() / 100, 2, ',', ''),
            ], ';', '"', '');
        }
        rewind($out);
        $csv = stream_get_contents($out);
        fclose($out);

        return new Response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => \sprintf('attachment; filename="noctis-commandes-%s.csv"', (new \DateTimeImmutable())->format('Y-m-d')),
        ]);
    }

    #[Route('/products', methods: ['GET'])]
    public function products(): JsonResponse
    {
        return new JsonResponse(array_map(static fn (Product $p) => [
            'slug' => $p->getSlug(),
            'name' => $p->getName(),
            'price' => $p->getPrice(),
            'published' => $p->isPublished(),
            'editionTotal' => $p->getEditionTotal(),
            'editionSold' => $p->getEditionSold(),
        ], $this->products->findBy([], ['id' => 'ASC'])));
    }

    #[Route('/products/{slug}', methods: ['GET'])]
    public function product(string $slug): JsonResponse
    {
        return new JsonResponse($this->presentProduct($this->findProduct($slug)));
    }

    #[Route('/products/{slug}', methods: ['PUT'])]
    public function updateProduct(string $slug, #[MapRequestPayload] ProductInput $input, EntityManagerInterface $em): JsonResponse
    {
        $product = $this->findProduct($slug);
        $violations = [];
        if ($input->published && null === $input->price) {
            $violations['price'] = 'Un prix est nécessaire pour publier.';
        }
        if ($input->editionTotal < $product->getEditionSold()) {
            $violations['editionTotal'] = \sprintf('La série compte déjà %d pièces vendues.', $product->getEditionSold());
        }
        if ($violations) {
            return new JsonResponse(['error' => 'Validation', 'violations' => $violations], 422);
        }

        $sizes = array_values(array_unique(array_map('intval', $input->sizes)));
        sort($sizes);
        // Les finitions gardent l'ordre de référence (rhodié, oxydé, or).
        $finishes = array_values(array_intersect(ProductInput::FINISHES, $input->finishes));
        $product->update(trim($input->name), trim($input->pitch), $input->price, $input->published, $input->editionTotal, $sizes, $finishes);
        $em->flush();

        return new JsonResponse($this->presentProduct($product));
    }

    /** @return list<\App\Entity\OrderStatus>|null */
    private function statuses(string $filter): ?array
    {
        if ('all' === $filter) {
            return null;
        }

        return OrderRepository::ADMIN_FILTERS[$filter] ?? throw new UnprocessableEntityHttpException('Filtre de statut inconnu.');
    }

    private function findProduct(string $slug): Product
    {
        return $this->products->findOneBy(['slug' => $slug]) ?? throw new NotFoundHttpException('Pièce introuvable.');
    }

    /** @return array<string, mixed> */
    private function presentProduct(Product $p): array
    {
        return [
            'slug' => $p->getSlug(),
            'name' => $p->getName(),
            'pitch' => $p->getPitch(),
            'price' => $p->getPrice(),
            'published' => $p->isPublished(),
            'editionTotal' => $p->getEditionTotal(),
            'editionSold' => $p->getEditionSold(),
            'sizes' => $p->getSizes(),
            'finishes' => $p->getFinishes(),
        ];
    }
}
