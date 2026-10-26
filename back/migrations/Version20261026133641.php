<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261026133641 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE order_item (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name VARCHAR(120) NOT NULL, finish VARCHAR(40) NOT NULL, size INTEGER NOT NULL, quantity INTEGER NOT NULL, unit_price INTEGER NOT NULL, order_id INTEGER NOT NULL, product_id INTEGER NOT NULL, CONSTRAINT FK_52EA1F098D9F6D38 FOREIGN KEY (order_id) REFERENCES purchase_order (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_52EA1F094584665A FOREIGN KEY (product_id) REFERENCES product (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_52EA1F098D9F6D38 ON order_item (order_id)');
        $this->addSql('CREATE INDEX IDX_52EA1F094584665A ON order_item (product_id)');
        $this->addSql('CREATE TABLE product (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, slug VARCHAR(80) NOT NULL, name VARCHAR(120) NOT NULL, collection VARCHAR(80) NOT NULL, price INTEGER DEFAULT NULL, edition_total INTEGER NOT NULL, finishes CLOB NOT NULL, sizes CLOB NOT NULL)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_D34A04AD989D9B62 ON product (slug)');
        $this->addSql('CREATE TABLE purchase_order (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, reference VARCHAR(20) NOT NULL, token VARCHAR(64) NOT NULL, email VARCHAR(180) NOT NULL, first_name VARCHAR(80) NOT NULL, last_name VARCHAR(80) NOT NULL, address VARCHAR(200) NOT NULL, postal_code VARCHAR(12) NOT NULL, city VARCHAR(80) NOT NULL, country VARCHAR(80) NOT NULL, shipping_method VARCHAR(20) NOT NULL, shipping_cost INTEGER NOT NULL, subtotal INTEGER NOT NULL, discount INTEGER NOT NULL, discount_code VARCHAR(20) DEFAULT NULL, total INTEGER NOT NULL, status VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL, paid_at DATETIME DEFAULT NULL, payment_method VARCHAR(20) DEFAULT NULL)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_21E210B2AEA34913 ON purchase_order (reference)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE order_item');
        $this->addSql('DROP TABLE product');
        $this->addSql('DROP TABLE purchase_order');
    }
}
