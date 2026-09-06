<?php

declare(strict_types=1);

namespace App\Tests\Http;

use App\Http\Origin;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * What the door lets through. Everything the interface itself does has to pass,
 * or the tool is broken for everybody; what another page in the same browser
 * sends must not, or the tool is a shell for whoever gets a developer to open a
 * tab.
 */
#[CoversClass(Origin::class)]
final class OriginTest extends TestCase
{
    private const string HOST = 'blog.ddev.site:8041';

    public function testThePageOfThisApiIsLetThrough(): void
    {
        self::assertFalse(Origin::isForeign([
            'HTTP_HOST' => self::HOST,
            'HTTP_SEC_FETCH_SITE' => 'same-origin',
            'HTTP_ORIGIN' => 'https://blog.ddev.site:8041',
        ]));
    }

    /** Opening the address in the bar is not a request from anywhere. */
    public function testAnAddressTypedIntoTheBarIsLetThrough(): void
    {
        self::assertFalse(Origin::isForeign([
            'HTTP_HOST' => self::HOST,
            'HTTP_SEC_FETCH_SITE' => 'none',
        ]));
    }

    /**
     * curl, the console and everything else that is not a browser. They carry no
     * mark, and their absence is not evidence of anything -- the port is what
     * keeps those out, as it always was.
     */
    public function testARequestThatIsNotABrowsersIsLetThrough(): void
    {
        self::assertFalse(Origin::isForeign(['HTTP_HOST' => self::HOST]));
    }

    /** The one this is for: a page on the network beside the developer. */
    public function testAPageOnAnotherSiteIsRefused(): void
    {
        self::assertTrue(Origin::isForeign([
            'HTTP_HOST' => self::HOST,
            'HTTP_SEC_FETCH_SITE' => 'cross-site',
            'HTTP_ORIGIN' => 'https://elsewhere.example',
        ]));
    }

    /** And the same thing seen by a browser that sends no Sec-Fetch-Site. */
    public function testAnOriginThatIsNotThisHostIsRefused(): void
    {
        self::assertTrue(Origin::isForeign([
            'HTTP_HOST' => self::HOST,
            'HTTP_ORIGIN' => 'https://elsewhere.example',
        ]));
    }

    /**
     * The port is part of who a page is: this interface stands on one of its
     * own, beside the project's own site under the same name.
     */
    public function testTheProjectsOwnSiteOnAnotherPortIsRefused(): void
    {
        self::assertTrue(Origin::isForeign([
            'HTTP_HOST' => self::HOST,
            'HTTP_ORIGIN' => 'https://blog.ddev.site',
        ]));
    }

    /** A port a scheme does not write out is the same address all the same. */
    public function testTheDefaultPortIsTheSameAddressWrittenAnotherWay(): void
    {
        self::assertFalse(Origin::isForeign([
            'HTTP_HOST' => 'blog.ddev.site',
            'HTTP_ORIGIN' => 'https://blog.ddev.site:443',
        ]));
    }
}
