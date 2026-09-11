<?php
/**
 * @var string|null $error   optional error message provided by index.php
 * @var string|null $notice  optional info message (e.g. after signing up via invite)
 */
$pageTitle = 'Sign in — Book Catalog';
require __DIR__ . '/partials/header.php';
?>
<form class="auth" method="post" action="/login">
    <h1>Sign in</h1>

    <?php if (!empty($notice)): ?><p class="notice"><?= e($notice) ?></p><?php endif; ?>
    <?php if (!empty($error)): ?><p class="auth__error"><?= e($error) ?></p><?php endif; ?>

    <label>Username
        <input type="text" name="username" required autofocus>
    </label>
    <label>Password
        <input type="password" name="password" required>
    </label>

    <button type="submit" class="btn">Sign in</button>
    <p class="hint">No account yet? <a href="/signup">Sign up</a></p>
</form>
<?php require __DIR__ . '/partials/footer.php'; ?>
