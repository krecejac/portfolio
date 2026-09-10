<?php
declare(strict_types=1);

/**
 * Temporary smoke-test page for the Docker skeleton.
 *
 * It only proves that PHP runs under Apache and can reach the MariaDB
 * container. It will be replaced by the real front controller / router
 * in a later step.
 */

header('Content-Type: text/html; charset=utf-8');

require __DIR__ . '/../src/Database.php';

try {
    Database::connect();
    $dbOk = true;
    $dbMessage = 'connected to database';
} catch (Throwable $e) {
    $dbOk = false;
    $dbMessage = $e->getMessage();
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Book Catalog — skeleton</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 4rem auto; padding: 0 1rem; }
        .ok   { color: #1a7f37; }
        .fail { color: #c0392b; }
        code  { background: #f0f0f0; padding: .1rem .3rem; border-radius: .2rem; }
    </style>
</head>
<body>
    <h1>Book Catalog</h1>
    <p>PHP <?= PHP_VERSION ?> is running under Apache. ✔</p>
    <p>Database:
        <strong class="<?= $dbOk ? 'ok' : 'fail' ?>">
            <?= $dbOk ? '✔ ' : '✗ ' ?><?= htmlspecialchars($dbMessage, ENT_QUOTES) ?>
        </strong>
    </p>
    <p><small>Temporary skeleton page — replace with the real app.</small></p>
</body>
</html>
