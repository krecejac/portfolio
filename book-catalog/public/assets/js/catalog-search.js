// Instant client-side filtering of the book grid. Each card carries a
// lowercase "data-search" string (title + author); we show only the cards that
// contain what was typed, and keep the heading count in sync.
(function () {
    'use strict';

    var input = document.getElementById('book-search');
    if (!input) {
        return;
    }

    var items = Array.prototype.slice.call(document.querySelectorAll('[data-search]'));
    var noResults = document.getElementById('no-results');
    var count = document.getElementById('count');

    input.addEventListener('input', function () {
        var query = input.value.trim().toLowerCase();
        var shown = 0;

        items.forEach(function (item) {
            var match = item.getAttribute('data-search').indexOf(query) !== -1;
            item.hidden = !match;
            if (match) {
                shown++;
            }
        });

        if (noResults) {
            noResults.hidden = shown !== 0;
        }
        if (count) {
            count.textContent = String(shown);
        }
    });
})();
