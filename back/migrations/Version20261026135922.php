<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261026135922 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Schéma initial NOCTIS : catalogue, commandes et lignes (MariaDB).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE order_item (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(120) NOT NULL, finish VARCHAR(40) NOT NULL, size INT NOT NULL, quantity INT NOT NULL, unit_price INT NOT NULL, order_id INT NOT NULL, product_id INT NOT NULL, INDEX IDX_52EA1F098D9F6D38 (order_id), INDEX IDX_52EA1F094584665A (product_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE product (id INT AUTO_INCREMENT NOT NULL, slug VARCHAR(80) NOT NULL, name VARCHAR(120) NOT NULL, collection VARCHAR(80) NOT NULL, price INT DEFAULT NULL, edition_total INT NOT NULL, finishes JSON NOT NULL, sizes JSON NOT NULL, UNIQUE INDEX UNIQ_D34A04AD989D9B62 (slug), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE purchase_order (id INT AUTO_INCREMENT NOT NULL, reference VARCHAR(20) NOT NULL, token VARCHAR(64) NOT NULL, email VARCHAR(180) NOT NULL, first_name VARCHAR(80) NOT NULL, last_name VARCHAR(80) NOT NULL, address VARCHAR(200) NOT NULL, postal_code VARCHAR(12) NOT NULL, city VARCHAR(80) NOT NULL, country VARCHAR(80) NOT NULL, shipping_method VARCHAR(20) NOT NULL, shipping_cost INT NOT NULL, subtotal INT NOT NULL, discount INT NOT NULL, discount_code VARCHAR(20) DEFAULT NULL, total INT NOT NULL, status VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL, paid_at DATETIME DEFAULT NULL, payment_method VARCHAR(20) DEFAULT NULL, UNIQUE INDEX UNIQ_21E210B2AEA34913 (reference), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE order_item ADD CONSTRAINT FK_52EA1F098D9F6D38 FOREIGN KEY (order_id) REFERENCES purchase_order (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE order_item ADD CONSTRAINT FK_52EA1F094584665A FOREIGN KEY (product_id) REFERENCES product (id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE order_item DROP FOREIGN KEY FK_52EA1F098D9F6D38');
        $this->addSql('ALTER TABLE order_item DROP FOREIGN KEY FK_52EA1F094584665A');
        $this->addSql('DROP TABLE order_item');
        $this->addSql('DROP TABLE product');
        $this->addSql('DROP TABLE purchase_order');
    }
}
