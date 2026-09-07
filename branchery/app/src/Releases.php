<?php

declare(strict_types=1);

namespace App;

/**
 * What the newest released version is -- asked of somewhere that is not this
 * machine, which is the whole reason it stands behind an interface: everything
 * else in this application answers from the project, and a test that reached
 * the network would fail on a train.
 */
interface Releases
{
    /** The newest tag there is, or null where the question could not be answered. */
    public function latest(): ?string;
}
