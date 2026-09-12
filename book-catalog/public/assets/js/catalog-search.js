// Combined client-side filtering of the book grid: free-text search plus genre,
// author, a calendar-style year picker and a minimum-rating dropdown. A card
// shows only when it matches the text AND every active filter. The heading count
// and the empty state stay in sync, and a "Clear filters" button appears once
// anything is narrowed.
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
    var author = document.getElementById('filter-author');   // holds an author initial
    var rating = document.getElementById('filter-rating');
    var clear = document.getElementById('filter-clear');

    var selectedYear = null;
    var resetYear = function () {};   // replaced below when the picker is on the page

    function apply() {
        var q = search.value.trim().toLowerCase();
        var g = genre ? genre.value : '';
        var a = author ? author.value : '';
        var r = rating ? parseInt(rating.value, 10) : 0;
        var shown = 0;
        var visible = {};

        items.forEach(function (item) {
            var itemYear = parseInt(item.getAttribute('data-year'), 10);
            var ok =
                item.getAttribute('data-search').indexOf(q) !== -1 &&
                (g === '' || item.getAttribute('data-genre') === g) &&
                (a === '' || item.getAttribute('data-initial') === a) &&
                (selectedYear === null || itemYear === selectedYear) &&
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

        var active = q !== '' || g !== '' || a !== '' || selectedYear !== null || !!r;
        if (clear) { clear.hidden = !active; }
    }

    [search, genre, author, rating].forEach(function (control) {
        if (control) {
            control.addEventListener('input', apply);
            control.addEventListener('change', apply);
        }
    });

    if (clear) {
        clear.addEventListener('click', function () {
            search.value = '';
            [genre, author, rating].forEach(function (c) { if (c) { c.value = ''; } });
            resetYear();
            apply();
        });
    }

    // --- Year picker: a calendar-style popover paged by decade ---------
    // Instead of a long year dropdown or two number fields (fiddly to type on a
    // phone), pick a year from a decade grid; the arrows step between decades and
    // years with no book are greyed out so a pick never lands on an empty result.
    var yp = document.getElementById('yearpick');
    if (yp) {
        var ypBtn = document.getElementById('yearpick-button');
        var ypLabel = document.getElementById('yearpick-label');
        var ypPanel = document.getElementById('yearpick-panel');
        var ypDecade = document.getElementById('yearpick-decade');
        var ypGrid = document.getElementById('yearpick-grid');
        var ypPrev = document.getElementById('yearpick-prev');
        var ypNext = document.getElementById('yearpick-next');
        var ypClear = document.getElementById('yearpick-clear');

        var withBooks = {};
        try {
            JSON.parse(yp.getAttribute('data-years') || '[]').forEach(function (y) { withBooks[y] = true; });
        } catch (e) { /* no data — every year just shows as empty */ }
        var maxYear = parseInt(yp.getAttribute('data-max'), 10) || new Date().getFullYear();
        var decadeStart = Math.floor(maxYear / 10) * 10;   // open on the newest decade

        function render() {
            ypDecade.textContent = decadeStart + '–' + (decadeStart + 9);
            ypGrid.textContent = '';
            // One leading and one trailing year give the grid a full 4x3 shape and
            // let the edges double as "step into the neighbouring decade".
            for (var y = decadeStart - 1; y <= decadeStart + 10; y++) {
                var cell = document.createElement('button');
                cell.type = 'button';
                cell.className = 'yearpick__year';
                cell.textContent = String(y);
                cell.setAttribute('data-year', String(y));
                var adjacent = y < decadeStart || y > decadeStart + 9;
                if (adjacent) { cell.classList.add('is-adjacent'); }
                if (y === selectedYear) { cell.classList.add('is-selected'); }
                if (!adjacent && !withBooks[y]) { cell.classList.add('is-empty'); cell.disabled = true; }
                ypGrid.appendChild(cell);
            }
        }

        function label() {
            ypLabel.textContent = selectedYear === null ? 'Any year' : String(selectedYear);
            yp.classList.toggle('is-set', selectedYear !== null);
            ypClear.hidden = selectedYear === null;
        }

        function open() { ypPanel.hidden = false; ypBtn.setAttribute('aria-expanded', 'true'); render(); }
        function close() { ypPanel.hidden = true; ypBtn.setAttribute('aria-expanded', 'false'); }

        resetYear = function () { selectedYear = null; label(); if (!ypPanel.hidden) { render(); } };

        ypBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (ypPanel.hidden) { open(); } else { close(); }
        });
        ypPrev.addEventListener('click', function () { decadeStart -= 10; render(); });
        ypNext.addEventListener('click', function () { decadeStart += 10; render(); });

        ypGrid.addEventListener('click', function (e) {
            var btn = e.target.closest ? e.target.closest('.yearpick__year') : null;
            if (!btn || btn.disabled) { return; }
            var y = parseInt(btn.getAttribute('data-year'), 10);
            if (btn.classList.contains('is-adjacent')) {   // step into that decade
                decadeStart = Math.floor(y / 10) * 10;
                render();
                return;
            }
            selectedYear = (selectedYear === y) ? null : y;   // clicking the same year clears it
            label();
            apply();
            close();
        });

        ypClear.addEventListener('click', function () { selectedYear = null; label(); render(); apply(); });

        // Close when clicking away or pressing Escape.
        document.addEventListener('click', function (e) {
            if (!ypPanel.hidden && !yp.contains(e.target)) { close(); }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !ypPanel.hidden) { close(); ypBtn.focus(); }
        });

        label();
    }
})();
