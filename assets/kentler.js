/* Görünmez Kentler.
   Her yer, adından türetilen bir tohumla çizilen hayali bir mimariye dönüşür.
   Beş biçim var; her biri Calvino'nun bir kentinden esinli:
   ince (Zenobia, direkler üstünde), ip (Ersilia, iplerle örülü),
   asili (Octavia, uçurumlar arasında ağa asılı), ayna (Valdrada, suda yansıyan),
   hali (Eudoxia, kentin gerçek biçimini taşıyan halı).

   Kentler canlıdır: rüzgârla sallanır, içlerinde yolcular dolaşır. Her gün
   scripts/gunluk.py o günün havasını ve Vikipedi ilgisini _data/gunluk.json'a
   yazar; her gün kente o günün verisiyle biçimlenen bir yapı eklenir, en son
   günün rüzgârı, yağmuru ve sıcaklığı da kentin şimdiki halini belirler. */
(function () {
    var veri = window.YOL_KENTLER || [];
    var atlas = document.getElementById('kentler');
    if (!atlas) return;

    var NS = 'http://www.w3.org/2000/svg';
    var azHareket = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var GUN_SINIRI = 90; // kente en fazla son kaç günün yapısı eklenir

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
    function sinirla(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function sayi(v) { return typeof v === 'number' && isFinite(v); }

    /* ---- çizim yardımcıları ---- */
    function Cizer(svg) {
        this.svg = svg;
        this.i = 0;
        this.hareketler = [];
    }
    // Her katman iki gruptur: dıştaki imleçle derinlik (paralaks) alır,
    // içteki kendi hareketini yapar; böylece ikisi birbirini ezmez.
    Cizer.prototype.katman = function (derinlik) {
        var dis = document.createElementNS(NS, 'g');
        dis.setAttribute('data-d', derinlik);
        var ic = document.createElementNS(NS, 'g');
        dis.appendChild(ic);
        this.svg.appendChild(dis);
        return ic;
    };
    Cizer.prototype.grup = function (ust) {
        var g = document.createElementNS(NS, 'g');
        ust.appendChild(g);
        return g;
    };
    Cizer.prototype.hareket = function (f) { this.hareketler.push(f); };
    // Çizimdeki olayları (şimşek gibi) dinleyene, örneğin sese bildirir
    Cizer.prototype.olay = function (ad) { if (this.dinleyici) this.dinleyici(ad); };
    Cizer.prototype.e = function (g, ad, at, sinif) {
        var e = document.createElementNS(NS, ad);
        for (var k in at) e.setAttribute(k, at[k]);
        e.setAttribute('pathLength', '1');
        e.setAttribute('class', 'e' + (sinif ? ' ' + sinif : ''));
        e.style.setProperty('--i', Math.min(this.i++, 140));
        g.appendChild(e);
        return e;
    };
    // Canlı ögeler (yolcular, yağmur): çizim animasyonuna girmez, sonradan belirir.
    Cizer.prototype.canli = function (g, ad, at, sinif) {
        var e = document.createElementNS(NS, ad);
        for (var k in at) e.setAttribute(k, at[k]);
        e.setAttribute('class', 'canli' + (sinif ? ' ' + sinif : ''));
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
    Cizer.prototype.ev = function (g, x, y, w, h, r, s) {
        // y: tabanın yüksekliği
        s = s ? ' ' + s : '';
        this.kutu(g, x - w / 2, y - h, w, h, s.trim());
        var cati = r() < 0.5
            ? 'M' + (x - w / 2 - 3) + ' ' + (y - h) + ' L' + x + ' ' + (y - h - w * 0.45) + ' L' + (x + w / 2 + 3) + ' ' + (y - h) + ' Z'
            : 'M' + (x - w / 2) + ' ' + (y - h) + ' A' + (w / 2) + ' ' + (w / 2.4) + ' 0 0 1 ' + (x + w / 2) + ' ' + (y - h) + ' Z';
        this.yol(g, cati, 'dolgu' + s);
        if (w > 14) {
            var pw = Math.max(3, w * 0.16);
            this.kutu(g, x - pw / 2, y - h * 0.6, pw, h * 0.32, 'pencere' + s);
        }
    };
    Cizer.prototype.merdiven = function (g, x, y1, y2, s) {
        s = s ? ' ' + s : '';
        this.cizgi(g, x - 4, y1, x - 4, y2, 'ince' + s);
        this.cizgi(g, x + 4, y1, x + 4, y2, 'ince' + s);
        for (var y = Math.min(y1, y2) + 6; y < Math.max(y1, y2); y += 9) this.cizgi(g, x - 4, y, x + 4, y, 'ince' + s);
    };
    Cizer.prototype.yolcu = function (g, x, y, r) {
        return this.canli(g, 'circle', { cx: x, cy: y, r: r || 3.2 }, 'yolcu');
    };

    function qNokta(p0, p1, p2, t) {
        var u = 1 - t;
        return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
    }
    function gidipGel(v) { v = v % 2; return v < 1 ? v : 2 - v; }

    /* ---- beş kent ----
       Her biçim (c, r) alır, kenti çizer, hareketlerini c.hareket ile kaydeder
       ve bir "ekle(x, y, gun, sinif)" döndürür: ziyaretçinin dokunuşu da günlük
       veri de kente bununla yapı ekler. */
    var KENTLER = {};

    KENTLER.ince = function (c, r) {
        var Z = 545;
        var arka = c.katman(0.3), on = c.katman(1), yolcular = c.katman(1);
        for (var k = 0; k < 7; k++) {
            var bx = arasi(r, 40, 560);
            c.cizgi(arka, bx, Z, bx, arasi(r, 260, 420), 'soluk');
        }
        c.cizgi(on, 20, Z, 580, Z, 'zemin');
        var n = 12 + Math.floor(r() * 6), xs = [], ust = [], merdivenler = [];
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
            if (r() < 0.35) {
                var mx = xs[i] + bosluk * arasi(r, 0.25, 0.75);
                c.merdiven(on, mx, y, Z);
                merdivenler.push([mx, y, Z]);
            }
        }
        // Merdivenlerde inip çıkanlar
        merdivenler.slice(0, 3).forEach(function (m) {
            var p = c.yolcu(yolcular, m[0], m[2]);
            var hiz = arasi(r, 0.08, 0.16), faz = r() * 2;
            c.hareket(function (t) { p.setAttribute('cy', (m[2] - (m[2] - m[1]) * gidipGel(t * hiz + faz)).toFixed(1)); });
        });
        // Rüzgârda direkler
        c.hareket(function (t, A) {
            var a = (Math.sin(t * 0.9) + 0.4 * Math.sin(t * 2.3)) * A * 1.8;
            var donus = 'translate(0 ' + Z + ') skewX(' + a.toFixed(2) + ') translate(0 ' + (-Z) + ')';
            on.setAttribute('transform', donus);
            yolcular.setAttribute('transform', donus);
            arka.setAttribute('transform', 'translate(0 ' + Z + ') skewX(' + (a * 0.5).toFixed(2) + ') translate(0 ' + (-Z) + ')');
        });
        return function (x, y, gun, s) {
            if (gun && sayi(gun.ruzgar)) y = Z - 90 - sinirla(gun.ruzgar, 0, 60) * 5 * arasi(r, 0.7, 1);
            y = sinirla(y, 110, Z - 40);
            c.cizgi(on, x, Z, x, y, s);
            c.cizgi(on, x - 22, y, x + 22, y, 'kalin ' + s);
            c.ev(on, x, y, arasi(r, 18, 36), arasi(r, 16, 30), r, s);
            if (gun && sayi(gun.yagis) && gun.yagis > 2) c.merdiven(on, x + 10, y, Z, s);
        };
    };

    KENTLER.ip = function (c, r) {
        var arka = c.katman(0.4), on = c.katman(1), yolcular = c.katman(1), direkler = [], ipler = [];
        var renkler = ['renk1', 'renk2', 'renk3'];
        function direk(x, y, s) {
            c.cizgi(on, x, y, x, y + 34, s);
            c.daire(on, x, y, 3.5, 'nokta' + (s ? ' ' + s : ''));
            direkler.push([x, y]);
        }
        function d(a, b, sark) {
            return 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' Q' + ((a[0] + b[0]) / 2).toFixed(1) + ' ' + ((a[1] + b[1]) / 2 + sark).toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
        }
        function bagla(a, b, s) {
            var sark = arasi(r, 10, 60);
            var el = c.yol(arka, d(a, b, sark), renkler[Math.floor(r() * 3)] + (s ? ' ' + s : ''));
            ipler.push({ el: el, a: a, b: b, sark: sark, faz: r() * 6.3, hiz: arasi(r, 0.8, 1.6) });
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
        function anlikSark(ip, t, A) { return ip.sark + Math.sin(t * ip.hiz + ip.faz) * A * 16; }
        // İpler rüzgârda salınır
        c.hareket(function (t, A) {
            ipler.forEach(function (ip) { ip.el.setAttribute('d', d(ip.a, ip.b, anlikSark(ip, t, A))); });
        });
        // İplerin üstünde gidip gelen mekikler
        for (i = 0; i < 4; i++) {
            (function () {
                var p = c.yolcu(yolcular, 0, 0, 2.6), hiz = arasi(r, 0.05, 0.12), faz = r() * 2, sira = Math.floor(r() * 1000);
                c.hareket(function (t, A) {
                    var ip = ipler[sira % ipler.length];
                    if (!ip) return;
                    var a = ip.a, bb = ip.b;
                    var q = qNokta(a, [(a[0] + bb[0]) / 2, (a[1] + bb[1]) / 2 + anlikSark(ip, t, A)], bb, gidipGel(t * hiz + faz));
                    p.setAttribute('cx', q[0].toFixed(1));
                    p.setAttribute('cy', q[1].toFixed(1));
                });
            })();
        }
        return function (x, y, gun, s) {
            var kac = 3;
            if (gun && sayi(gun.ilgi)) kac = 1 + Math.min(4, Math.round(Math.log10(Math.max(10, gun.ilgi)) - 1));
            var yakin = direkler.slice().sort(function (p, q) {
                return Math.hypot(p[0] - x, p[1] - y) - Math.hypot(q[0] - x, q[1] - y);
            }).slice(0, kac);
            yakin.forEach(function (p) { bagla([x, y], p, s); });
            direk(x, y, s);
        };
    };

    KENTLER.asili = function (c, r) {
        var arka = c.katman(0.3), on = c.katman(1), yolcular = c.katman(1);
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
        // Asılı her şey kendi askı noktası etrafında sarkaç gibi salınır
        function as(t, boy, s) {
            var p = qNokta(alt[0], alt[1], alt[2], t);
            var g = c.grup(on);
            var son = p[1] + boy;
            c.cizgi(g, p[0], p[1], p[0], son, 'ince' + (s ? ' ' + s : ''));
            var tur = r();
            if (tur < 0.55) c.ev(g, p[0], son + arasi(r, 20, 34), arasi(r, 18, 34), arasi(r, 18, 32), r, s);
            else if (tur < 0.8) c.daire(g, p[0], son + 12, arasi(r, 8, 14), 'dolgu' + (s ? ' ' + s : ''));
            else c.merdiven(g, p[0], son, son + arasi(r, 40, 90), s);
            var faz = r() * 6.3, hiz = arasi(r, 0.9, 1.4), uzunluk = 60 / Math.max(40, boy);
            c.hareket(function (zaman, A) {
                var aci = Math.sin(zaman * hiz + faz) * A * 9 * uzunluk;
                g.setAttribute('transform', 'rotate(' + aci.toFixed(2) + ' ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')');
            });
        }
        for (t = 0.12; t < 0.9; t += arasi(r, 0.07, 0.14)) as(t, arasi(r, 30, 140));
        // En üst ipte yürüyen biri
        var ust = ipler[0], yuruyen = c.yolcu(yolcular, 0, 0), yHiz = arasi(r, 0.03, 0.06), yFaz = r() * 2;
        c.hareket(function (zaman) {
            var q = qNokta(ust[0], ust[1], ust[2], gidipGel(zaman * yHiz + yFaz));
            yuruyen.setAttribute('cx', q[0].toFixed(1));
            yuruyen.setAttribute('cy', (q[1] - 4).toFixed(1));
        });
        return function (x, y, gun, s) {
            var t = sinirla((x - 100) / 400, 0.05, 0.95);
            var p = qNokta(alt[0], alt[1], alt[2], t);
            var boy = sinirla(y - p[1], 20, 240);
            if (gun && sayi(gun.yagis)) boy = sinirla(40 + gun.yagis * 18, 30, 240);
            as(t, boy, s);
        };
    };

    KENTLER.ayna = function (c, r) {
        var SU = 330;
        var ust = c.katman(1);
        var yansima = c.katman(1);
        yansima.setAttribute('class', 'yansima');
        yansima.setAttribute('transform', 'translate(0 ' + (2 * SU) + ') scale(1 -1)');
        var su = c.katman(0.6);
        var kayik = c.katman(0.8);

        function yapi(g, x, w, h, s) {
            s = s ? ' ' + s : '';
            c.kutu(g, x - w / 2, SU - h, w, h, s.trim());
            var sutun = Math.max(1, Math.floor(w / 14)), satir = Math.max(1, Math.floor(h / 22));
            for (var a = 0; a < sutun; a++) {
                for (var b = 0; b < satir; b++) {
                    if (r() < 0.45) continue;
                    c.kutu(g, x - w / 2 + 5 + a * ((w - 10) / sutun), SU - h + 8 + b * 22, Math.max(3, (w - 10) / sutun - 5), 9, 'pencere' + s);
                }
            }
            var t = r();
            if (t < 0.3) c.yol(g, 'M' + (x - w / 2) + ' ' + (SU - h) + ' A' + (w / 2) + ' ' + (w / 2) + ' 0 0 1 ' + (x + w / 2) + ' ' + (SU - h) + ' Z', 'dolgu' + s);
            else if (t < 0.55) {
                c.cizgi(g, x, SU - h, x, SU - h - arasi(r, 30, 70), s.trim());
                c.yol(g, 'M' + (x - 8) + ' ' + (SU - h) + ' L' + x + ' ' + (SU - h - 26) + ' L' + (x + 8) + ' ' + (SU - h) + ' Z', 'dolgu' + s);
            }
        }
        var x = arasi(r, 40, 70);
        while (x < 560) {
            var w = arasi(r, 26, 70);
            yapi(ust, x + w / 2, w, arasi(r, 50, 210));
            x += w + arasi(r, -10, 14);
        }
        function aynala(bas) {
            for (var n = bas; n < ust.childNodes.length; n++) yansima.appendChild(ust.childNodes[n].cloneNode(true));
        }
        aynala(0);
        c.cizgi(su, 10, SU, 590, SU, 'zemin');
        var dalgalar = [];
        for (var k = 0; k < 26; k++) {
            var yy = arasi(r, SU + 12, 580), xx = arasi(r, 20, 560);
            dalgalar.push({ el: c.cizgi(su, xx, yy, xx + arasi(r, 12, 40), yy, 'dalga'), faz: r() * 6.3, hiz: arasi(r, 0.6, 1.4) });
        }
        // Yansıma titrer, dalgalar kayar
        c.hareket(function (t, A) {
            var egik = Math.sin(t * 0.7) * A * 5, oynama = Math.sin(t * 1.9) * A * 3;
            yansima.setAttribute('transform', 'translate(' + oynama.toFixed(2) + ' ' + (2 * SU) + ') scale(1 ' + (-1 + Math.sin(t * 1.3) * 0.015 * A).toFixed(4) + ') skewX(' + egik.toFixed(2) + ')');
            dalgalar.forEach(function (dg) {
                dg.el.setAttribute('transform', 'translate(' + (Math.sin(t * dg.hiz + dg.faz) * 10 * A).toFixed(1) + ' 0)');
            });
        });
        // Suyun üstünden geçen kayık
        var g = c.grup(kayik);
        c.canli(g, 'path', { d: 'M-16 0 L16 0 L10 7 L-10 7 Z' }, 'kayik');
        c.canli(g, 'path', { d: 'M0 0 L0 -24 L12 -4 Z' }, 'yelken');
        var kHiz = arasi(r, 10, 18), kFaz = r() * 700, kY = SU + arasi(r, 40, 120);
        c.hareket(function (t, A) {
            var kx = (t * kHiz * (0.6 + A) + kFaz) % 700 - 50;
            var sallan = Math.sin(t * 2.1) * 3 * A;
            g.setAttribute('transform', 'translate(' + kx.toFixed(1) + ' ' + (kY + Math.sin(t * 1.5) * 2).toFixed(1) + ') rotate(' + sallan.toFixed(2) + ')');
        });
        return function (x, y, gun, s) {
            var h = sinirla(Math.abs(SU - y), 30, 260);
            if (gun && sayi(gun.sc_max)) h = sinirla(50 + (gun.sc_max + 5) * 5.5, 40, 270);
            var once = ust.childNodes.length;
            yapi(ust, x, arasi(r, 22, 46), h, s);
            aynala(once);
        };
    };

    KENTLER.hali = function (c, r) {
        var arka = c.katman(0.25), on = c.katman(1), yolcular = c.katman(1);
        var A0 = 80, B0 = 520;
        c.kutu(arka, A0, A0, B0 - A0, B0 - A0, 'hali-zemin');
        c.e(on, 'rect', { x: A0 + 12, y: A0 + 12, width: B0 - A0 - 24, height: B0 - A0 - 24 }, 'ince');
        var z = 'M' + (A0 + 12) + ' ' + (A0 + 24);
        for (var x = A0 + 12; x < B0 - 12; x += 16) z += ' L' + (x + 8) + ' ' + (A0 + 18) + ' L' + (x + 16) + ' ' + (A0 + 24);
        c.yol(on, z, 'renk2 ince');
        var z2 = 'M' + (A0 + 12) + ' ' + (B0 - 24);
        for (x = A0 + 12; x < B0 - 12; x += 16) z2 += ' L' + (x + 8) + ' ' + (B0 - 18) + ' L' + (x + 16) + ' ' + (B0 - 24);
        c.yol(on, z2, 'renk2 ince');

        var N = 8 + Math.floor(r() * 4), I0 = A0 + 40, I1 = B0 - 40, h = (I1 - I0) / N;
        var gorulen = [], duvarS = [], duvarD = []; // sağ ve alt duvarlar
        for (var i = 0; i < N; i++) {
            gorulen.push([]); duvarS.push([]); duvarD.push([]);
            for (var j = 0; j < N; j++) { gorulen[i][j] = false; duvarS[i][j] = true; duvarD[i][j] = true; }
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
            var s0 = komsu[Math.floor(r() * komsu.length)];
            if (s0[0] !== ci) duvarS[Math.min(ci, s0[0])][cj] = false;
            else duvarD[ci][Math.min(cj, s0[1])] = false;
            gorulen[s0[0]][s0[1]] = true;
            yigin.push(s0);
        }
        c.e(on, 'rect', { x: I0, y: I0, width: I1 - I0, height: I1 - I0 }, 'kalin');
        for (i = 0; i < N; i++) {
            for (j = 0; j < N; j++) {
                var x0 = I0 + i * h, y0 = I0 + j * h;
                if (duvarS[i][j] && i < N - 1) c.cizgi(on, x0 + h, y0, x0 + h, y0 + h);
                if (duvarD[i][j] && j < N - 1) c.cizgi(on, x0, y0 + h, x0 + h, y0 + h);
            }
        }
        var motifler = [];
        function motif(cx, cy, boy, sinif) {
            var m = c.yol(on, 'M' + cx + ' ' + (cy - boy) + ' L' + (cx + boy) + ' ' + cy + ' L' + cx + ' ' + (cy + boy) + ' L' + (cx - boy) + ' ' + cy + ' Z', sinif);
            motifler.push({ el: m, faz: r() * 6.3 });
            return m;
        }
        [[A0 + 26, A0 + 26], [B0 - 26, A0 + 26], [A0 + 26, B0 - 26], [B0 - 26, B0 - 26]].forEach(function (p) { motif(p[0], p[1], 8, 'renk1 dolgu-renk'); });
        motif(I0 + (Math.floor(N / 2) + 0.5) * h, I0 + (Math.floor(N / 2) + 0.5) * h, h * 0.28, 'renk1 dolgu-renk');

        // Labirentte dolaşan yolcu ve arkasında silinen izi
        function gecilir(a, b) {
            if (a[0] !== b[0]) return !duvarS[Math.min(a[0], b[0])][a[1]];
            return !duvarD[a[0]][Math.min(a[1], b[1])];
        }
        function merkez(h0) { return [I0 + (h0[0] + 0.5) * h, I0 + (h0[1] + 0.5) * h]; }
        var simdi = [Math.floor(N / 2), Math.floor(N / 2)], onceki = simdi, sonraki = simdi, ilerleme = 1, sonZaman = null;
        var iz = c.canli(yolcular, 'polyline', { points: '' }, 'iz');
        var yolcu = c.yolcu(yolcular, 0, 0, 3.6), izler = [];
        function sec() {
            var adaylar = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(function (dd) { return [simdi[0] + dd[0], simdi[1] + dd[1]]; })
                .filter(function (n) { return n[0] >= 0 && n[1] >= 0 && n[0] < N && n[1] < N && gecilir(simdi, n); });
            var ileri = adaylar.filter(function (n) { return n[0] !== onceki[0] || n[1] !== onceki[1]; });
            var havuz = ileri.length ? ileri : adaylar;
            return havuz[Math.floor(Math.random() * havuz.length)] || simdi;
        }
        c.hareket(function (t, A) {
            if (sonZaman === null) sonZaman = t;
            var dt = Math.min(0.1, t - sonZaman);
            sonZaman = t;
            ilerleme += dt * (1.2 + A * 1.4);
            if (ilerleme >= 1) {
                ilerleme = 0;
                onceki = simdi;
                simdi = sonraki;
                sonraki = sec();
            }
            var a = merkez(simdi), b = merkez(sonraki);
            var px = a[0] + (b[0] - a[0]) * ilerleme, py = a[1] + (b[1] - a[1]) * ilerleme;
            yolcu.setAttribute('cx', px.toFixed(1));
            yolcu.setAttribute('cy', py.toFixed(1));
            izler.push(px.toFixed(1) + ',' + py.toFixed(1));
            if (izler.length > 70) izler.shift();
            iz.setAttribute('points', izler.join(' '));
            motifler.forEach(function (m) {
                m.el.style.opacity = (0.65 + 0.35 * Math.sin(t * 1.2 + m.faz)).toFixed(2);
            });
        });
        return function (x, y, gun, s) {
            var i0 = Math.floor((x - I0) / h), j0 = Math.floor((y - I0) / h);
            if (gun) { i0 = sinirla(i0, 0, N - 1); j0 = sinirla(j0, 0, N - 1); }
            var renk = 'renk3';
            if (gun && sayi(gun.kod)) renk = gun.kod >= 51 ? 'renk1' : gun.kod <= 2 ? 'renk3' : 'renk2';
            if (i0 < 0 || j0 < 0 || i0 >= N || j0 >= N) { motif(x, y, 7, renk + ' ' + s); return; }
            motif(I0 + (i0 + 0.5) * h, I0 + (j0 + 0.5) * h, h * 0.3, renk + ' dolgu-renk ' + s);
        };
    };

    /* ---- günün havası ----
       Son günün verisi kentin üstündeki havayı kurar: gökyüzü rengi, güneş,
       bulut, sis, esinti, kuşlar, yağmur, kar ve şimşek. Hava kodları WMO:
       0-1 açık, 2 parçalı, 3 kapalı, 45-48 sis, 51-67 ve 80-82 yağmur,
       71-77 ve 85-86 kar, 95-99 fırtına. Hava ayrı bir tohum kullanır;
       kentin biçimi havaya göre değişmez, yalnızca üstündeki hava değişir. */
    function gokRengi(sc) {
        // soğuk mavi → ılık yeşil → sıcak kehribar
        var o = sinirla((sc + 5) / 40, 0, 1);
        return 'hsl(' + Math.round(210 - o * 180) + ', ' + Math.round(35 + o * 35) + '%, 55%)';
    }
    function havaTuru(g) {
        var k = sayi(g.kod) ? g.kod : null, mm = sayi(g.yagis) ? g.yagis : 0, sc = sayi(g.sc_max) ? g.sc_max : 15;
        var kar = (k >= 71 && k <= 77) || k === 85 || k === 86 || (mm >= 0.5 && sc < 2);
        var yagmur = !kar && (mm >= 0.5 || (k >= 51 && k <= 67) || (k >= 80 && k <= 82) || k >= 95);
        return {
            acik: k !== null ? k <= 1 : mm < 0.5,
            bulut: k === null ? (mm >= 0.5 ? 3 : 1) : k === 0 ? 0 : k <= 2 ? k : 3,
            sis: k === 45 || k === 48,
            kar: kar,
            yagmur: yagmur,
            firtina: k >= 95,
            mm: Math.max(mm, yagmur || kar ? 2 : 0)
        };
    }

    function gokyuzu(c, r, h) {
        var g = c.katman(0.1);
        if (h.acik) {
            var gunes = c.grup(g), cx = arasi(r, 430, 520), cy = arasi(r, 80, 130);
            c.canli(gunes, 'circle', { cx: cx, cy: cy, r: 26 }, 'gunes');
            var isinlar = c.grup(gunes);
            for (var i = 0; i < 12; i++) {
                var a = i / 12 * Math.PI * 2;
                c.canli(isinlar, 'line', { x1: cx + Math.cos(a) * 34, y1: cy + Math.sin(a) * 34, x2: cx + Math.cos(a) * 46, y2: cy + Math.sin(a) * 46 }, 'isin');
            }
            c.hareket(function (t) {
                isinlar.setAttribute('transform', 'rotate(' + (t * 6 % 360).toFixed(1) + ' ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ') ');
                isinlar.style.opacity = (0.55 + 0.45 * Math.sin(t * 1.4)).toFixed(2);
            });
        }
        var bulutSayisi = [0, 1, 3, 4][h.bulut] + (h.yagmur || h.kar ? 1 : 0);
        for (var b = 0; b < bulutSayisi; b++) {
            (function () {
                var bg = c.grup(g), w = arasi(r, 50, 110), y = arasi(r, 40, 170), x0 = r() * 760, hiz = arasi(r, 4, 9);
                var parca = 3 + Math.floor(r() * 3);
                for (var k = 0; k < parca; k++) {
                    c.canli(bg, 'ellipse', { cx: (k - parca / 2) * w / parca * 1.2, cy: -arasi(r, 0, w * 0.18), rx: w / parca * 1.1, ry: w * arasi(r, 0.16, 0.26) }, 'bulut' + (h.bulut >= 3 ? ' kapali' : ''));
                }
                c.hareket(function (t, A) {
                    var x = (x0 + t * hiz * (0.5 + A * 2)) % 760 - 80;
                    bg.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
                });
            })();
        }
        if (!h.yagmur && !h.kar && !h.sis) {
            for (var q = 0; q < 4; q++) {
                (function () {
                    var kus = c.canli(g, 'path', { d: 'M-6 0 Q-3 -4 0 0 Q3 -4 6 0' }, 'kus');
                    var y = arasi(r, 60, 200), x0 = r() * 800, hiz = arasi(r, 18, 30), faz = r() * 6;
                    c.hareket(function (t) {
                        var x = (x0 + t * hiz) % 800 - 100;
                        var kanat = 0.6 + 0.4 * Math.sin(t * 9 + faz);
                        kus.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + (y + Math.sin(t * 0.8 + faz) * 8).toFixed(1) + ') scale(1 ' + kanat.toFixed(2) + ')');
                    });
                })();
            }
        }
    }

    function onHava(c, r, h) {
        var g = c.katman(1.15);
        // Esinti: rüzgâr ne kadar sertse o kadar çok ve hızlı çizgi
        var esintiler = [];
        for (var i = 0; i < 12; i++) {
            esintiler.push({ el: c.canli(g, 'line', { x1: 0, y1: 0, x2: 0, y2: 0 }, 'esinti'), x: r() * 700, y: arasi(r, 60, 560), boy: arasi(r, 18, 60), hiz: arasi(r, 60, 120), sira: i / 12 });
        }
        c.hareket(function (t, A) {
            var gorunen = sinirla(A / 1.2, 0.15, 1);
            esintiler.forEach(function (e) {
                var x = (e.x + t * e.hiz * (0.6 + A * 2.2)) % 760 - 80;
                var y = e.y + Math.sin(t * 1.3 + e.x) * 6;
                e.el.setAttribute('x1', x.toFixed(1)); e.el.setAttribute('y1', y.toFixed(1));
                e.el.setAttribute('x2', (x + e.boy * (0.5 + A)).toFixed(1)); e.el.setAttribute('y2', (y + 1).toFixed(1));
                e.el.style.opacity = e.sira < gorunen ? (0.2 + 0.2 * Math.sin(t * 2 + e.x)).toFixed(2) : 0;
            });
        });
        if (h.sis) {
            for (var k = 0; k < 4; k++) {
                (function () {
                    var bant = c.canli(g, 'rect', { x: -200, y: arasi(r, 180, 520), width: 1000, height: arasi(r, 40, 90), rx: 40 }, 'sis');
                    var faz = r() * 6, genlik = arasi(r, 30, 80);
                    c.hareket(function (t) { bant.setAttribute('transform', 'translate(' + (Math.sin(t * 0.15 + faz) * genlik).toFixed(1) + ' 0)'); });
                })();
            }
        }
        if (h.yagmur) {
            var damla = Math.round(sinirla(14 + h.mm * 6, 14, 90)), damlalar = [];
            for (var d = 0; d < damla; d++) {
                damlalar.push({ el: c.canli(g, 'line', {}, 'damla'), x: r() * 660, y: r() * 640, hiz: arasi(r, 280, 440), boy: arasi(r, 8, 16) });
            }
            c.hareket(function (t, A) {
                var egim = 3 + A * 12;
                damlalar.forEach(function (dm) {
                    var y = (dm.y + t * dm.hiz) % 640 - 20, x = ((dm.x - (y / 600) * egim * 5) % 660 + 660) % 660 - 30;
                    dm.el.setAttribute('x1', x.toFixed(1)); dm.el.setAttribute('y1', y.toFixed(1));
                    dm.el.setAttribute('x2', (x - egim * 0.4).toFixed(1)); dm.el.setAttribute('y2', (y + dm.boy).toFixed(1));
                });
            });
        }
        if (h.kar) {
            var taneler = [];
            for (var n = 0; n < 60; n++) {
                taneler.push({ el: c.canli(g, 'circle', { r: arasi(r, 1.2, 3) }, 'kar-tanesi'), x: r() * 620, y: r() * 640, hiz: arasi(r, 20, 50), faz: r() * 6 });
            }
            c.hareket(function (t, A) {
                taneler.forEach(function (k) {
                    var y = (k.y + t * k.hiz) % 640 - 20;
                    var x = ((k.x + Math.sin(t * 0.9 + k.faz) * 14 + t * A * 12) % 620 + 620) % 620 - 10;
                    k.el.setAttribute('cx', x.toFixed(1)); k.el.setAttribute('cy', y.toFixed(1));
                });
            });
        }
        if (h.firtina) {
            var isik = c.canli(g, 'rect', { x: 0, y: 0, width: 600, height: 600 }, 'simsek-isik');
            var cakma = c.canli(g, 'path', { d: '' }, 'simsek');
            var donem = arasi(r, 6, 9), sonCakma = -1;
            c.hareket(function (t) {
                var p = t % donem, an = Math.floor(t / donem);
                var yaniyor = p < 0.12 || (p > 0.22 && p < 0.3);
                isik.style.opacity = yaniyor ? 0.35 : 0;
                cakma.style.opacity = yaniyor ? 1 : 0;
                if (an !== sonCakma) {
                    if (sonCakma !== -1) c.olay('simsek');
                    sonCakma = an;
                    var x = 80 + ((an * 7919) % 440), y = 0, yol = 'M' + x + ' ' + y;
                    while (y < 330) { y += 30 + ((an * 31 + y) % 30); x += ((an + y) % 2 ? 1 : -1) * (10 + (y % 17)); yol += ' L' + x + ' ' + y; }
                    cakma.setAttribute('d', yol);
                }
            });
        }
    }

    /* ---- bir kenti kur ---- */
    var sahneler = [];

    function kur(svg, kent, secenek) {
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        var slug = kent.slug || kent.baslik;
        var bicim = BICIMLER[kent.kent] ? kent.kent : SIRA[karma(slug) % SIRA.length];
        var r = tohum(karma(slug + ':' + bicim));
        var rHava = tohum(karma(slug + ':hava'));
        var gunler = (kent.gunler || []).slice(-GUN_SINIRI);
        var son = gunler.length ? gunler[gunler.length - 1] : null;
        var h = son ? havaTuru(son) : null;

        if (son && sayi(son.sc_max)) {
            var gok = document.createElementNS(NS, 'rect');
            gok.setAttribute('width', 600); gok.setAttribute('height', 600);
            gok.setAttribute('class', 'gok' + (h && h.bulut >= 3 ? ' kapali' : ''));
            gok.style.fill = gokRengi((son.sc_max + (sayi(son.sc_min) ? son.sc_min : son.sc_max)) / 2);
            svg.appendChild(gok);
        }

        var c = new Cizer(svg);
        if (h) gokyuzu(c, rHava, h);
        var ekle = KENTLER[bicim](c, r);

        // Her gün kente o günün verisiyle bir yapı ekler
        gunler.forEach(function (gun) {
            var gr = tohum(karma(slug + '|' + gun.t));
            ekle(60 + gr() * 480, 140 + gr() * 360, gun, 'gun');
        });

        if (h) onHava(c, rHava, h);

        var sahne = {
            svg: svg,
            hareketler: c.hareketler,
            A: son && sayi(son.ruzgar) ? sinirla(son.ruzgar / 35, 0.2, 1.4) : 0.5,
            aktif: !!(secenek && secenek.aktif),
            ekle: ekle,
            bicim: bicim,
            gunler: gunler,
            son: son,
            hava: h,
            cizer: c
        };
        sahneler.push(sahne);
        return sahne;
    }

    function dongu(ms) {
        var t = ms / 1000;
        for (var i = 0; i < sahneler.length; i++) {
            var s = sahneler[i];
            if (!s.aktif) continue;
            for (var j = 0; j < s.hareketler.length; j++) s.hareketler[j](t, s.A);
        }
        requestAnimationFrame(dongu);
    }
    if (!azHareket) requestAnimationFrame(dongu);

    /* ---- atlas ---- */
    var gozcu = 'IntersectionObserver' in window ? new IntersectionObserver(function (girdiler) {
        girdiler.forEach(function (g) {
            var s = g.target._sahne;
            if (g.isIntersecting) g.target.classList.add('ciziliyor');
            if (s) s.aktif = g.isIntersecting && !azHareket;
        });
    }, { rootMargin: '0px 0px -10% 0px' }) : null;

    veri.forEach(function (kent) {
        var kart = document.createElement('button');
        kart.type = 'button';
        kart.className = 'kent-kart';
        var svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 600 600');
        svg.setAttribute('aria-hidden', 'true');
        kart.appendChild(svg);
        var s = kur(svg, kent);
        kart._sahne = s;
        kent.bicimAd = BICIMLER[s.bicim];
        var alt = document.createElement('span');
        alt.className = 'kent-alt';
        var ad = document.createElement('strong');
        ad.textContent = kent.hayal_adi || kent.baslik;
        alt.appendChild(ad);
        kart.appendChild(alt);
        kart.addEventListener('click', function () { ac(kent); });
        atlas.appendChild(kart);
        if (azHareket || !gozcu) { kart.classList.add('ciziliyor', 'hazir'); s.aktif = !azHareket; }
        else gozcu.observe(kart);
    });

    /* ---- kentin içi ---- */
    var pencere = document.getElementById('kent');
    var sahneSvg = document.getElementById('kent-svg');
    var haritaKutu = document.getElementById('kent-harita');
    var gecis = pencere.querySelectorAll('.gecis button');
    var harita = null, isaret = null, simdiki = null, icSahne = null;

    function anahtar(k) { return 'yol-kent-' + (k.slug || k.baslik); }
    function oku(k) {
        try { return JSON.parse(localStorage.getItem(anahtar(k)) || '[]'); } catch (e) { return []; }
    }
    function yaz(k, liste) {
        try { localStorage.setItem(anahtar(k), JSON.stringify(liste.slice(-80))); } catch (e) { /* depolama kapalı olabilir */ }
    }

    /* ---- ses ---- */
    var sesDugme = document.getElementById('kent-ses');
    var Ses = window.KentSesi;
    function sesAcik() {
        try { return localStorage.getItem('yol-ses') !== 'kapali'; } catch (e) { return true; }
    }
    function sesGoster() {
        var acik = sesAcik();
        sesDugme.setAttribute('aria-pressed', String(acik));
        sesDugme.textContent = acik ? 'Ses açık' : 'Ses kapalı';
    }
    function sesBaslat() {
        if (!Ses || !Ses.destek || !icSahne || !simdiki || !sesAcik()) return;
        Ses.baslat({
            sesler: simdiki.sesler,
            dil: simdiki.dil,
            lehce: simdiki.lehce,
            kayitlar: simdiki.kayitlar,
            taban: window.YOL_TABAN,
            bicim: icSahne.bicim,
            hava: icSahne.hava,
            A: icSahne.A,
            sicaklik: icSahne.son && sayi(icSahne.son.sc_max) ? icSahne.son.sc_max : null
        });
    }
    if (!Ses || !Ses.destek) sesDugme.hidden = true;
    sesDugme.addEventListener('click', function () {
        try { localStorage.setItem('yol-ses', sesAcik() ? 'kapali' : 'acik'); } catch (e) { /* depolama kapalı olabilir */ }
        sesGoster();
        if (sesAcik()) sesBaslat(); else Ses.durdur();
    });

    function tr(v, basamak) {
        return Number(v).toLocaleString('tr-TR', { maximumFractionDigits: basamak || 0 });
    }
    function gunlukYazi(s) {
        if (!s.son || !s.hava) return '';
        var h = s.hava, g = s.son, sozler = [];
        if (h.firtina) sozler.push('fırtınalı');
        else if (h.kar) sozler.push('karlı');
        else if (h.yagmur) sozler.push('yağmurlu');
        else if (h.sis) sozler.push('sisli');
        else if (h.bulut >= 3) sozler.push('kapalı');
        else if (h.bulut === 2) sozler.push('parçalı bulutlu');
        else sozler.push('açık');
        if (s.A >= 0.8) sozler.push('rüzgârlı');
        return 'dün · ' + (sayi(g.sc_max) ? tr(g.sc_max) + '° · ' : '') + sozler.join(', ');
    }

    function mod(ad) {
        gecis.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mod') === ad)); });
        var gorunen = ad === 'gorunen';
        sahneSvg.style.display = gorunen ? 'none' : '';
        haritaKutu.hidden = !gorunen;
        if (icSahne) icSahne.aktif = !gorunen && !azHareket;
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
        if (icSahne) sahneler.splice(sahneler.indexOf(icSahne), 1);
        icSahne = kur(sahneSvg, kent, { aktif: !azHareket });
        icSahne.cizer.dinleyici = function (ad) { if (ad === 'simsek' && Ses) Ses.gok(); };
        oku(kent).forEach(function (p) { icSahne.ekle(p[0], p[1], null, ''); });
        document.getElementById('kent-tur').textContent = kent.bicimAd;
        document.getElementById('kent-ad').textContent = kent.hayal_adi || kent.baslik;
        document.getElementById('kent-yer').textContent = [kent.yer, kent.donem].filter(Boolean).join(' · ');
        document.getElementById('kent-anlati').textContent = kent.hayal || '';
        document.getElementById('kent-anlati').parentNode.hidden = !kent.hayal;
        document.getElementById('kent-gunluk').textContent = gunlukYazi(icSahne);
        var link = document.getElementById('kent-link');
        link.href = kent.url;
        link.textContent = kent.dolu ? 'Hikâyeyi oku →' : 'Hikâyenin sayfası →';
        sahneSvg.classList.remove('ciziliyor');
        void sahneSvg.getBoundingClientRect();
        sahneSvg.classList.add('ciziliyor');
        mod('gorunmez');
        sesGoster();
        sesBaslat();
        if (pencere.open) return;
        if (typeof pencere.showModal === 'function') pencere.showModal();
        else pencere.setAttribute('open', '');
    }

    function kapat() {
        if (typeof pencere.close === 'function') pencere.close();
        else pencere.removeAttribute('open');
    }
    pencere.addEventListener('close', function () {
        if (icSahne) icSahne.aktif = false;
        if (Ses) Ses.durdur();
    });

    function svgNokta(olay) {
        var p = sahneSvg.createSVGPoint();
        p.x = olay.clientX; p.y = olay.clientY;
        var m = sahneSvg.getScreenCTM();
        if (!m) return null;
        p = p.matrixTransform(m.inverse());
        return [Math.round(p.x), Math.round(p.y)];
    }

    sahneSvg.addEventListener('click', function (olay) {
        if (!icSahne || !simdiki) return;
        var p = svgNokta(olay);
        if (!p) return;
        icSahne.ekle(p[0], p[1], null, 'yeni');
        var liste = oku(simdiki);
        liste.push(p);
        yaz(simdiki, liste);
    });

    if (!azHareket) {
        sahneSvg.addEventListener('pointermove', function (olay) {
            var b = sahneSvg.getBoundingClientRect();
            var nx = (olay.clientX - b.left) / b.width - 0.5, ny = (olay.clientY - b.top) / b.height - 0.5;
            sahneSvg.querySelectorAll('g[data-d]').forEach(function (g) {
                var d = parseFloat(g.getAttribute('data-d'));
                g.setAttribute('transform', 'translate(' + (nx * (1 - d) * 40).toFixed(1) + ' ' + (ny * (1 - d) * 24).toFixed(1) + ')');
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
