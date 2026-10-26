<?php

namespace App\Entity;

use App\Repository\OrderRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

/** « order » est un mot réservé en SQL : la table s'appelle purchase_order. */
#[ORM\Entity(repositoryClass: OrderRepository::class)]
#[ORM\Table(name: 'purchase_order')]
class Order
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 20, unique: true)]
    private string $reference = '';

    /** Secret remis au client : sans lui, la commande n'est ni lisible ni payable. */
    #[ORM\Column(length: 64)]
    private string $token;

    #[ORM\Column(length: 180)]
    private string $email = '';

    #[ORM\Column(length: 80)]
    private string $firstName = '';

    #[ORM\Column(length: 80)]
    private string $lastName = '';

    #[ORM\Column(length: 200)]
    private string $address = '';

    #[ORM\Column(length: 12)]
    private string $postalCode = '';

    #[ORM\Column(length: 80)]
    private string $city = '';

    #[ORM\Column(length: 80)]
    private string $country = '';

    #[ORM\Column(length: 20)]
    private string $shippingMethod = 'colissimo';

    #[ORM\Column]
    private int $shippingCost = 0;

    #[ORM\Column]
    private int $subtotal = 0;

    #[ORM\Column]
    private int $discount = 0;

    #[ORM\Column(length: 20, nullable: true)]
    private ?string $discountCode = null;

    #[ORM\Column]
    private int $total = 0;

    #[ORM\Column(enumType: OrderStatus::class)]
    private OrderStatus $status = OrderStatus::Pending;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $paidAt = null;

    #[ORM\Column(length: 20, nullable: true)]
    private ?string $paymentMethod = null;

    /** Compte qui a passé la commande ; null pour une commande invité. */
    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $user = null;

    /** @var Collection<int, OrderItem> */
    #[ORM\OneToMany(targetEntity: OrderItem::class, mappedBy: 'order', cascade: ['persist'], orphanRemoval: true)]
    private Collection $items;

    public function __construct()
    {
        $this->items = new ArrayCollection();
        $this->token = bin2hex(random_bytes(24));
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getReference(): string
    {
        return $this->reference;
    }

    public function setReference(string $reference): void
    {
        $this->reference = $reference;
    }

    public function getToken(): string
    {
        return $this->token;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getFirstName(): string
    {
        return $this->firstName;
    }

    public function getLastName(): string
    {
        return $this->lastName;
    }

    public function getAddress(): string
    {
        return $this->address;
    }

    public function getPostalCode(): string
    {
        return $this->postalCode;
    }

    public function getCity(): string
    {
        return $this->city;
    }

    public function getCountry(): string
    {
        return $this->country;
    }

    public function getShippingMethod(): string
    {
        return $this->shippingMethod;
    }

    public function getShippingCost(): int
    {
        return $this->shippingCost;
    }

    public function getSubtotal(): int
    {
        return $this->subtotal;
    }

    public function getDiscount(): int
    {
        return $this->discount;
    }

    public function getDiscountCode(): ?string
    {
        return $this->discountCode;
    }

    public function getTotal(): int
    {
        return $this->total;
    }

    public function getStatus(): OrderStatus
    {
        return $this->status;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getPaidAt(): ?\DateTimeImmutable
    {
        return $this->paidAt;
    }

    public function getPaymentMethod(): ?string
    {
        return $this->paymentMethod;
    }

    /** @return Collection<int, OrderItem> */
    public function getItems(): Collection
    {
        return $this->items;
    }

    public function setCustomer(string $email, string $firstName, string $lastName): void
    {
        $this->email = $email;
        $this->firstName = $firstName;
        $this->lastName = $lastName;
    }

    public function setShippingAddress(string $address, string $postalCode, string $city, string $country): void
    {
        $this->address = $address;
        $this->postalCode = $postalCode;
        $this->city = $city;
        $this->country = $country;
    }

    public function setAmounts(string $shippingMethod, int $shippingCost, int $subtotal, int $discount, ?string $discountCode, int $total): void
    {
        $this->shippingMethod = $shippingMethod;
        $this->shippingCost = $shippingCost;
        $this->subtotal = $subtotal;
        $this->discount = $discount;
        $this->discountCode = $discountCode;
        $this->total = $total;
    }

    public function addItem(OrderItem $item): void
    {
        $this->items->add($item);
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): void
    {
        $this->user = $user;
    }

    /** Date de commande imposée (jeux de démonstration). */
    public function placedAt(\DateTimeImmutable $at): void
    {
        $this->createdAt = $at;
    }

    /** Fait avancer la fabrication d'une étape ; renvoie le nouveau statut. */
    public function advance(): OrderStatus
    {
        $this->status = $this->status->next() ?? throw new \LogicException(\sprintf('La commande %s ne peut pas avancer (statut : %s).', $this->reference, $this->status->value));

        return $this->status;
    }

    public function markPaid(string $method, ?\DateTimeImmutable $at = null): void
    {
        $this->status = OrderStatus::Paid;
        $this->paymentMethod = $method;
        $this->paidAt = $at ?? new \DateTimeImmutable();
    }
}
