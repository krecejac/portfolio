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
    var printRows = Array.prototype.slice.call(document.querySelectorAll('.print-list tbody tr[data-id]'));
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
        var decade = year ? parseInt(year.value, 10) : NaN;
        var r = rating ? parseInt(rating.value, 10) : 0;
        var shown = 0;
        var visible = {};

        items.forEach(function (item) {
            var itemYear = parseInt(item.getAttribute('data-year'), 10);
            var ok =
                item.getAttribute('data-search').indexOf(q) !== -1 &&
                (g === '' || item.getAttribute('data-genre') === g) &&
                (a === '' || item.getAttribute('data-author') === a) &&
                (isNaN(decade) || Math.floor(itemYear / 10) * 10 === decade) &&
                (!r || parseInt(item.getAttribute('data-rating'), 10) >= r);
            item.hidden = !ok;
            if (ok) { shown++; visible[item.getAttribute('data-id')] = true; }
        });

        // Keep the print table in sync so printing outputs the current selection.
        printRows.forEach(function (row) {
            row.hidden = !visible[row.getAttribute('data-id')];
        });

        if (noResults) { noResults.hidden = shown !== 0; }
        if (count) { count.textContent = String(shown); }

        var active = q !== '' || g !== '' || a !== '' || !isNaN(decade) || !!r;
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
