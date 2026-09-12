<?php
declare(strict_types=1);

/**
 * Front controller.
 *
 * Apache sends every request that isn't a real file to this script (see
 * public/.htaccess). It looks at the URL path and renders the matching view:
 * the public catalogue, the signed-in user pages (favourites, rating), or the
 * admin-only pages.
 */

require __DIR__ . '/../src/helpers.php';
require __DIR__ . '/../src/BookRepository.php';
require __DIR__ . '/../src/Auth.php';
require __DIR__ . '/../src/Csrf.php';
require __DIR__ . '/../src/BookValidator.php';
require __DIR__ . '/../src/InviteRepository.php';
require __DIR__ . '/../src/FavouriteRepository.php';
require __DIR__ . '/../src/RatingRepository.php';
require __DIR__ . '/../src/OpenLibrary.php';

$path = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

// Everyone gets a session now: it carries login state (users sign in from the
// public pages too) and the CSRF token for the forms.
Auth::start();

$repository = new BookRepository();

switch ($path) {
    // Public: one book's detail (?id=NN), or the full catalogue.
    case '':
        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        if ($id) {
            $book = $repository->find($id);
            $isFavourite = false;
            $userRating = null;
            $csrf = '';
            if ($book !== null && Auth::check()) {
                $isFavourite = (new FavouriteRepository())->isFavourite(Auth::id(), (int) $book['id']);
                $userRating  = (new RatingRepository())->userRating(Auth::id(), (int) $book['id']);
                $csrf = Csrf::token();
            }
            require __DIR__ . '/../views/detail.php';
        } else {
            $books = $repository->all();
            // Which of these has the signed-in user favourited (for the heart on
            // each card)? Empty for guests, who see no heart at all.
            $favIds = [];
            $csrf = '';
            if (Auth::check()) {
                $favIds = (new FavouriteRepository())->idsForUser(Auth::id());
                $csrf = Csrf::token();
            }
            require __DIR__ . '/../views/list.php';
        }
        break;

    // Sign in (any user or admin).
    case '/login':
        if (Auth::check()) {
            header('Location: /');
            exit;
        }
        $notice = $_SESSION['flash'] ?? null;
        unset($_SESSION['flash']);
        $error = null;
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $username = trim((string) ($_POST['username'] ?? ''));
            $password = (string) ($_POST['password'] ?? '');
            if (Auth::attempt($username, $password)) {
                header('Location: ' . (Auth::isAdmin() ? '/admin' : '/'));
                exit;
            }
            $error = 'Invalid username or password.';
        }
        require __DIR__ . '/../views/login.php';
        break;

    // Public sign-up (creates a normal user account).
    case '/signup':
        if (Auth::check()) {
            header('Location: /');
            exit;
        }
        $errors = [];
        $old = ['username' => ''];
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (!Csrf::check($_POST['csrf'] ?? null)) {
                http_response_code(400);
                echo 'Invalid CSRF token.';
                exit;
            }
            $old['username'] = trim((string) ($_POST['username'] ?? ''));
            $password = (string) ($_POST['password'] ?? '');
            $users = new UserRepository();

            if ($old['username'] === '') {
                $errors['username'] = 'Username is required.';
            } elseif (mb_strlen($old['username']) > 50) {
                $errors['username'] = 'Username is too long (max 50 characters).';
            } elseif ($users->findByUsername($old['username']) !== null) {
                $errors['username'] = 'That username is already taken.';
            }
            if (mb_strlen($password) < 8) {
                $errors['password'] = 'Password must be at least 8 characters.';
            }

            if ($errors === []) {
                $id = $users->create($old['username'], password_hash($password, PASSWORD_DEFAULT), 'user');
                Auth::login($id, $old['username'], 'user');
                header('Location: /');
                exit;
            }
        }
        $csrf = Csrf::token();
        require __DIR__ . '/../views/signup.php';
        break;

    case '/logout':
        Auth::logout();
        header('Location: /');
        exit;

    // A signed-in user's favourite books.
    case '/favourites':
        Auth::requireLogin();
        $books = (new FavouriteRepository())->booksForUser(Auth::id());
        $csrf = Csrf::token();
        require __DIR__ . '/../views/favourites.php';
        break;

    // Toggle a favourite, then return to the book.
    case '/favourite':
        Auth::requireLogin();
        $bookId = filter_input(INPUT_POST, 'book_id', FILTER_VALIDATE_INT);
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !Csrf::check($_POST['csrf'] ?? null) || !$bookId) {
            http_response_code(400);
            echo 'Bad request.';
            exit;
        }
        (new FavouriteRepository())->toggle(Auth::id(), $bookId);
        header('Location: ' . safe_return($_POST['return'] ?? '', '/?id=' . $bookId));
        exit;

    // Rate a book (1-5), then return to it.
    case '/rate':
        Auth::requireLogin();
        $bookId = filter_input(INPUT_POST, 'book_id', FILTER_VALIDATE_INT);
        $rating = filter_input(INPUT_POST, 'rating', FILTER_VALIDATE_INT);
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !Csrf::check($_POST['csrf'] ?? null)
            || !$bookId || $rating === false || $rating < 1 || $rating > 5) {
            http_response_code(400);
            echo 'Bad request.';
            exit;
        }
        (new RatingRepository())->rate(Auth::id(), $bookId, $rating);
        header('Location: /?id=' . $bookId);
        exit;

    // Admin dashboard (admins only).
    case '/admin':
        Auth::requireAdmin();
        $flash = $_SESSION['flash'] ?? null;
        $error = $_SESSION['error'] ?? null;
        $inviteLink = $_SESSION['invite_link'] ?? null;
        unset($_SESSION['flash'], $_SESSION['error'], $_SESSION['invite_link']);
        $csrf = Csrf::token();
        $books = $repository->all();
        require __DIR__ . '/../views/admin/dashboard.php';
        break;

    // Admin: JSON metadata lookup for the add/edit form's title autocomplete.
    case '/admin/book-lookup':
        Auth::requireAdmin();
        header('Content-Type: application/json');
        echo json_encode(OpenLibrary::search((string) ($_GET['q'] ?? '')));
        exit;

    // Admin: add a book.
    case '/admin/add':
        Auth::requireAdmin();
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
        require __DIR__ . '/../views/admin/add.php';
        break;

    // Admin: edit an existing book.
    case '/admin/edit':
        Auth::requireAdmin();
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
        require __DIR__ . '/../views/admin/edit.php';
        break;

    // Admin: delete a book.
    case '/admin/delete':
        Auth::requireAdmin();
        $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !Csrf::check($_POST['csrf'] ?? null) || !$id) {
            http_response_code(400);
            echo 'Bad request.';
            exit;
        }
        $repository->delete($id);
        $_SESSION['flash'] = 'Book deleted.';
        header('Location: /admin');
        exit;

    // Admin: import books from a JSON file the admin chooses. Each entry goes
    // through the same validation as the add form, and duplicates are skipped.
    case '/admin/import':
        Auth::requireAdmin();
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

    // Admin: create a one-time invite link for a new admin account.
    case '/admin/invite':
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

    // Public: accept an invite and set up your own admin account.
    case '/admin/accept':
        $token = (string) ($_POST['token'] ?? $_GET['token'] ?? '');
        $invite = (new InviteRepository())->findUsable(hash('sha256', $token));
        $errors = [];
        $old = ['username' => ''];
        if ($invite === null) {
            http_response_code(400);
            $invalidInvite = true;
            require __DIR__ . '/../views/admin/accept.php';
            break;
        }
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (!Csrf::check($_POST['csrf'] ?? null)) {
                http_response_code(400);
                echo 'Invalid CSRF token.';
                exit;
            }
            $old['username'] = trim((string) ($_POST['username'] ?? ''));
            $password = (string) ($_POST['password'] ?? '');
            $users = new UserRepository();
            if ($old['username'] === '') {
                $errors['username'] = 'Username is required.';
            } elseif (mb_strlen($old['username']) > 50) {
                $errors['username'] = 'Username is too long (max 50 characters).';
            } elseif ($users->findByUsername($old['username']) !== null) {
                $errors['username'] = 'That username is already taken.';
            }
            if (mb_strlen($password) < 8) {
                $errors['password'] = 'Password must be at least 8 characters.';
            }
            if ($errors === []) {
                $users->create($old['username'], password_hash($password, PASSWORD_DEFAULT), 'admin');
                (new InviteRepository())->markUsed((int) $invite['id']);
                $_SESSION['flash'] = 'Account created. You can now log in.';
                header('Location: /login');
                exit;
            }
        }
        $invalidInvite = false;
        $csrf = Csrf::token();
        require __DIR__ . '/../views/admin/accept.php';
        break;

    // Back-compat: old admin auth URLs.
    case '/admin/login':
        header('Location: /login');
        exit;
    case '/admin/logout':
        header('Location: /logout');
        exit;

    default:
        http_response_code(404);
        echo 'Page not found.';
}
