<?php /** @var string $username  provided by index.php */ ?>
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

    <p>Logged in as <strong><?= htmlspecialchars($username, ENT_QUOTES, 'UTF-8') ?></strong>.</p>
    <p>Book management coming next.</p>
</body>
</html>
