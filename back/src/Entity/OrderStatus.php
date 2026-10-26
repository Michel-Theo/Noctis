<?php

namespace App\Entity;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Cast = 'cast';
    case Polished = 'polished';
    case Shipped = 'shipped';
}
