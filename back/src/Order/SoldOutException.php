<?php

namespace App\Order;

use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class SoldOutException extends ConflictHttpException
{
    public function __construct()
    {
        parent::__construct('La série est épuisée.');
    }
}
