<?php

namespace App\Entity;

enum OrderStatus: string
{
    case Pending = 'pending';
    /** Paiement en cours : la commande est réservée, un second paiement est refusé. */
    case Processing = 'processing';
    case Paid = 'paid';
    case Cast = 'cast';
    case Polished = 'polished';
    case Shipped = 'shipped';
    case Delivered = 'delivered';

    /** Étape suivante de fabrication, null si la commande n'avance pas (non payée ou livrée). */
    public function next(): ?self
    {
        return match ($this) {
            self::Paid => self::Cast,
            self::Cast => self::Polished,
            self::Polished => self::Shipped,
            self::Shipped => self::Delivered,
            default => null,
        };
    }
}
