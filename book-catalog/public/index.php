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
        header('Location: /?id=' . $bookId);
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
        $inviteLink = $_SESSION['invite_link'] ?? null;
        unset($_SESSION['flash'], $_SESSION['invite_link']);
        $csrf = Csrf::token();
        require __DIR__ . '/../views/admin/dashboard.php';
        break;

    // Admin: add a book.
    case '/admin/add':
        Auth::requireAdmin();
        $errors = [];
        $old = ['title' => '', 'author' => '', 'year' => '', 'rating' => '', 'annotation' => ''];
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
                $repository->create($book['title'], $book['author'], $book['year'], $book['rating'], $book['annotation']);
                $_SESSION['flash'] = 'Book added.';
                header('Location: /admin');
                exit;
            }
        }
        $csrf = Csrf::token();
        require __DIR__ . '/../views/admin/add.php';
        break;

    // Admin: import books from the prepared books.json file.
    case '/admin/import':
        Auth::requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !Csrf::check($_POST['csrf'] ?? null)) {
            http_response_code(400);
            echo 'Bad request.';
            exit;
        }
        $data = json_decode((string) @file_get_contents(__DIR__ . '/../books.json'), true);
        if (!is_array($data)) {
            $_SESSION['flash'] = 'Import failed: books.json is missing or not valid JSON.';
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
            $repository->create($book['title'], $book['author'], $book['year'], $book['rating'], $book['annotation']);
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
