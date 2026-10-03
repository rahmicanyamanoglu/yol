/* Hayal edilen, var olan.
   Her yerin iki konumu var: zihindeki (hayal_konum) ve haritadaki (konum).
   Kaydırıcı ikisi arasında gidip gelir; "Sen de dene" ziyaretçiye kendi
   hayal haritasını çizdirir, sonra gerçeği gösterir. */
(function () {
    var el = document.getElementById('harita');
    if (!el || typeof L === 'undefined') return;

    var kaydirici = document.getElementById('ikilik');
    var deneBtn = document.getElementById('dene');
    var panel = document.getElementById('deneme');
    var panelYazi = document.getElementById('deneme-yazi');
    var gosterBtn = document.getElementById('goster');
    var kopyalaBtn = document.getElementById('kopyala');
    var cikBtn = document.getElementById('cik');
    var azHareket = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var noktalar = (window.YOL_NOKTALAR || []).map(function (n) {
        n.gercekLL = L.latLng(n.konum);
        n.hayalLL = n.hayal_konum ? L.latLng(n.hayal_konum) : null;
        return n;
    });

    var harita = L.map(el, { scrollWheelZoom: false, zoomSnap: 0.25 });

    function sigdir() {
        var s = noktalar.map(function (n) { return n.gercekLL; });
        noktalar.forEach(function (n) { if (n.hayalLL) s.push(n.hayalLL); });
        if (s.length > 1) harita.fitBounds(s, { padding: [40, 40] });
        else if (s.length === 1) harita.setView(s[0], 6);
        else harita.setView([45, 15], 4);
    }

    sigdir();

    var zemin = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(harita);

    // Hayal zemini: boş kâğıt üstünde enlem-boylam ızgarası
    var izgara = L.layerGroup().addTo(harita);
    for (var e = -80; e <= 80; e += 10) {
        L.polyline([[e, -180], [e, 180]], { className: 'izgara', interactive: false }).addTo(izgara);
    }
    for (var b = -180; b <= 180; b += 10) {
        L.polyline([[-85, b], [85, b]], { className: 'izgara', interactive: false }).addTo(izgara);
    }

    var isaret = L.divIcon({ className: 'isaret', iconSize: [16, 16], iconAnchor: [8, 8] });

    function ara(a, c, t) {
        return L.latLng(a.lat + (c.lat - a.lat) * t, a.lng + (c.lng - a.lng) * t);
    }

    function kutu(n) {
        var hayalde = durum.t < 0.5;
        var d = document.createElement('div');
        var a = document.createElement('a');
        a.href = n.url;
        a.textContent = n.baslik;
        d.appendChild(a);
        var etiket = document.createElement('span');
        etiket.className = 'yer';
        etiket.textContent = hayalde ? 'Hayal edilen' : 'Var olan';
        d.appendChild(etiket);
        var p = document.createElement('p');
        var metin = hayalde ? n.hayal : n.gercek;
        p.textContent = metin || (hayalde ? 'Henüz hayal yazılmadı.' : 'Henüz yazılmadı.');
        if (!metin) p.className = 'soluk';
        d.appendChild(p);
        return d;
    }

    noktalar.forEach(function (n) {
        n.cizgi = L.polyline([], { className: 'fark', interactive: false }).addTo(harita);
        n.marker = L.marker(n.gercekLL, { icon: isaret, title: n.baslik }).addTo(harita);
        n.marker.bindPopup(function () { return kutu(n); });
    });

    var durum = { t: 1, deneme: false };

    function ciz() {
        var t = durum.t;
        zemin.setOpacity(t);
        el.style.setProperty('--hayal', (1 - t).toFixed(3));
        el.classList.toggle('hayalde', t < 0.5);
        noktalar.forEach(function (n) {
            var h = n.hayalLL || n.gercekLL;
            var konum = ara(h, n.gercekLL, t);
            n.marker.setLatLng(konum);
            var ikon = n.marker.getElement();
            if (ikon) ikon.classList.toggle('hayalsiz', !n.hayalLL && t < 0.5);
            n.cizgi.setLatLngs(n.hayalLL ? [n.hayalLL, konum] : []);
        });
    }

    ciz();

    kaydirici.addEventListener('input', function () {
        durum.t = kaydirici.value / 100;
        harita.closePopup();
        ciz();
    });

    /* ---- Sen de dene ---- */

    function tepsiyeDiz() {
        var s = harita.getBounds();
        var kuzey = s.getNorth(), guney = s.getSouth(), bati = s.getWest(), dogu = s.getEast();
        var sira = noktalar.length > 8 ? 2 : 1;
        var sirada = Math.ceil(noktalar.length / sira);
        noktalar.forEach(function (n, i) {
            var r = Math.floor(i / sirada), k = i % sirada;
            var lat = guney + (kuzey - guney) * (0.06 + r * 0.15);
            var lng = bati + (dogu - bati) * (0.06 + 0.88 * (sirada === 1 ? 0.5 : k / (sirada - 1)));
            n.tahmin = L.latLng(lat, lng);
            n.marker.setLatLng(n.tahmin);
        });
    }

    function denemeyeGir() {
        durum.deneme = true;
        harita.closePopup();
        zemin.setOpacity(0);
        el.style.setProperty('--hayal', 1);
        el.classList.add('hayalde', 'denemede');
        kaydirici.disabled = true;
        deneBtn.disabled = true;
        panel.hidden = false;
        gosterBtn.hidden = false;
        kopyalaBtn.hidden = true;
        panelYazi.textContent = 'Haritaya bakmadan doldur: her noktayı, olduğunu düşündüğün yere sürükle. Sonra "Göster"e bas.';
        noktalar.forEach(function (n) {
            n.cizgi.setLatLngs([]);
            n.marker.unbindPopup();
            n.marker.bindTooltip(n.baslik, { permanent: true, direction: 'top', offset: [0, -8], className: 'etiket' });
            var ikon = n.marker.getElement();
            if (ikon) ikon.classList.remove('hayalsiz');
            n.marker.dragging.enable();
            n.marker.on('dragend', function () { n.tahmin = n.marker.getLatLng(); });
        });
        tepsiyeDiz();
    }

    function goster() {
        gosterBtn.hidden = true;
        noktalar.forEach(function (n) { n.marker.dragging.disable(); });
        var sure = azHareket ? 0 : 1400, bas = null;

        function kare(zaman) {
            if (bas === null) bas = zaman;
            var p = sure ? Math.min(1, (zaman - bas) / sure) : 1;
            var y = 1 - Math.pow(1 - p, 3);
            zemin.setOpacity(y);
            el.style.setProperty('--hayal', (1 - y).toFixed(3));
            noktalar.forEach(function (n) {
                var k = ara(n.tahmin, n.gercekLL, y);
                n.marker.setLatLng(k);
                n.cizgi.setLatLngs([n.tahmin, k]);
            });
            if (p < 1) requestAnimationFrame(kare);
            else sonuc();
        }
        requestAnimationFrame(kare);
    }

    function sonuc() {
        el.classList.remove('hayalde');
        var toplam = 0, enUzak = null;
        noktalar.forEach(function (n) {
            n.sapma = harita.distance(n.tahmin, n.gercekLL) / 1000;
            toplam += n.sapma;
            if (!enUzak || n.sapma > enUzak.sapma) enUzak = n;
        });
        var ort = noktalar.length ? Math.round(toplam / noktalar.length) : 0;
        panelYazi.textContent = 'Hayalin gerçekten ortalama ' + ort.toLocaleString('tr-TR') + ' km uzakta.' +
            (enUzak ? ' En çok şaşırdığın yer: ' + enUzak.baslik + ' (' + Math.round(enUzak.sapma).toLocaleString('tr-TR') + ' km).' : '');
        kopyalaBtn.hidden = false;
    }

    function kopyala() {
        var satirlar = noktalar.map(function (n) {
            return '# ' + n.baslik + '\nhayal_konum: [' + n.tahmin.lat.toFixed(4) + ', ' + n.tahmin.lng.toFixed(4) + ']';
        }).join('\n\n');
        var bitti = function () { kopyalaBtn.textContent = 'Kopyalandı'; setTimeout(function () { kopyalaBtn.textContent = 'Konumları kopyala'; }, 2000); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(satirlar).then(bitti, function () { window.prompt('Kopyala:', satirlar); });
        } else {
            window.prompt('Kopyala:', satirlar);
        }
    }

    function cik() {
        durum.deneme = false;
        el.classList.remove('denemede');
        panel.hidden = true;
        kaydirici.disabled = false;
        deneBtn.disabled = false;
        noktalar.forEach(function (n) {
            n.marker.dragging.disable();
            n.marker.off('dragend');
            n.marker.unbindTooltip();
            n.marker.bindPopup(function () { return kutu(n); });
        });
        durum.t = kaydirici.value / 100;
        ciz();
    }

    deneBtn.addEventListener('click', denemeyeGir);
    gosterBtn.addEventListener('click', goster);
    kopyalaBtn.addEventListener('click', kopyala);
    cikBtn.addEventListener('click', cik);
})();
