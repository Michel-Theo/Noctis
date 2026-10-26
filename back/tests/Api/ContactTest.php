<?php

namespace App\Tests\Api;

use App\Entity\ContactMessage;
use Doctrine\ORM\EntityManagerInterface;

final class ContactTest extends ApiTestCase
{
    private const MESSAGE = ['firstName' => 'Théo', 'lastName' => 'Michel', 'email' => 'theo@exemple.fr', 'subject' => 'sur-mesure', 'message' => 'Une Couronne I en taille 66, est-ce possible ?'];

    public function testMessageIsStored(): void
    {
        [$status] = $this->api('POST', '/contact', self::MESSAGE);

        self::assertSame(201, $status);
        $stored = static::getContainer()->get(EntityManagerInterface::class)->getRepository(ContactMessage::class)->findAll();
        self::assertCount(1, $stored);
        self::assertSame('sur-mesure', $stored[0]->getSubject());
    }

    public function testInvalidMessageReturnsFrenchViolations(): void
    {
        [$status, $body] = $this->api('POST', '/contact', ['email' => 'nope', 'message' => 'court', 'subject' => 'spam'] + self::MESSAGE);

        self::assertSame(422, $status);
        self::assertSame("Cet e-mail n'est pas valide.", $body['violations']['email']);
        self::assertSame("Quelques mots de plus, s'il vous plaît.", $body['violations']['message']);
        self::assertSame('Sujet inconnu.', $body['violations']['subject']);
    }

    public function testFourthMessageInTenMinutesIsRefused(): void
    {
        for ($i = 0; $i < 3; ++$i) {
            self::assertSame(201, $this->api('POST', '/contact', self::MESSAGE)[0]);
        }
        [$status, $body] = $this->api('POST', '/contact', self::MESSAGE);

        self::assertSame(429, $status);
        self::assertSame('Trop de messages. Réessayez dans quelques minutes.', $body['error']);
    }
}
