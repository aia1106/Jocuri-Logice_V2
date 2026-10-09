(function () {
    var btn = document.getElementById('menu-btn');
    var menu = document.getElementById('meniu');
    if (!btn || !menu) return;

    function setOpen(open) {
        menu.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    btn.addEventListener('click', function () {
        setOpen(!menu.classList.contains('open'));
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { setOpen(false); btn.focus(); }
    });

    document.addEventListener('click', function (e) {
        if (!menu.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    });
})();
