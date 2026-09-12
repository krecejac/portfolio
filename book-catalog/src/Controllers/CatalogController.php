<?php
declare(strict_types=1);

/**
 * The public catalogue: the book list and a single book's detail. Everything
 * here is readable without signing in; the only per-user extras are the
 * favourite hearts and the "your rating" control, which are added when someone
 * is logged in.
 */
final class CatalogController
{
    /**
     * GET / — a single book's detail when ?id=NN is present, otherwise the whole
     * catalogue. The two share a route because they are the two faces of the
     * same public page.
     */
    public static function index(): void
    {
        $repository = new BookRepository();
        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

        if ($id) {
            $book = $repository->find($id);
            $isFavourite = false;
            $userRating = null;
            $csrf = '';
            // Only a signed-in viewer gets the favourite/rating controls, so only
            // then do we look those up (and mint a CSRF token for their forms).
            if ($book !== null && Auth::check()) {
                $isFavourite = (new FavouriteRepository())->isFavourite(Auth::id(), (int) $book['id']);
                $userRating  = (new RatingRepository())->userRating(Auth::id(), (int) $book['id']);
                $csrf = Csrf::token();
            }
            require view_path('detail');
            return;
        }

        $books = $repository->all();
        // Which of these has the signed-in user favourited (for the heart on each
        // card)? Empty for guests, who see no heart at all.
        $favIds = [];
        $csrf = '';
        if (Auth::check()) {
            $favIds = (new FavouriteRepository())->idsForUser(Auth::id());
            $csrf = Csrf::token();
        }
        require view_path('list');
    }
}
