<?php
/**
 * @var string|null $error   optional error message provided by index.php
 * @var string|null $notice  optional info message (e.g. after creating an account)
 */
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Admin login — Book Catalog</title>
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
    <p><a class="back-link" href="/">&larr; Back to list</a></p>

    <form class="auth" method="post" action="/admin/login">
        <h1>Admin login</h1>

        <?php if (!empty($notice)): ?>
            <p class="notice"><?= htmlspecialchars($notice, ENT_QUOTES, 'UTF-8') ?></p>
        <?php endif; ?>

        <?php if (!empty($error)): ?>
            <p class="auth__error"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p>
        <?php endif; ?>

        <label>Username
            <input type="text" name="username" required autofocus>
        </label>
        <label>Password
            <input type="password" name="password" required>
        </label>

        <button type="submit" class="btn">Log in</button>
    </form>
</body>
</html>
