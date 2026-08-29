/**
 * What the interface makes of a name and of a length of time.
 *
 * Small enough to look right and wrong often enough to be worth a test: what
 * git takes as a branch, what that branch ends up as as a hostname, which of
 * two versions is the higher, a length of time in a log, and "how long ago" in
 * the reader's own language.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
    compareVersions,
    formatBytes,
    formatDuration,
    formatSpan,
    formatWhen,
    isBranchName,
    repositoryName,
    slug,
} from '../dom.js';

describe('isBranchName', () => {
    it('takes what git takes', () => {
        assert.equal(isBranchName('main'), true);
        assert.equal(isBranchName('feature/checkout'), true);
        assert.equal(isBranchName('release/13.4'), true);
        assert.equal(isBranchName('renovate/typo3-13'), true);
    });

    it('refuses what would not reach git as a name at all', () => {
        assert.equal(isBranchName(''), false);
        assert.equal(isBranchName('/leading-slash'), false);
        assert.equal(isBranchName('-leading-dash'), false);
        assert.equal(isBranchName('has space'), false);
        assert.equal(isBranchName('semi;colon'), false);
        assert.equal(isBranchName('a'.repeat(101)), false);
    });
});

describe('slug', () => {
    it('keeps what a hostname takes and joins the rest', () => {
        assert.equal(slug('bugfix/cache-headers'), 'bugfix-cache-headers');
        assert.equal(slug('release/13.4'), 'release-13-4');
    });

    it('leaves no dash hanging at either end', () => {
        assert.equal(slug('/feature/x/'), 'feature-x');
        assert.equal(slug('---'), '');
    });
});

describe('compareVersions', () => {
    it('reads a version as numbers and not as text', () => {
        // The one every hand-written comparison gets wrong, and the one this
        // exists for: the list of runtimes a worktree may be set to.
        assert.ok(compareVersions('8.10', '8.9') > 0);
        assert.ok(compareVersions('8.9', '8.10') < 0);
    });

    it('counts a segment the other one has not as zero', () => {
        assert.equal(compareVersions('8.4', '8.4.0'), 0);
        assert.ok(compareVersions('8.4.1', '8.4') > 0);
    });

    it('says nothing about two of the same', () => {
        assert.equal(compareVersions('8.3', '8.3'), 0);
    });
});

describe('repositoryName', () => {
    it('names a repository the way its forge does', () => {
        assert.equal(repositoryName('https://github.com/TYPO3GmbH/blog'), 'TYPO3GmbH/blog');
        assert.equal(repositoryName('https://gitlab.com/group/subgroup/site'), 'group/subgroup/site');
    });

    it('hands back what is not an address at all', () => {
        assert.equal(repositoryName('not an address'), 'not an address');
    });
});

describe('formatSpan', () => {
    it('says seconds until there are minutes to say', () => {
        assert.equal(formatSpan(0), '0s');
        assert.equal(formatSpan(59), '59s');
        assert.equal(formatSpan(60), '1m');
        assert.equal(formatSpan(200), '3m 20s');
    });
});

describe('formatDuration', () => {
    it('is a clock, with the seconds always two digits', () => {
        assert.equal(formatDuration(4), '0:04');
        assert.equal(formatDuration(64), '1:04');
        assert.equal(formatDuration(-1), '0:00');
    });
});

describe('formatBytes', () => {
    it('uses the scale at which the value is useful', () => {
        assert.equal(formatBytes(0, 'en'), '0 B');
        assert.equal(formatBytes(1024, 'en'), '1 KB');
        assert.equal(formatBytes(1610612736, 'en'), '1.5 GB');
    });

    it('uses the reader’s number format', () => {
        assert.equal(formatBytes(1610612736, 'de'), '1,5 GB');
    });
});

describe('formatWhen', () => {
    const now = (): number => Math.round(Date.now() / 1000);

    it('takes the largest unit that still says something', () => {
        assert.equal(formatWhen(now() - 5, 'en'), '5 seconds ago');
        assert.equal(formatWhen(now() - 120, 'en'), '2 minutes ago');
        assert.equal(formatWhen(now() - 7200, 'en'), '2 hours ago');
        assert.equal(formatWhen(now() - 172800, 'en'), '2 days ago');
    });

    it('speaks the language it is handed', () => {
        assert.equal(formatWhen(now() - 120, 'de'), 'vor 2 Minuten');
    });

    /** A clock that is ahead of the server's is not a reason to say "in -3 seconds". */
    it('never says a thing happened in the future', () => {
        assert.equal(formatWhen(now() + 30, 'en'), 'now');
    });
});
