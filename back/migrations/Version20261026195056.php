<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261026195056 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Demandes de réinitialisation de mot de passe.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE reset_password_request (id INT AUTO_INCREMENT NOT NULL, requested_at DATETIME NOT NULL, expires_at DATETIME NOT NULL, selector VARCHAR(20) NOT NULL, hashed_verifier VARCHAR(64) NOT NULL, user_id INT NOT NULL, UNIQUE INDEX UNIQ_7CE748A9692E25D (selector), INDEX IDX_7CE748AA76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE reset_password_request ADD CONSTRAINT FK_7CE748AA76ED395 FOREIGN KEY (user_id) REFERENCES app_user (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE reset_password_request DROP FOREIGN KEY FK_7CE748AA76ED395');
        $this->addSql('DROP TABLE reset_password_request');
    }
}
