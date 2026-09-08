<?php

declare(strict_types=1);

namespace App\Tests\Git;

use App\Git\Images;
use App\Tests\Fake\Wiring;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * What the two sides of a change in an image are made of.
 *
 * The answer is read out of one script asked about several revisions at once,
 * and what it says about each of them is told apart by nothing but its place in
 * the output. A side git said nothing about is the file added by this change or
 * deleted by it, and both of those are drawn -- so a line read as the wrong
 * side's is a page saying a logo was added where it was replaced.
 */
#[CoversClass(Images::class)]
final class ImagesTest extends TestCase
{
    private const string BEFORE = 'aa11bb22cc33dd44ee55ff6677889900aabbccdd';
    private const string AFTER = '00998877665544332211ffeeddccbbaa00112233';

    private Wiring $wiring;

    private Images $images;

    protected function setUp(): void
    {
        $this->wiring = new Wiring(sys_get_temp_dir() . '/branchery-images-' . bin2hex(random_bytes(4)));
        $this->wiring->worktree('demo');
        $this->images = new Images($this->wiring->runner, $this->wiring->project);
    }

    protected function tearDown(): void
    {
        $this->wiring->remove();
    }

    public function testOnlyAFileNamedAsAnImageIsShownAsOne(): void
    {
        self::assertSame('image/jpeg', Images::mediaType('assets/Photo.JPG'));
        self::assertSame('image/png', Images::mediaType('a/b/logo.png'));
        // Text, and its diff is the change.
        self::assertNull(Images::mediaType('assets/logo.svg'));
        self::assertNull(Images::mediaType('composer.lock'));
        self::assertNull(Images::mediaType('png'));
    }

    public function testACommittedChangeCarriesBothSides(): void
    {
        $this->wiring->web->answer('cat-file -s', implode("\n", [
            self::BEFORE . ' 2048',
            self::AFTER . ' 4096',
        ]));

        self::assertSame([
            'before' => ['blob' => self::BEFORE, 'bytes' => 2048],
            'after' => ['blob' => self::AFTER, 'bytes' => 4096],
        ], $this->images->inCommit('demo', '9b31d02', 'assets/logo.png'));
    }

    /** The first line is the parent's, and a commit that added the file has none. */
    public function testAnAddedImageHasNothingBeforeIt(): void
    {
        $this->wiring->web->answer('cat-file -s', "-\n" . self::AFTER . ' 4096');

        $sides = $this->images->inCommit('demo', '9b31d02', 'assets/logo.png');

        self::assertNull($sides['before']);
        self::assertSame(['blob' => self::AFTER, 'bytes' => 4096], $sides['after']);
    }

    /**
     * The side nobody committed is the file itself, which this container has
     * mounted -- git holds nothing to ask about it.
     */
    public function testTheUncommittedSideIsTheFileInTheCheckout(): void
    {
        $this->wiring->web->answer('cat-file -s', self::BEFORE . ' 2048');
        file_put_contents($this->wiring->project->worktreeDirectory('demo') . '/logo.png', str_repeat('.', 96));

        self::assertSame([
            'before' => ['blob' => self::BEFORE, 'bytes' => 2048],
            'after' => ['blob' => null, 'bytes' => 96],
        ], $this->images->uncommitted('demo', 'logo.png'));
    }

    /** A file deleted and not committed: there is one side of it left. */
    public function testADeletedImageHasNothingAfterIt(): void
    {
        $this->wiring->web->answer('cat-file -s', self::BEFORE . ' 2048');

        self::assertNull($this->images->uncommitted('demo', 'logo.png')['after']);
    }

    public function testTheFileInTheCheckoutIsHandedOverAsItIs(): void
    {
        $bytes = "\x89PNG\r\n\x1a\n" . random_bytes(64) . "\n\n";
        file_put_contents($this->wiring->project->worktreeDirectory('demo') . '/logo.png', $bytes);

        self::assertSame($bytes, $this->images->bytes('demo', null, 'logo.png'));
    }

    /**
     * What git holds comes back through base64, a container's answer having its
     * trailing whitespace trimmed off it and a PNG ending in whatever it ends in.
     */
    public function testWhatGitHoldsComesBackByteForByte(): void
    {
        $bytes = "\x89PNG\r\n\x1a\n" . random_bytes(64) . "\n\n";
        $this->wiring->web->answer('cat-file blob', chunk_split(base64_encode($bytes), 76, "\n"));

        self::assertSame($bytes, $this->images->bytes('demo', self::BEFORE, 'logo.png'));
    }

    public function testAnObjectTheRepositoryHasNotIsNoImage(): void
    {
        $this->wiring->web->answer('cat-file blob', '', 1);

        self::assertNull($this->images->bytes('demo', self::BEFORE, 'logo.png'));
        self::assertNull($this->images->bytes('demo', null, 'gone.png'));
    }
}
