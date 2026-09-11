<?php
/**
 * @var string      $username  provided by index.php
 * @var string|null $flash     one-off success message, or null
 * @var string      $csrf      CSRF token for the import form
 */
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Admin — Book Catalog</title>
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
    <div class="toolbar">
        <h1>Admin</h1>
        <a class="btn" href="/admin/logout">Log out</a>
    </div>

    <?php if (!empty($flash)): ?>
        <p class="flash"><?= htmlspecialchars($flash, ENT_QUOTES, 'UTF-8') ?></p>
    <?php endif; ?>

    <p>Logged in as <strong><?= htmlspecialchars($username, ENT_QUOTES, 'UTF-8') ?></strong>.</p>

    <p><a href="/admin/add">+ Add book</a></p>

    <form method="post" action="/admin/import">
        <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>">
        <button type="submit" class="btn">Import from books.json</button>
    </form>
</body>
</html>
