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
}
