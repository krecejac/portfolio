// Combined client-side filtering of the book grid: free-text search plus genre,
// author, year and minimum-rating dropdowns. A card shows only when it matches
// the text AND every active filter. The heading count and the empty state stay
// in sync, and a "Clear filters" button appears once anything is narrowed.
(function () {
    'use strict';

    var search = document.getElementById('book-search');
    if (!search) {
        return;
    }

    var items = Array.prototype.slice.call(document.querySelectorAll('.book-card[data-search]'));
    var noResults = document.getElementById('no-results');
    var count = document.getElementById('count');
    var genre = document.getElementById('filter-genre');
    var author = document.getElementById('filter-author');
    var year = document.getElementById('filter-year');
    var rating = document.getElementById('filter-rating');
    var clear = document.getElementById('filter-clear');

    function apply() {
        var q = search.value.trim().toLowerCase();
        var g = genre ? genre.value : '';
        var a = author ? author.value : '';
        var y = year ? year.value : '';
        var r = rating ? parseInt(rating.value, 10) : 0;
        var shown = 0;

        items.forEach(function (item) {
            var ok =
                item.getAttribute('data-search').indexOf(q) !== -1 &&
                (g === '' || item.getAttribute('data-genre') === g) &&
                (a === '' || item.getAttribute('data-author') === a) &&
                (y === '' || item.getAttribute('data-year') === y) &&
                (!r || parseInt(item.getAttribute('data-rating'), 10) >= r);
            item.hidden = !ok;
            if (ok) { shown++; }
        });

        if (noResults) { noResults.hidden = shown !== 0; }
        if (count) { count.textContent = String(shown); }

        var active = q !== '' || g !== '' || a !== '' || y !== '' || !!r;
        if (clear) { clear.hidden = !active; }
    }

    [search, genre, author, year, rating].forEach(function (control) {
        if (control) {
            control.addEventListener('input', apply);
            control.addEventListener('change', apply);
        }
    });

    if (clear) {
        clear.addEventListener('click', function () {
            search.value = '';
            [genre, author, year, rating].forEach(function (c) { if (c) { c.value = ''; } });
            apply();
        });
    }
})();
