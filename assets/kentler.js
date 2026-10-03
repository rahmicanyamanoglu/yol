/* Görünmez Kentler.
   Her yer, adından türetilen bir tohumla çizilen hayali bir mimariye dönüşür.
   Beş biçim var; her biri Calvino'nun bir kentinden esinli:
   ince (Zenobia, direkler üstünde), ip (Ersilia, iplerle örülü),
   asili (Octavia, uçurumlar arasında ağa asılı), ayna (Valdrada, suda yansıyan),
   hali (Eudoxia, kentin gerçek biçimini taşıyan halı). */
(function () {
    var veri = window.YOL_KENTLER || [];
    var atlas = document.getElementById('kentler');
    if (!atlas) return;

    var NS = 'http://www.w3.org/2000/svg';
    var azHareket = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var W = 600, H = 600;

    var BICIMLER = {
        ince: 'İnce kent',
        ip: 'İplerin kenti',
        asili: 'Asılı kent',
        ayna: 'Aynalı kent',
        hali: 'Halıdaki kent'
    };
    var SIRA = ['ince', 'ip', 'asili', 'ayna', 'hali'];

    /* ---- tohumlu rastgelelik ---- */
    function karma(s) {
        var h = 1779033703 ^ s.length;
        for (var i = 0; i < s.length; i++) {
            h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
            h = h << 13 | h >>> 19;
        }
        return h >>> 0;
    }
    function tohum(a) {
        return function () {
            a |= 0; a = a + 0x6D2B79F5 | 0;
            var t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
    function arasi(r, a, b) { return a + r() * (b - a); }

    /* ---- çizim yardımcıları ---- */
    function Cizer(svg) {
        this.svg = svg;
        this.i = 0;
    }
    Cizer.prototype.katman = function (derinlik) {
        var g = document.createElementNS(NS, 'g');
        g.setAttribute('data-d', derinlik);
        this.svg.appendChild(g);
        return g;
    };
    Cizer.prototype.e = function (g, ad, at, sinif) {
        var e = document.createElementNS(NS, ad);
        for (var k in at) e.setAttribute(k, at[k]);
        e.setAttribute('pathLength', '1');
        e.setAttribute('class', 'e' + (sinif ? ' ' + sinif : ''));
        e.style.setProperty('--i', Math.min(this.i++, 140));
        g.appendChild(e);
        return e;
    };
    Cizer.prototype.cizgi = function (g, x1, y1, x2, y2, s) {
        return this.e(g, 'line', { x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1) }, s);
    };
    Cizer.prototype.yol = function (g, d, s) { return this.e(g, 'path', { d: d }, s); };
    Cizer.prototype.kutu = function (g, x, y, w, h, s) {
        return this.e(g, 'rect', { x: x.toFixed(1), y: y.toFixed(1), width: w.toFixed(1), height: h.toFixed(1) }, 'dolgu' + (s ? ' ' + s : ''));
    };
    Cizer.prototype.daire = function (g, x, y, r, s) {
        return this.e(g, 'circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(1) }, s);
    };
    Cizer.prototype.ev = function (g, x, y, w, h, r) {
        // y: tabanın yüksekliği
        this.kutu(g, x - w / 2, y - h, w, h);
        var cati = r() < 0.5
            ? 'M' + (x - w / 2 - 3) + ' ' + (y - h) + ' L' + x + ' ' + (y - h - w * 0.45) + ' L' + (x + w / 2 + 3) + ' ' + (y - h) + ' Z'
            : 'M' + (x - w / 2) + ' ' + (y - h) + ' A' + (w / 2) + ' ' + (w / 2.4) + ' 0 0 1 ' + (x + w / 2) + ' ' + (y - h) + ' Z';
        this.yol(g, cati, 'dolgu');
        if (w > 14) {
            var pw = Math.max(3, w * 0.16);
            this.kutu(g, x - pw / 2, y - h * 0.6, pw, h * 0.32, 'pencere');
        }
    };
    Cizer.prototype.merdiven = function (g, x, y1, y2) {
        this.cizgi(g, x - 4, y1, x - 4, y2, 'ince');
        this.cizgi(g, x + 4, y1, x + 4, y2, 'ince');
        for (var y = Math.min(y1, y2) + 6; y < Math.max(y1, y2); y += 9) this.cizgi(g, x - 4, y, x + 4, y, 'ince');
    };

    function qNokta(p0, p1, p2, t) {
        var u = 1 - t;
        return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
    }

    /* ---- beş kent ---- */
    var KENTLER = {};

    KENTLER.ince = function (c, r) {
        var Z = 545;
        var arka = c.katman(0.3), on = c.katman(1);
        for (var k = 0; k < 7; k++) {
            var bx = arasi(r, 40, 560);
            c.cizgi(arka, bx, Z, bx, arasi(r, 260, 420), 'soluk');
        }
        c.cizgi(on, 20, Z, 580, Z, 'zemin');
        var n = 12 + Math.floor(r() * 6), xs = [], ust = [];
        for (var i = 0; i < n; i++) xs.push(arasi(r, 55, 545));
        xs.sort(function (a, b) { return a - b; });
        for (i = 0; i < n; i++) {
            ust[i] = arasi(r, 150, 430);
            c.cizgi(on, xs[i], Z, xs[i], ust[i]);
            if (r() < 0.35) c.cizgi(on, xs[i] + 6, Z, xs[i] + 6, ust[i] + arasi(r, 20, 80), 'ince');
            if (r() < 0.2) c.daire(on, xs[i], ust[i] - 10, 10, 'dolgu');
        }
        for (i = 0; i < n - 1; i++) {
            if (r() > 0.88) continue;
            var y = Math.max(ust[i], ust[i + 1]) + arasi(r, 0, 30);
            if (r() < 0.45) {
                var y2 = y + arasi(r, 50, (Z - y) * 0.7);
                c.cizgi(on, xs[i] - 6, y2, xs[i + 1] + 6, y2);
                if (xs[i + 1] - xs[i] > 26 && r() < 0.6) c.ev(on, (xs[i] + xs[i + 1]) / 2, y2, Math.min(40, xs[i + 1] - xs[i] - 10), arasi(r, 14, 26), r);
            }
            c.cizgi(on, xs[i] - 8, y, xs[i + 1] + 8, y, 'kalin');
            var bosluk = xs[i + 1] - xs[i];
            if (bosluk > 22 && r() < 0.75) c.ev(on, (xs[i] + xs[i + 1]) / 2, y, Math.min(54, bosluk - 8), arasi(r, 18, 40), r);
            if (r() < 0.35) c.merdiven(on, xs[i] + bosluk * arasi(r, 0.25, 0.75), y, Z);
        }
        return function (x, y) {
            y = Math.min(y, Z - 40);
            c.cizgi(on, x, Z, x, y, 'yeni');
            c.cizgi(on, x - 22, y, x + 22, y, 'kalin yeni');
            c.ev(on, x, y, arasi(r, 18, 36), arasi(r, 16, 30), r);
        };
    };

    KENTLER.ip = function (c, r) {
        var arka = c.katman(0.4), on = c.katman(1), direkler = [];
        var renkler = ['renk1', 'renk2', 'renk3'];
        function direk(x, y) {
            c.cizgi(on, x, y, x, y + 34);
            c.daire(on, x, y, 3.5, 'nokta');
            direkler.push([x, y]);
        }
        function bagla(a, b, sinif) {
            var sark = arasi(r, 10, 60);
            var d = 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' Q' + ((a[0] + b[0]) / 2).toFixed(1) + ' ' + ((a[1] + b[1]) / 2 + sark).toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
            c.yol(arka, d, renkler[Math.floor(r() * 3)] + (sinif ? ' ' + sinif : ''));
        }
        var m = 9 + Math.floor(r() * 5);
        for (var i = 0; i < m; i++) direk(arasi(r, 60, 540), arasi(r, 120, 500));
        for (i = 0; i < m; i++) {
            var k = 2 + Math.floor(r() * 2);
            for (var j = 0; j < k; j++) {
                var b = Math.floor(r() * m);
                if (b !== i) bagla(direkler[i], direkler[b]);
            }
        }
        return function (x, y) {
            var yakin = direkler.slice().sort(function (p, q) {
                return Math.hypot(p[0] - x, p[1] - y) - Math.hypot(q[0] - x, q[1] - y);
            }).slice(0, 3);
            yakin.forEach(function (p) { bagla([x, y], p, 'yeni'); });
            direk(x, y);
        };
    };

    KENTLER.asili = function (c, r) {
        var arka = c.katman(0.3), on = c.katman(1);
        var sol = 'M0 90 L' + arasi(r, 80, 110).toFixed(0) + ' 110 L' + arasi(r, 60, 90).toFixed(0) + ' 230 L' + arasi(r, 95, 125).toFixed(0) + ' 360 L' + arasi(r, 50, 80).toFixed(0) + ' 600 L0 600 Z';
        var sag = 'M600 90 L' + arasi(r, 490, 520).toFixed(0) + ' 120 L' + arasi(r, 510, 540).toFixed(0) + ' 250 L' + arasi(r, 475, 505).toFixed(0) + ' 370 L' + arasi(r, 520, 550).toFixed(0) + ' 600 L600 600 Z';
        c.yol(arka, sol, 'dolgu kaya');
        c.yol(arka, sag, 'dolgu kaya');
        var k = 3 + Math.floor(r() * 3), ipler = [];
        for (var i = 0; i < k; i++) {
            var y0 = 150 + i * arasi(r, 40, 60), y2 = y0 + arasi(r, -20, 20);
            var p0 = [100, y0], p2 = [500, y2], p1 = [300, (y0 + y2) / 2 + arasi(r, 40, 90)];
            ipler.push([p0, p1, p2]);
            c.yol(on, 'M' + p0.join(' ') + ' Q' + p1.map(function (v) { return v.toFixed(1); }).join(' ') + ' ' + p2.join(' '), i === k - 1 ? 'kalin' : '');
        }
        for (var t = 0.08; t < 0.95; t += arasi(r, 0.05, 0.1)) {
            for (i = 0; i < k - 1; i++) {
                var a = qNokta(ipler[i][0], ipler[i][1], ipler[i][2], t), b = qNokta(ipler[i + 1][0], ipler[i + 1][1], ipler[i + 1][2], t);
                c.cizgi(on, a[0], a[1], b[0], b[1], 'ince');
            }
        }
        var alt = ipler[k - 1];
        function as(t, boy) {
            var p = qNokta(alt[0], alt[1], alt[2], t);
            var son = p[1] + boy;
            c.cizgi(on, p[0], p[1], p[0], son, 'ince');
            var tur = r();
            if (tur < 0.55) c.ev(on, p[0], son + arasi(r, 20, 34), arasi(r, 18, 34), arasi(r, 18, 32), r);
            else if (tur < 0.8) c.daire(on, p[0], son + 12, arasi(r, 8, 14), 'dolgu');
            else c.merdiven(on, p[0], son, son + arasi(r, 40, 90));
        }
        for (t = 0.12; t < 0.9; t += arasi(r, 0.07, 0.14)) as(t, arasi(r, 30, 140));
        return function (x, y) {
            var t = Math.max(0.05, Math.min(0.95, (x - 100) / 400));
            var p = qNokta(alt[0], alt[1], alt[2], t);
            var boy = Math.max(20, Math.min(240, y - p[1]));
            var son = p[1] + boy;
            c.cizgi(on, p[0], p[1], p[0], son, 'ince yeni');
            c.ev(on, p[0], son + 26, arasi(r, 18, 32), arasi(r, 18, 28), r);
        };
    };

    KENTLER.ayna = function (c, r) {
        var SU = 330;
        var ust = c.katman(1);
        var yansima = document.createElementNS(NS, 'g');
        yansima.setAttribute('class', 'yansima');
        yansima.setAttribute('data-d', '1');
        yansima.setAttribute('data-yansima', '1');
        yansima.setAttribute('transform', 'translate(0 660) scale(1 -1)');
        c.svg.appendChild(yansima);
        var su = c.katman(0.6);

        function yapi(g, x, w, h) {
            c.kutu(g, x - w / 2, SU - h, w, h);
            var sutun = Math.max(1, Math.floor(w / 14)), satir = Math.max(1, Math.floor(h / 22));
            for (var a = 0; a < sutun; a++) {
                for (var b = 0; b < satir; b++) {
                    if (r() < 0.45) continue;
                    c.kutu(g, x - w / 2 + 5 + a * ((w - 10) / sutun), SU - h + 8 + b * 22, Math.max(3, (w - 10) / sutun - 5), 9, 'pencere');
                }
            }
            var t = r();
            if (t < 0.3) c.yol(g, 'M' + (x - w / 2) + ' ' + (SU - h) + ' A' + (w / 2) + ' ' + (w / 2) + ' 0 0 1 ' + (x + w / 2) + ' ' + (SU - h) + ' Z', 'dolgu');
            else if (t < 0.55) {
                c.cizgi(g, x, SU - h, x, SU - h - arasi(r, 30, 70));
                c.yol(g, 'M' + (x - 8) + ' ' + (SU - h) + ' L' + x + ' ' + (SU - h - 26) + ' L' + (x + 8) + ' ' + (SU - h) + ' Z', 'dolgu');
            }
        }
        var x = arasi(r, 40, 70);
        while (x < 560) {
            var w = arasi(r, 26, 70);
            yapi(ust, x + w / 2, w, arasi(r, 50, 210));
            x += w + arasi(r, -10, 14);
        }
        function aynala() {
            while (yansima.firstChild) yansima.removeChild(yansima.firstChild);
            for (var n = 0; n < ust.childNodes.length; n++) yansima.appendChild(ust.childNodes[n].cloneNode(true));
        }
        aynala();
        c.cizgi(su, 10, SU, 590, SU, 'zemin');
        for (var k = 0; k < 26; k++) {
            var yy = arasi(r, SU + 12, 580), xx = arasi(r, 20, 560);
            c.cizgi(su, xx, yy, xx + arasi(r, 12, 40), yy, 'dalga');
        }
        var ayna = function (x, y) {
            var h = Math.max(30, Math.min(260, Math.abs(SU - y)));
            var once = ust.childNodes.length;
            yapi(ust, x, arasi(r, 22, 46), h);
            for (var n = once; n < ust.childNodes.length; n++) {
                ust.childNodes[n].classList.add('yeni');
                yansima.appendChild(ust.childNodes[n].cloneNode(true));
            }
        };
        ayna.su = SU;
        return ayna;
    };

    KENTLER.hali = function (c, r) {
        var on = c.katman(1), arka = c.katman(0.25);
        var A = 80, B = 520;
        c.kutu(arka, A, A, B - A, B - A, 'hali-zemin');
        c.e(on, 'rect', { x: A + 12, y: A + 12, width: B - A - 24, height: B - A - 24 }, 'ince');
        var z = 'M' + (A + 12) + ' ' + (A + 24);
        for (var x = A + 12; x < B - 12; x += 16) z += ' L' + (x + 8) + ' ' + (A + 18) + ' L' + (x + 16) + ' ' + (A + 24);
        c.yol(on, z, 'renk2 ince');
        var z2 = 'M' + (A + 12) + ' ' + (B - 24);
        for (x = A + 12; x < B - 12; x += 16) z2 += ' L' + (x + 8) + ' ' + (B - 18) + ' L' + (x + 16) + ' ' + (B - 24);
        c.yol(on, z2, 'renk2 ince');

        var N = 8 + Math.floor(r() * 4), I0 = A + 40, I1 = B - 40, h = (I1 - I0) / N;
        var gorulen = [], duvar = { s: [], d: [] }; // s: sağ duvar, d: alt duvar
        for (var i = 0; i < N; i++) {
            gorulen.push([]); duvar.s.push([]); duvar.d.push([]);
            for (var j = 0; j < N; j++) { gorulen[i][j] = false; duvar.s[i][j] = true; duvar.d[i][j] = true; }
        }
        var yigin = [[Math.floor(N / 2), Math.floor(N / 2)]];
        gorulen[yigin[0][0]][yigin[0][1]] = true;
        while (yigin.length) {
            var cur = yigin[yigin.length - 1], ci = cur[0], cj = cur[1], komsu = [];
            if (ci > 0 && !gorulen[ci - 1][cj]) komsu.push([ci - 1, cj]);
            if (ci < N - 1 && !gorulen[ci + 1][cj]) komsu.push([ci + 1, cj]);
            if (cj > 0 && !gorulen[ci][cj - 1]) komsu.push([ci, cj - 1]);
            if (cj < N - 1 && !gorulen[ci][cj + 1]) komsu.push([ci, cj + 1]);
            if (!komsu.length) { yigin.pop(); continue; }
            var s = komsu[Math.floor(r() * komsu.length)];
            if (s[0] !== ci) duvar.s[Math.min(ci, s[0])][cj] = false;
            else duvar.d[ci][Math.min(cj, s[1])] = false;
            gorulen[s[0]][s[1]] = true;
            yigin.push(s);
        }
        c.e(on, 'rect', { x: I0, y: I0, width: I1 - I0, height: I1 - I0 }, 'kalin');
        for (i = 0; i < N; i++) {
            for (j = 0; j < N; j++) {
                var x0 = I0 + i * h, y0 = I0 + j * h;
                if (duvar.s[i][j] && i < N - 1) c.cizgi(on, x0 + h, y0, x0 + h, y0 + h);
                if (duvar.d[i][j] && j < N - 1) c.cizgi(on, x0, y0 + h, x0 + h, y0 + h);
            }
        }
        function motif(cx, cy, boy, sinif) {
            c.yol(on, 'M' + cx + ' ' + (cy - boy) + ' L' + (cx + boy) + ' ' + cy + ' L' + cx + ' ' + (cy + boy) + ' L' + (cx - boy) + ' ' + cy + ' Z', sinif);
        }
        [[A + 26, A + 26], [B - 26, A + 26], [A + 26, B - 26], [B - 26, B - 26]].forEach(function (p) { motif(p[0], p[1], 8, 'renk1 dolgu-renk'); });
        motif(I0 + (Math.floor(N / 2) + 0.5) * h, I0 + (Math.floor(N / 2) + 0.5) * h, h * 0.28, 'renk1 dolgu-renk');
        return function (x, y) {
            var i = Math.floor((x - I0) / h), j = Math.floor((y - I0) / h);
            if (i < 0 || j < 0 || i >= N || j >= N) { motif(x, y, 7, 'renk3 yeni'); return; }
            motif(I0 + (i + 0.5) * h, I0 + (j + 0.5) * h, h * 0.3, 'renk3 dolgu-renk yeni');
        };
    };

    function kur(svg, kent) {
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        var bicim = BICIMLER[kent.kent] ? kent.kent : SIRA[karma(kent.slug || kent.baslik) % SIRA.length];
        var r = tohum(karma((kent.slug || kent.baslik) + ':' + bicim));
        var c = new Cizer(svg);
        var ekle = KENTLER[bicim](c, r);
        return { bicim: bicim, ekle: ekle, cizer: c };
    }

    /* ---- atlas ---- */
    var gozcu = 'IntersectionObserver' in window ? new IntersectionObserver(function (girdiler) {
        girdiler.forEach(function (g) {
            if (g.isIntersecting) { g.target.classList.add('ciziliyor'); gozcu.unobserve(g.target); }
        });
    }, { rootMargin: '0px 0px -10% 0px' }) : null;

    veri.forEach(function (kent, i) {
        var kart = document.createElement('button');
        kart.type = 'button';
        kart.className = 'kent-kart';
        var svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 600 600');
        svg.setAttribute('aria-hidden', 'true');
        kart.appendChild(svg);
        var k = kur(svg, kent);
        kent.bicimAd = BICIMLER[k.bicim];
        var alt = document.createElement('span');
        alt.className = 'kent-alt';
        var ad = document.createElement('strong');
        ad.textContent = kent.hayal_adi || kent.baslik;
        var tur = document.createElement('span');
        tur.textContent = kent.bicimAd + (kent.hayal_adi ? ' · ' + kent.baslik : '');
        alt.appendChild(ad);
        alt.appendChild(tur);
        kart.appendChild(alt);
        kart.addEventListener('click', function () { ac(kent); });
        atlas.appendChild(kart);
        if (azHareket || !gozcu) kart.classList.add('ciziliyor', 'hazir');
        else gozcu.observe(kart);
    });

    /* ---- kentin içi ---- */
    var pencere = document.getElementById('kent');
    var sahne = document.getElementById('kent-svg');
    var haritaKutu = document.getElementById('kent-harita');
    var gecis = pencere.querySelectorAll('.gecis button');
    var harita = null, isaret = null, simdiki = null, ekle = null;

    function anahtar(k) { return 'yol-kent-' + (k.slug || k.baslik); }
    function oku(k) {
        try { return JSON.parse(localStorage.getItem(anahtar(k)) || '[]'); } catch (e) { return []; }
    }
    function yaz(k, liste) {
        try { localStorage.setItem(anahtar(k), JSON.stringify(liste.slice(-80))); } catch (e) { /* depolama kapalı olabilir */ }
    }

    function mod(ad) {
        gecis.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mod') === ad)); });
        var gorunen = ad === 'gorunen';
        sahne.style.display = gorunen ? 'none' : '';
        haritaKutu.hidden = !gorunen;
        document.getElementById('kent-ipucu').style.visibility = gorunen ? 'hidden' : '';
        if (gorunen && typeof L !== 'undefined') {
            if (!harita) {
                harita = L.map(haritaKutu, { scrollWheelZoom: false, zoomControl: true });
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 18,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                }).addTo(harita);
                isaret = L.marker(simdiki.konum, { icon: L.divIcon({ className: 'isaret', iconSize: [16, 16], iconAnchor: [8, 8] }) }).addTo(harita);
            }
            harita.invalidateSize();
            harita.setView(simdiki.konum, 12);
            isaret.setLatLng(simdiki.konum);
        }
    }

    function ac(kent) {
        simdiki = kent;
        var k = kur(sahne, kent);
        ekle = k.ekle;
        oku(kent).forEach(function (p) { ekle(p[0], p[1]); });
        document.getElementById('kent-tur').textContent = kent.bicimAd;
        document.getElementById('kent-ad').textContent = kent.hayal_adi || kent.baslik;
        document.getElementById('kent-yer').textContent = [kent.yer, kent.donem].filter(Boolean).join(' · ');
        var anlati = document.getElementById('kent-anlati');
        anlati.textContent = kent.hayal || 'Bu kent henüz anlatılmadı.';
        anlati.className = kent.hayal ? '' : 'soluk';
        var link = document.getElementById('kent-link');
        link.href = kent.url;
        link.textContent = kent.dolu ? 'Hikâyeyi oku →' : 'Hikâyenin sayfası →';
        sahne.classList.remove('ciziliyor');
        void sahne.getBoundingClientRect();
        sahne.classList.add('ciziliyor');
        mod('gorunmez');
        if (pencere.open) return;
        if (typeof pencere.showModal === 'function') pencere.showModal();
        else pencere.setAttribute('open', '');
    }

    function kapat() {
        if (typeof pencere.close === 'function') pencere.close();
        else pencere.removeAttribute('open');
    }

    function svgNokta(olay) {
        var p = sahne.createSVGPoint();
        p.x = olay.clientX; p.y = olay.clientY;
        var m = sahne.getScreenCTM();
        if (!m) return null;
        p = p.matrixTransform(m.inverse());
        return [Math.round(p.x), Math.round(p.y)];
    }

    sahne.addEventListener('click', function (olay) {
        if (!ekle || !simdiki) return;
        var p = svgNokta(olay);
        if (!p) return;
        ekle(p[0], p[1]);
        var liste = oku(simdiki);
        liste.push(p);
        yaz(simdiki, liste);
    });

    if (!azHareket) {
        sahne.addEventListener('pointermove', function (olay) {
            var b = sahne.getBoundingClientRect();
            var nx = (olay.clientX - b.left) / b.width - 0.5, ny = (olay.clientY - b.top) / b.height - 0.5;
            sahne.querySelectorAll('g[data-d]').forEach(function (g) {
                var d = parseFloat(g.getAttribute('data-d'));
                var dx = (nx * (1 - d) * 40).toFixed(1), dy = (ny * (1 - d) * 24).toFixed(1);
                if (g.hasAttribute('data-yansima')) {
                    g.setAttribute('transform', 'translate(0 660) scale(1 -1) skewX(' + (nx * 10).toFixed(2) + ')');
                } else {
                    g.setAttribute('transform', 'translate(' + dx + ' ' + dy + ')');
                }
            });
        });
    }

    gecis.forEach(function (b) { b.addEventListener('click', function () { mod(b.getAttribute('data-mod')); }); });
    document.getElementById('kapat').addEventListener('click', kapat);
    pencere.addEventListener('click', function (olay) { if (olay.target === pencere) kapat(); });
    document.getElementById('kent-sil').addEventListener('click', function () {
        if (!simdiki) return;
        yaz(simdiki, []);
        ac(simdiki);
    });
})();
