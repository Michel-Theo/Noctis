<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261026143702 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Produits : accroche et publication (back-office).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE product ADD pitch LONGTEXT NOT NULL, ADD published TINYINT DEFAULT 1 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE product DROP pitch, DROP published');
    }
}
