// Progressive enhancement for the catalogue's favourite hearts. A plain form
// submit would reload the page and jump back to the top; instead we toggle the
// favourite in the background with fetch() so the click keeps your scroll
// position. Without JS (or if the request fails) the form still posts normally.
(function () {
    'use strict';

    if (!window.fetch) {
        return;
    }

    document.querySelectorAll('form.fav-toggle').forEach(function (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = form.querySelector('.fav-toggle__btn');
            if (!btn || btn.disabled) {
                return;
            }
            btn.disabled = true;

            fetch(form.action, {
                method: 'POST',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                body: new URLSearchParams(new FormData(form))
            })
                .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
                .then(function (res) {
                    var on = !!res.favourite;
                    btn.classList.toggle('is-on', on);
                    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
                    btn.setAttribute('aria-label', on ? 'Remove from favourites' : 'Add to favourites');
                    btn.disabled = false;
                })
                .catch(function () {
                    // Something went wrong — fall back to a normal submit.
                    form.submit();
                });
        });
    });
})();
