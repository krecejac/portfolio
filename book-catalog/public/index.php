<?php
declare(strict_types=1);

/**
 * Front controller.
 *
 * Apache sends every request that isn't a real file to this script (see
 * public/.htaccess). It loads the application code, opens the session, maps each
 * URL path to a controller action, and dispatches the current request. The
 * controllers (src/Controllers/) hold the actual page logic; this file is just
 * the wiring and the route table.
 */

require __DIR__ . '/../src/helpers.php';
require __DIR__ . '/../src/Database.php';
require __DIR__ . '/../src/UserRepository.php';
require __DIR__ . '/../src/BookRepository.php';
require __DIR__ . '/../src/Auth.php';
require __DIR__ . '/../src/Csrf.php';
require __DIR__ . '/../src/BookValidator.php';
require __DIR__ . '/../src/InviteRepository.php';
require __DIR__ . '/../src/FavouriteRepository.php';
require __DIR__ . '/../src/RatingRepository.php';
require __DIR__ . '/../src/OpenLibrary.php';
require __DIR__ . '/../src/Router.php';
require __DIR__ . '/../src/Controllers/CatalogController.php';
require __DIR__ . '/../src/Controllers/AuthController.php';
require __DIR__ . '/../src/Controllers/ReaderController.php';
require __DIR__ . '/../src/Controllers/AdminController.php';

$path = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

// Everyone gets a session: it carries login state (users sign in from the public
// pages too) and the CSRF token for the forms.
Auth::start();

$router = new Router();

// Public catalogue.
$router->on('',                   [CatalogController::class, 'index']);

// Accounts.
$router->on('/login',             [AuthController::class, 'login']);
$router->on('/signup',            [AuthController::class, 'signup']);
$router->on('/logout',            [AuthController::class, 'logout']);

// Signed-in reader actions.
$router->on('/favourites',        [ReaderController::class, 'favourites']);
$router->on('/favourite',         [ReaderController::class, 'toggleFavourite']);
$router->on('/rate',              [ReaderController::class, 'rate']);

// Admin area.
$router->on('/admin',             [AdminController::class, 'dashboard']);
$router->on('/admin/book-lookup', [AdminController::class, 'bookLookup']);
$router->on('/admin/add',         [AdminController::class, 'add']);
$router->on('/admin/edit',        [AdminController::class, 'edit']);
$router->on('/admin/delete',      [AdminController::class, 'delete']);
$router->on('/admin/import',      [AdminController::class, 'import']);
$router->on('/admin/invite',      [AdminController::class, 'invite']);
$router->on('/admin/accept',      [AuthController::class, 'acceptInvite']);

// Back-compat: the auth URLs used to live under /admin.
$router->redirect('/admin/login',  '/login');
$router->redirect('/admin/logout', '/logout');

$router->dispatch($path);
