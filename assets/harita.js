(function () {
    var el = document.getElementById('harita');
    if (!el || typeof L === 'undefined') return;

    var noktalar = window.YOL_NOKTALAR || [];
    var harita = L.map(el, { scrollWheelZoom: false }).setView([45, 15], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(harita);

    var isaret = L.divIcon({ className: 'isaret', iconSize: [16, 16], iconAnchor: [8, 8] });
    var sinirlar = [];

    noktalar.forEach(function (n) {
        var a = document.createElement('a');
        a.href = n.url;
        a.textContent = n.baslik;
        var kutu = document.createElement('div');
        kutu.appendChild(a);
        if (n.yer) {
            var y = document.createElement('span');
            y.className = 'yer';
            y.textContent = n.yer;
            kutu.appendChild(y);
        }
        L.marker(n.konum, { icon: isaret, title: n.baslik }).addTo(harita).bindPopup(kutu);
        sinirlar.push(n.konum);
    });

    if (sinirlar.length > 1) harita.fitBounds(sinirlar, { padding: [40, 40] });
    else if (sinirlar.length === 1) harita.setView(sinirlar[0], 6);
})();
