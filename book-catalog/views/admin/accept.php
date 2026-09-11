<?php
/**
 * @var bool                   $invalidInvite  true if the token is bad/expired/used
 * @var array<string, string>  $errors         field => message (valid invite only)
 * @var array<string, string>  $old            previous input, to refill the form
 * @var string                 $token          the invite token (valid invite only)
 * @var string                 $csrf           CSRF token (valid invite only)
 */
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Accept invite — Book Catalog</title>
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
    <?php if ($invalidInvite): ?>
        <div class="auth">
            <h1>Invite not valid</h1>
            <p class="auth__error">This invite link is invalid, expired, or has already been used.</p>
            <p><a href="/">&larr; Back to the catalog</a></p>
        </div>
    <?php else: ?>
        <form class="auth" method="post" action="/admin/accept">
            <h1>Create your admin account</h1>

            <label>Username
                <input type="text" name="username"
                       value="<?= htmlspecialchars($old['username'], ENT_QUOTES, 'UTF-8') ?>" autofocus>
                <?php if (isset($errors['username'])): ?>
                    <span class="field-error"><?= htmlspecialchars($errors['username'], ENT_QUOTES, 'UTF-8') ?></span>
                <?php endif; ?>
            </label>

            <label>Password (at least 8 characters)
                <input type="password" name="password">
                <?php if (isset($errors['password'])): ?>
                    <span class="field-error"><?= htmlspecialchars($errors['password'], ENT_QUOTES, 'UTF-8') ?></span>
                <?php endif; ?>
            </label>

            <input type="hidden" name="token" value="<?= htmlspecialchars($token, ENT_QUOTES, 'UTF-8') ?>">
            <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>">
            <button type="submit" class="btn">Create account</button>
        </form>
    <?php endif; ?>
</body>
</html>
