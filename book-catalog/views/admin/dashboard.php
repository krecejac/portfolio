<?php
/**
 * @var string|null $flash       one-off success message, or null
 * @var string|null $error       one-off failure message (e.g. a failed import), or null
 * @var string|null $inviteLink  a freshly generated invite link to show once, or null
 * @var string      $csrf        CSRF token for the import/invite forms
 * @var array<int, array<string, mixed>> $books  the whole catalogue, to manage
 */
$pageTitle = 'Admin — Book Catalog';
require __DIR__ . '/../partials/header.php';
?>
<h1 class="page-title">Admin dashboard</h1>

<?php if (!empty($flash)): ?>
    <p class="flash"><?= e($flash) ?></p>
<?php endif; ?>

<?php if (!empty($error)): ?>
    <p class="flash flash--error"><?= e($error) ?></p>
<?php endif; ?>

<?php if (!empty($inviteLink)): ?>
    <div class="notice">
        <p>Invite link (valid 24&nbsp;h, one-time) &mdash; copy it and send it to the new admin:</p>
        <code><?= e($inviteLink) ?></code>
    </div>
<?php endif; ?>

<div class="actions">
    <div class="action-card">
        <h2>Add a book</h2>
        <p>Create a new catalogue entry through a validated form.</p>
        <a class="btn" href="/admin/add">Add book</a>
    </div>

    <div class="action-card">
        <h2>Import books</h2>
        <p>Load books from a JSON file. See the docs for the format.</p>
        <form class="import-upload" method="post" action="/admin/import" enctype="multipart/form-data">
            <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
            <input type="file" name="file" accept="application/json,.json" required>
            <button type="submit" class="btn">Import books</button>
        </form>
    </div>

    <div class="action-card">
        <h2>Invite an admin</h2>
        <p>Generate a one-time link so a colleague can create their own account.</p>
        <form method="post" action="/admin/invite">
            <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
            <button type="submit" class="btn">Create invite link</button>
        </form>
    </div>
</div>

<section class="manage">
    <h2 class="manage__title">Manage books <span class="manage__count"><?= count($books) ?></span></h2>

    <?php if ($books === []): ?>
        <p class="empty">No books yet. Add one or import from <code>books.json</code>.</p>
    <?php else: ?>
        <table class="manage-table">
            <thead>
                <tr><th>Title</th><th>Author</th><th class="num">Year</th><th class="num">Rating</th><th class="actions-col">Actions</th></tr>
            </thead>
            <tbody>
                <?php foreach ($books as $book): ?>
                    <tr>
                        <td><a href="/?id=<?= (int) $book['id'] ?>"><?= e($book['title']) ?></a></td>
                        <td><?= e($book['author']) ?></td>
                        <td class="num"><?= e((string) $book['year']) ?></td>
                        <td class="num"><?= stars($book['avg_rating'] === null ? null : (int) $book['avg_rating']) ?></td>
                        <td class="actions-col">
                            <a class="btn btn--sm btn--ghost" href="/admin/edit?id=<?= (int) $book['id'] ?>">Edit</a>
                            <form method="post" action="/admin/delete"
                                  onsubmit="return confirm('Delete “<?= e(addslashes($book['title'])) ?>”? This cannot be undone.');">
                                <input type="hidden" name="id" value="<?= (int) $book['id'] ?>">
                                <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                                <button type="submit" class="btn btn--sm btn--danger">Delete</button>
                            </form>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</section>
<?php require __DIR__ . '/../partials/footer.php'; ?>
