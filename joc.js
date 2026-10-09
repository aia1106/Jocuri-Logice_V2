/* Adaugă butonul "Înapoi" în paginile de joc. Ținta e citită din <meta name="joc-inapoi"> */
(function () {
    var m = document.querySelector('meta[name="joc-inapoi"]');
    var tinta = (m && m.content) || 'jocuri.html';
    var a = document.createElement('a');
    a.className = 'joc-inapoi';
    a.href = tinta;
    a.setAttribute('aria-label', 'Înapoi la lista de jocuri');
    a.innerHTML = '<span aria-hidden="true">←</span><span class="txt">Înapoi</span>';
    document.body.appendChild(a);
})();
