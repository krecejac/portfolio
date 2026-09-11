<?php
declare(strict_types=1);

require __DIR__ . '/../src/BookRepository.php';
require __DIR__ . '/../src/Auth.php';
require __DIR__ . '/../src/Csrf.php';

// Work out which route was requested. REQUEST_URI looks like
// "/admin/login?foo=bar"; we keep only the path and drop any trailing slash
// so that "/admin/" and "/admin" are treated as the same route.
$path = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

// Only the admin area needs a session, so we don't set a cookie for anonymous
// visitors browsing the public list.
if (str_starts_with($path, '/admin')) {
    Auth::start();
}

$repository = new BookRepository();

// Tiny router: match the path and render the matching view. Everything not
// listed here falls through to a 404.
switch ($path) {
    // Public: book detail (?id=NN) or, without an id, the full list.
    case '':
        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        if ($id) {
            $book = $repository->find($id);
            require __DIR__ . '/../views/detail.php';
        } else {
            $books = $repository->all();
            require __DIR__ . '/../views/list.php';
        }
        break;

    // Admin login: show the form (GET) or check the credentials (POST).
    case '/admin/login':
        if (Auth::check()) {
            header('Location: /admin');   // already logged in
            exit;
        }
        $error = null;
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $username = trim((string) ($_POST['username'] ?? ''));
            $password = (string) ($_POST['password'] ?? '');
            if (Auth::attempt($username, $password)) {
                header('Location: /admin');
                exit;
            }
            $error = 'Invalid username or password.';
        }
        require __DIR__ . '/../views/admin/login.php';
        break;

    // Admin logout: end the session and go back to the login form.
    case '/admin/logout':
        Auth::logout();
        header('Location: /admin/login');
        exit;

    // Admin dashboard: protected — only reachable once logged in.
    case '/admin':
        if (!Auth::check()) {
            header('Location: /admin/login');
            exit;
        }
        $username = Auth::username();
        // Read and clear the one-off flash message (set after adding/importing).
        $flash = $_SESSION['flash'] ?? null;
        unset($_SESSION['flash']);
        $csrf = Csrf::token();   // for the import button's form
        require __DIR__ . '/../views/admin/dashboard.php';
        break;

    // Admin: add a new book. GET shows the form, POST validates and saves it.
    case '/admin/add':
        if (!Auth::check()) {
            header('Location: /admin/login');
            exit;
        }

        $errors = [];
        $old = ['title' => '', 'author' => '', 'year' => '', 'rating' => '', 'annotation' => ''];

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            // Reject the request outright if the CSRF token is missing/wrong.
            if (!Csrf::check($_POST['csrf'] ?? null)) {
                http_response_code(400);
                echo 'Invalid CSRF token.';
                exit;
            }

            // Collect and trim the submitted values (kept for refilling the form).
            foreach ($old as $key => $_) {
                $old[$key] = trim((string) ($_POST[$key] ?? ''));
            }

            // --- Server-side validation: the source of truth --------------
            if ($old['title'] === '') {
                $errors['title'] = 'Title is required.';
            } elseif (mb_strlen($old['title']) > 255) {
                $errors['title'] = 'Title is too long (max 255 characters).';
            }

            if ($old['author'] === '') {
                $errors['author'] = 'Author is required.';
            } elseif (mb_strlen($old['author']) > 255) {
                $errors['author'] = 'Author is too long (max 255 characters).';
            }

            $year = filter_var($old['year'], FILTER_VALIDATE_INT);
            if ($old['year'] === '') {
                $errors['year'] = 'Year is required.';
            } elseif ($year === false || $year < 1 || $year > 2100) {
                $errors['year'] = 'Year must be a whole number between 1 and 2100.';
            }

            $rating = null;
            if ($old['rating'] !== '') {
                $rating = filter_var($old['rating'], FILTER_VALIDATE_INT);
                if ($rating === false || $rating < 1 || $rating > 5) {
                    $errors['rating'] = 'Rating must be a whole number between 1 and 5.';
                }
            }

            // No errors -> save, then redirect (PRG) with a flash message.
            if (empty($errors)) {
                $annotation = $old['annotation'] === '' ? null : $old['annotation'];
                $repository->create($old['title'], $old['author'], (int) $year, $rating, $annotation);
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
        if (!Auth::check()) {
            header('Location: /admin/login');
            exit;
        }
        // State-changing action: must be a POST with a valid CSRF token.
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

            // Normalise, then apply the same rules as the add-book form.
            $title      = trim((string) ($row['title'] ?? ''));
            $author     = trim((string) ($row['author'] ?? ''));
            $year       = filter_var($row['year'] ?? null, FILTER_VALIDATE_INT);
            $rating     = isset($row['rating']) ? filter_var($row['rating'], FILTER_VALIDATE_INT) : null;
            $annotation = isset($row['annotation']) ? trim((string) $row['annotation']) : '';

            $valid = $title !== '' && mb_strlen($title) <= 255
                && $author !== '' && mb_strlen($author) <= 255
                && $year !== false && $year >= 1 && $year <= 2100
                && ($rating === null || ($rating !== false && $rating >= 1 && $rating <= 5));

            if (!$valid || $repository->existsSame($title, $author, (int) $year)) {
                $skipped++;
                continue;
            }

            $repository->create($title, $author, (int) $year, $rating, $annotation === '' ? null : $annotation);
            $imported++;
        }

        $_SESSION['flash'] = "Import done: {$imported} added, {$skipped} skipped.";
        header('Location: /admin');
        exit;

    // Unknown route.
    default:
        http_response_code(404);
        echo 'Page not found.';
}
