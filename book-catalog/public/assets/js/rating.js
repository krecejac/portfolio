// Progressive enhancement for the star rating widget on the book detail page.
//
// Each star is a real submit button, so rating works with JavaScript disabled
// (clicking a star posts that value). This only adds the expected hover feel:
// pointing at the third star lights up stars one to three, not just the third.
(function () {
    'use strict';

    document.querySelectorAll('.rate').forEach(function (form) {
        var stars = Array.prototype.slice.call(form.querySelectorAll('.star-btn'));

        stars.forEach(function (star, index) {
            star.addEventListener('mouseenter', function () {
                form.classList.add('is-hovering');
                stars.forEach(function (other, i) {
                    other.classList.toggle('hover-on', i <= index);
                });
            });
        });

        form.addEventListener('mouseleave', function () {
            form.classList.remove('is-hovering');
            stars.forEach(function (star) {
                star.classList.remove('hover-on');
            });
        });
    });
})();
