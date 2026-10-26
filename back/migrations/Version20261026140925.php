<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261026140925 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Comptes clients, rattachement des commandes et numérotation des séries limitées.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE app_user (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, password VARCHAR(255) NOT NULL, roles JSON NOT NULL, created_at DATETIME NOT NULL, first_name VARCHAR(80) NOT NULL, last_name VARCHAR(80) NOT NULL, UNIQUE INDEX UNIQ_88BDF3E9E7927C74 (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        // Lignes existantes : aucune pièce numérotée, puis la colonne devient obligatoire.
        $this->addSql('ALTER TABLE order_item ADD serials JSON DEFAULT NULL');
        $this->addSql("UPDATE order_item SET serials = '[]'");
        $this->addSql('ALTER TABLE order_item MODIFY serials JSON NOT NULL');
        $this->addSql('ALTER TABLE product ADD edition_sold INT DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE purchase_order ADD user_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE purchase_order ADD CONSTRAINT FK_21E210B2A76ED395 FOREIGN KEY (user_id) REFERENCES app_user (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_21E210B2A76ED395 ON purchase_order (user_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE purchase_order DROP FOREIGN KEY FK_21E210B2A76ED395');
        $this->addSql('DROP INDEX IDX_21E210B2A76ED395 ON purchase_order');
        $this->addSql('ALTER TABLE purchase_order DROP user_id');
        $this->addSql('DROP TABLE app_user');
        $this->addSql('ALTER TABLE order_item DROP serials');
        $this->addSql('ALTER TABLE product DROP edition_sold');
    }
}
