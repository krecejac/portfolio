<?php
declare(strict_types=1);

/**
 * The admin area: the dashboard plus the book CRUD, the JSON import, the
 * Open Library lookup used by the add/edit form, and the one-time admin invite.
 * Every action starts with Auth::requireAdmin(); every write checks CSRF and
 * redirects afterwards (PRG), passing any message through a one-shot session flash.
 */
final class AdminController
{
    /** GET /admin — the dashboard: action cards plus the manage-books table. */
    public static function dashboard(): void
    {
        Auth::requireAdmin();
        // Read-and-clear the one-shot messages handed over by the last write.
        $flash = $_SESSION['flash'] ?? null;
        $error = $_SESSION['error'] ?? null;
        $inviteLink = $_SESSION['invite_link'] ?? null;
        unset($_SESSION['flash'], $_SESSION['error'], $_SESSION['invite_link']);
        $csrf = Csrf::token();
        $books = (new BookRepository())->all();
        require view_path('admin/dashboard');
    }

    /**
     * GET /admin/book-lookup — JSON metadata for the add/edit form's title
     * autocomplete (Open Library, no key). Convenience only: every book can still
     * be typed by hand, and the catalogue's data does not depend on this at runtime.
     */
    public static function bookLookup(): void
    {
        Auth::requireAdmin();
        header('Content-Type: application/json');
        echo json_encode(OpenLibrary::search((string) ($_GET['q'] ?? '')));
        exit;
    }

    /** GET/POST /admin/add — add a book. Invalid input re-renders a sticky form. */
    public static function add(): void
    {
        Auth::requireAdmin();
        $repository = new BookRepository();
        $errors = [];
        $old = ['title' => '', 'author' => '', 'year' => '', 'rating' => '', 'annotation' => '', 'genre' => '', 'cover_url' => ''];
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (!Csrf::check($_POST['csrf'] ?? null)) {
                http_response_code(400);
                echo 'Invalid CSRF token.';
                exit;
            }
            foreach (array_keys($old) as $field) {
                $old[$field] = trim((string) ($_POST[$field] ?? ''));
            }
            $result = BookValidator::validate($old);
            $errors = $result['errors'];
            if ($errors === []) {
                $book = $result['clean'];
                $repository->create($book['title'], $book['author'], $book['year'], $book['rating'], $book['annotation'], $book['genre'], $book['cover_url']);
                $_SESSION['flash'] = 'Book added.';
                header('Location: /admin');
                exit;
            }
        }
        $csrf = Csrf::token();
        require view_path('admin/add');
    }

    /** GET/POST /admin/edit — edit a book by id (404 if it is gone). */
    public static function edit(): void
    {
        Auth::requireAdmin();
        $repository = new BookRepository();
        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT)
            ?: filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
        $book = $id ? $repository->find($id) : null;
        if ($book === null) {
            http_response_code(404);
            echo 'Book not found.';
            exit;
        }
        $errors = [];
        $old = [
            'title'      => (string) $book['title'],
            'author'     => (string) $book['author'],
            'year'       => (string) $book['year'],
            'rating'     => $book['rating'] === null ? '' : (string) $book['rating'],
            'annotation' => (string) ($book['annotation'] ?? ''),
            'genre'      => (string) ($book['genre'] ?? ''),
            'cover_url'  => (string) ($book['cover_url'] ?? ''),
        ];
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (!Csrf::check($_POST['csrf'] ?? null)) {
                http_response_code(400);
                echo 'Invalid CSRF token.';
                exit;
            }
            foreach (array_keys($old) as $field) {
                $old[$field] = trim((string) ($_POST[$field] ?? ''));
            }
            $result = BookValidator::validate($old);
            $errors = $result['errors'];
            if ($errors === []) {
                $clean = $result['clean'];
                $repository->update((int) $book['id'], $clean['title'], $clean['author'], $clean['year'], $clean['rating'], $clean['annotation'], $clean['genre'], $clean['cover_url']);
                $_SESSION['flash'] = 'Book updated.';
                header('Location: /admin');
                exit;
            }
        }
        $csrf = Csrf::token();
        require view_path('admin/edit');
    }

    /** POST /admin/delete — delete a book (its favourites and ratings go too). */
    public static function delete(): void
    {
        Auth::requireAdmin();
        $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !Csrf::check($_POST['csrf'] ?? null) || !$id) {
            http_response_code(400);
            echo 'Bad request.';
            exit;
        }
        (new BookRepository())->delete($id);
        $_SESSION['flash'] = 'Book deleted.';
        header('Location: /admin');
        exit;
    }

    /**
     * POST /admin/import — import books from a JSON file the admin uploads. Each
     * entry goes through the same BookValidator as the add form, and a book that
     * already exists (same title+author+year) is skipped, so re-importing is safe.
     */
    public static function import(): void
    {
        Auth::requireAdmin();
        $repository = new BookRepository();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !Csrf::check($_POST['csrf'] ?? null)) {
            http_response_code(400);
            echo 'Bad request.';
            exit;
        }

        $upload = $_FILES['file'] ?? null;
        if ($upload === null || ($upload['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            $_SESSION['error'] = 'Import failed: please choose a JSON file first.';
            header('Location: /admin');
            exit;
        }
        if ($upload['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($upload['tmp_name'])) {
            $_SESSION['error'] = 'Import failed: the file could not be uploaded.';
            header('Location: /admin');
            exit;
        }
        if ($upload['size'] > 1_048_576) {   // 1 MB is plenty for a book list
            $_SESSION['error'] = 'Import failed: the file is too large (max 1 MB).';
            header('Location: /admin');
            exit;
        }

        $data = json_decode((string) @file_get_contents($upload['tmp_name']), true);
        if (!is_array($data)) {
            $_SESSION['error'] = 'Import failed: the file is not a valid JSON array of books.';
            header('Location: /admin');
            exit;
        }
        $imported = 0;
        $skipped  = 0;
        foreach ($data as $row) {
            if (!is_array($row)) {
                $skipped++;
                continue;
            }
            $result = BookValidator::validate($row);
            $book   = $result['clean'];
            if ($result['errors'] !== [] || $repository->existsSame($book['title'], $book['author'], $book['year'])) {
                $skipped++;
                continue;
            }
            $repository->create($book['title'], $book['author'], $book['year'], $book['rating'], $book['annotation'], $book['genre'], $book['cover_url']);
            $imported++;
        }
        $_SESSION['flash'] = "Import done: {$imported} added, {$skipped} skipped.";
        header('Location: /admin');
        exit;
    }

    /**
     * POST /admin/invite — mint a one-time, 24-hour invite link for a new admin.
     * Only the sha256 of the token is stored; the raw token lives only in the link.
     */
    public static function invite(): void
    {
        Auth::requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !Csrf::check($_POST['csrf'] ?? null)) {
            http_response_code(400);
            echo 'Bad request.';
            exit;
        }
        $token = bin2hex(random_bytes(32));
        $expiresAt = (new DateTimeImmutable('+24 hours'))->format('Y-m-d H:i:s');
        (new InviteRepository())->create(hash('sha256', $token), $expiresAt);
        $_SESSION['invite_link'] = 'http://' . $_SERVER['HTTP_HOST'] . '/admin/accept?token=' . $token;
        header('Location: /admin');
        exit;
    }
}
