/* Kentlerin sesi.
   Hiç ses dosyası yok: her ses Web Audio ile o anda üretilir. Bir kentin
   sesleri yazısındaki "sesler" alanından (martı, vapur, trafik, korna,
   bisiklet, kilise, tramvay, cırcır), havası da günlük veriden gelir:
   rüzgâr, yağmur, gök gürültüsü, açık havada kuşlar; aynalı kentte su.
   Sesler yalnızca bir kent açıkken çalar; tarayıcı kuralları gereği ilk
   ses bir tıklamayla başlar. */
(function () {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { window.KentSesi = { baslat: function () {}, durdur: function () {}, gok: function () {}, destek: false }; return; }

    var ctx = null, ana = null, gurultu = null;
    var zamanlayicilar = [], kaynaklar = [], aktif = false, ayar = null;

    function rnd(a, b) { return a + Math.random() * (b - a); }

    function hazirla() {
        if (ctx) return;
        ctx = new AC();
        var n = ctx.sampleRate * 2;
        gurultu = ctx.createBuffer(1, n, ctx.sampleRate);
        var d = gurultu.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }

    function gurultuKaynagi() {
        var s = ctx.createBufferSource();
        s.buffer = gurultu;
        s.loop = true;
        return s;
    }
    function filtre(tip, frek, q) {
        var f = ctx.createBiquadFilter();
        f.type = tip; f.frequency.value = frek; f.Q.value = q || 0.7;
        return f;
    }
    function kazanc(v) { var g = ctx.createGain(); g.gain.value = v; return g; }
    function pan(v) {
        if (!ctx.createStereoPanner) return kazanc(1);
        var p = ctx.createStereoPanner(); p.pan.value = v; return p;
    }
    function bagla() {
        for (var i = 0; i < arguments.length - 1; i++) arguments[i].connect(arguments[i + 1]);
        return arguments[arguments.length - 1];
    }
    function birak(dugum, sure) {
        // geçici düğümleri iş bitince temizle
        setTimeout(function () { try { dugum.disconnect(); } catch (e) { /* zaten kopuk */ } }, sure * 1000 + 200);
    }

    // Sürekli katman: gürültü → filtre → kazanç → ana
    function katman(tip, frek, q, ses) {
        var s = gurultuKaynagi(), f = filtre(tip, frek, q), g = kazanc(0);
        bagla(s, f, g, ana);
        s.start(0, Math.random() * 1.9);
        g.gain.linearRampToValueAtTime(ses, ctx.currentTime + 2);
        kaynaklar.push(s);
        return { f: f, g: g };
    }
    function lfo(param, hz, derinlik) {
        var o = ctx.createOscillator(), g = kazanc(derinlik);
        o.frequency.value = hz;
        bagla(o, g, param);
        o.start();
        kaynaklar.push(o);
    }
    function tekrarla(fn, min, max) {
        (function sonraki() {
            var id = setTimeout(function () {
                zamanlayicilar.splice(zamanlayicilar.indexOf(id), 1);
                if (!aktif) return;
                fn();
                sonraki();
            }, rnd(min, max) * 1000);
            zamanlayicilar.push(id);
        })();
    }
    function zarf(g, t, tepe, atak, sure) {
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(tepe, t + atak);
        g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    }

    /* ---- olay sesleri ---- */
    var OLAY = {
        'martı': function () {
            var t = ctx.currentTime, p = pan(rnd(-0.8, 0.8)), bp = filtre('bandpass', 1300, 1.2);
            bagla(bp, p, ana);
            var kac = 2 + Math.floor(Math.random() * 3);
            for (var i = 0; i < kac; i++) {
                var o = ctx.createOscillator(), g = kazanc(0), v = ctx.createOscillator(), vg = kazanc(35);
                var t0 = t + i * rnd(0.35, 0.55), ust = rnd(1500, 1950);
                o.type = 'triangle';
                o.frequency.setValueAtTime(ust * 0.85, t0);
                o.frequency.linearRampToValueAtTime(ust, t0 + 0.06);
                o.frequency.exponentialRampToValueAtTime(ust * 0.52, t0 + 0.42);
                v.frequency.value = rnd(18, 26);
                bagla(v, vg, o.frequency);
                bagla(o, g, bp);
                zarf(g, t0, 0.18, 0.03, 0.45);
                o.start(t0); o.stop(t0 + 0.5); v.start(t0); v.stop(t0 + 0.5);
            }
            birak(p, 3);
        },
        'trafik': function () {
            // geçen bir araba: yaklaşıp uzaklaşan, perdesi kayan bir uğultu
            var t = ctx.currentTime, s = gurultuKaynagi(), f = filtre('bandpass', 300, 1.5), g = kazanc(0), sag = Math.random() < 0.5;
            var p = pan(sag ? -1 : 1), sure = rnd(2.5, 4);
            bagla(s, f, g, p, ana);
            f.frequency.setValueAtTime(320, t);
            f.frequency.linearRampToValueAtTime(rnd(650, 800), t + sure * 0.5);
            f.frequency.linearRampToValueAtTime(300, t + sure);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(rnd(0.12, 0.22), t + sure * 0.5);
            g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
            if (p.pan) p.pan.linearRampToValueAtTime(sag ? 1 : -1, t + sure);
            s.start(t, Math.random()); s.stop(t + sure + 0.1);
            birak(p, sure);
        },
        'korna': function () {
            var t = ctx.currentTime, lp = filtre('lowpass', 1800), g = kazanc(0), p = pan(rnd(-0.6, 0.6));
            bagla(lp, g, p, ana);
            [rnd(400, 440), rnd(500, 540)].forEach(function (fr) {
                var o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = fr;
                o.connect(lp); o.start(t); o.stop(t + 0.7);
            });
            var ikili = Math.random() < 0.5;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.06, t + 0.02);
            g.gain.setValueAtTime(0.06, t + (ikili ? 0.15 : 0.45));
            g.gain.linearRampToValueAtTime(0, t + (ikili ? 0.18 : 0.5));
            if (ikili) { g.gain.linearRampToValueAtTime(0.06, t + 0.3); g.gain.setValueAtTime(0.06, t + 0.5); g.gain.linearRampToValueAtTime(0, t + 0.55); }
            birak(p, 1);
        },
        'vapur': function () {
            var t = ctx.currentTime, lp = filtre('lowpass', 520), g = kazanc(0), sure = rnd(1.6, 2.4);
            bagla(lp, g, pan(rnd(-0.4, 0.4)), ana);
            [98, 147, 196].forEach(function (fr, i) {
                var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr * rnd(0.99, 1.01);
                var og = kazanc(1 / (i + 1)); bagla(o, og, lp); o.start(t); o.stop(t + sure + 1);
            });
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.12, t + 0.3);
            g.gain.setValueAtTime(0.12, t + sure);
            g.gain.exponentialRampToValueAtTime(0.0001, t + sure + 0.9);
            birak(g, sure + 1);
        },
        'bisiklet': function () {
            var t = ctx.currentTime, p = pan(rnd(-0.7, 0.7));
            p.connect(ana);
            for (var i = 0; i < 2; i++) {
                [2350, 4120].forEach(function (fr, k) {
                    var o = ctx.createOscillator(), g = kazanc(0), t0 = t + i * 0.16;
                    o.frequency.value = fr; bagla(o, g, p);
                    zarf(g, t0, k ? 0.03 : 0.07, 0.005, 0.7);
                    o.start(t0); o.stop(t0 + 0.8);
                });
            }
            birak(p, 1.2);
        },
        'kilise': function () {
            var t = ctx.currentTime, temel = rnd(180, 300), p = pan(rnd(-0.5, 0.5)), vurus = 1 + Math.floor(Math.random() * 3);
            p.connect(ana);
            for (var v = 0; v < vurus; v++) {
                [[0.5, 0.5], [1, 0.9], [1.19, 0.45], [1.5, 0.35], [2, 0.3], [2.74, 0.15]].forEach(function (k) {
                    var o = ctx.createOscillator(), g = kazanc(0), t0 = t + v * 1.9;
                    o.frequency.value = temel * k[0]; bagla(o, g, p);
                    zarf(g, t0, 0.05 * k[1], 0.01, 4.5 / (0.6 + k[0] * 0.4));
                    o.start(t0); o.stop(t0 + 5);
                });
            }
            birak(p, vurus * 2 + 5);
        },
        'tramvay': function () {
            var t = ctx.currentTime, s = gurultuKaynagi(), f = filtre('lowpass', 180), g = kazanc(0), p = pan(rnd(-0.6, 0.6));
            bagla(s, f, g, p, ana);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.2, t + 2);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
            s.start(t, Math.random()); s.stop(t + 4.6);
            [1180, 2360].forEach(function (fr, k) {
                var o = ctx.createOscillator(), og = kazanc(0);
                o.frequency.value = fr; bagla(o, og, p);
                zarf(og, t + 0.6, k ? 0.02 : 0.06, 0.005, 1.4);
                o.start(t + 0.6); o.stop(t + 2.2);
            });
            birak(p, 5);
        },
        'kuş': function () {
            var t = ctx.currentTime, p = pan(rnd(-0.8, 0.8)), kac = 3 + Math.floor(Math.random() * 4), taban = rnd(2800, 3800);
            p.connect(ana);
            for (var i = 0; i < kac; i++) {
                var o = ctx.createOscillator(), g = kazanc(0), t0 = t + i * rnd(0.09, 0.16);
                o.frequency.setValueAtTime(taban, t0);
                o.frequency.exponentialRampToValueAtTime(taban * rnd(1.2, 1.5), t0 + 0.07);
                bagla(o, g, p);
                zarf(g, t0, 0.035, 0.01, 0.1);
                o.start(t0); o.stop(t0 + 0.12);
            }
            birak(p, 2);
        },
        'damla': function () {
            var t = ctx.currentTime, o = ctx.createOscillator(), g = kazanc(0), fr = rnd(900, 1800);
            o.frequency.setValueAtTime(fr, t);
            o.frequency.exponentialRampToValueAtTime(fr * 1.6, t + 0.04);
            bagla(o, g, pan(rnd(-1, 1)), ana);
            zarf(g, t, 0.025, 0.002, 0.06);
            o.start(t); o.stop(t + 0.08);
        }
    };

    /* ---- inşaat: çekiç, kırıcı, taşlama, vinç ---- */
    var INSAAT = {
        cekic: function () {
            var t = ctx.currentTime, p = pan(rnd(-0.7, 0.7)), kac = 3 + Math.floor(Math.random() * 6), ara = rnd(0.32, 0.55);
            p.connect(ana);
            for (var i = 0; i < kac; i++) {
                var t0 = t + i * ara * rnd(0.9, 1.1);
                var s = gurultuKaynagi(), f = filtre('bandpass', rnd(2200, 3000), 2), g = kazanc(0);
                bagla(s, f, g, p);
                zarf(g, t0, 0.35, 0.002, 0.07);
                s.start(t0, Math.random()); s.stop(t0 + 0.1);
                var o = ctx.createOscillator(), og = kazanc(0);
                o.frequency.value = rnd(1500, 1900); bagla(o, og, p);
                zarf(og, t0, 0.06, 0.002, 0.25);
                o.start(t0); o.stop(t0 + 0.3);
            }
            birak(p, kac * ara + 1);
        },
        kirici: function () {
            var t = ctx.currentTime, sure = rnd(1.5, 3.5), s = gurultuKaynagi(), f = filtre('bandpass', rnd(700, 1000), 1.2);
            var am = kazanc(0), g = kazanc(0), p = pan(rnd(-0.6, 0.6));
            bagla(s, f, am, g, p, ana);
            var o = ctx.createOscillator(), og = kazanc(0.5);
            o.type = 'square'; o.frequency.value = rnd(18, 24);
            bagla(o, og, am.gain);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.28, t + 0.05);
            g.gain.setValueAtTime(0.28, t + sure);
            g.gain.linearRampToValueAtTime(0, t + sure + 0.1);
            s.start(t, Math.random()); s.stop(t + sure + 0.2); o.start(t); o.stop(t + sure + 0.2);
            birak(p, sure + 0.5);
        },
        taslama: function () {
            var t = ctx.currentTime, sure = rnd(2, 4), p = pan(rnd(-0.6, 0.6)), g = kazanc(0);
            bagla(g, p, ana);
            var o = ctx.createOscillator(), lp = filtre('bandpass', 3000, 3);
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(rnd(2600, 3000), t);
            o.frequency.linearRampToValueAtTime(rnd(3300, 3800), t + 0.4);
            o.frequency.linearRampToValueAtTime(rnd(3000, 3400), t + sure);
            bagla(o, lp, g);
            var s = gurultuKaynagi(), hp = filtre('highpass', 4000, 0.7), sg = kazanc(0.5);
            bagla(s, hp, sg, g);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.05, t + 0.3);
            g.gain.setValueAtTime(0.05, t + sure);
            g.gain.exponentialRampToValueAtTime(0.0001, t + sure + 0.6);
            o.start(t); o.stop(t + sure + 0.7); s.start(t, Math.random()); s.stop(t + sure + 0.7);
            birak(p, sure + 1);
        },
        vinc: function () {
            var t = ctx.currentTime, p = pan(rnd(-0.8, 0.8)), kac = 4 + Math.floor(Math.random() * 4);
            p.connect(ana);
            for (var i = 0; i < kac; i++) {
                var o = ctx.createOscillator(), g = kazanc(0), t0 = t + i * 0.8;
                o.frequency.value = 1050; bagla(o, g, p);
                g.gain.setValueAtTime(0, t0);
                g.gain.linearRampToValueAtTime(0.035, t0 + 0.01);
                g.gain.setValueAtTime(0.035, t0 + 0.4);
                g.gain.linearRampToValueAtTime(0, t0 + 0.41);
                o.start(t0); o.stop(t0 + 0.45);
            }
            birak(p, kac * 0.8 + 0.5);
        }
    };
    OLAY['inşaat'] = function () {
        var secim = Math.random();
        if (secim < 0.4) INSAAT.cekic();
        else if (secim < 0.65) INSAAT.kirici();
        else if (secim < 0.85) INSAAT.taslama();
        else INSAAT.vinc();
    };

    /* ---- bağırışlar: tarayıcının konuşma motoruyla, kentin dilinde ----
       Konuşma Web Audio'dan geçmez; bu yüzden ses düğmesi ve durdur() onu
       ayrıca keser. O dilde bir ses yoksa hiç bağırılmaz: yanlış aksanla
       konuşan bir işçi, susan bir işçiden kötüdür. */
    var BAGIRIS = {
        it: ['Dai, dai!', 'Piano, piano!', 'Attenzione!', 'Ferma! Ferma!', 'Vai, vai, vai!', 'Più a destra!', 'Giù! Giù!',
             'Andiamo, ragazzi!', 'Oh! Mario! Vieni qua!', 'Ancora un po\'!', 'Basta così!', 'Ma che fai?!', 'Pausa caffè!',
             'Su! Tira su!', 'Occhio!', 'Aspetta, aspetta!', 'Dove sta il martello?', 'Forza!']
    };
    var konusma = window.speechSynthesis || null;
    function dilSesi(dil) {
        if (!konusma) return null;
        var kok = dil.split('-')[0].toLowerCase();
        var sesler = konusma.getVoices().filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf(kok) === 0; });
        return sesler[Math.floor(Math.random() * sesler.length)] || null;
    }
    if (konusma && konusma.getVoices) konusma.getVoices(); // sesleri önceden yükle
    OLAY['bağırış'] = function () {
        var dil = (ayar && ayar.dil) || 'it-IT', kok = dil.split('-')[0];
        var liste = BAGIRIS[kok], ses = dilSesi(dil);
        if (!liste || !ses || konusma.speaking) return;
        var kac = Math.random() < 0.35 ? 2 : 1;
        for (var i = 0; i < kac; i++) {
            var u = new SpeechSynthesisUtterance(liste[Math.floor(Math.random() * liste.length)]);
            u.voice = ses; u.lang = ses.lang;
            u.rate = rnd(1.05, 1.3); u.pitch = rnd(0.7, 1.15); u.volume = rnd(0.35, 0.6);
            konusma.speak(u);
        }
    };

    function gok() {
        if (!aktif || !ctx) return;
        var t = ctx.currentTime + rnd(0.4, 1.8), s = gurultuKaynagi(), f = filtre('lowpass', 140), g = kazanc(0);
        bagla(s, f, g, ana);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.7, t + 0.12);
        g.gain.exponentialRampToValueAtTime(0.25, t + 0.8);
        g.gain.exponentialRampToValueAtTime(0.0001, t + rnd(3, 4.5));
        f.frequency.setValueAtTime(260, t);
        f.frequency.exponentialRampToValueAtTime(90, t + 3);
        s.start(t, Math.random()); s.stop(t + 4.6);
        birak(g, 5.5);
    }

    function baslat(a) {
        hazirla();
        durdur(true);
        ayar = a || {};
        if (ctx.state === 'suspended') ctx.resume();
        aktif = true;
        ana = kazanc(0);
        ana.connect(ctx.destination);
        ana.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 1.5);

        var sesler = (ayar.sesler || '').split(/[\s,]+/).filter(Boolean);
        var h = ayar.hava || {}, A = ayar.A || 0.5;
        var sus = h.kar ? 0.5 : 1; // kar sesi bastırır

        if (sesler.indexOf('trafik') > -1) {
            katman('lowpass', 320, 0.7, 0.05 * sus);
            tekrarla(OLAY['trafik'], 3, 8);
        }
        if (sesler.indexOf('korna') > -1) tekrarla(OLAY['korna'], 9, 22);
        if (sesler.indexOf('martı') > -1) tekrarla(OLAY['martı'], 4, 12);
        if (sesler.indexOf('vapur') > -1) tekrarla(OLAY['vapur'], 18, 40);
        if (sesler.indexOf('bisiklet') > -1) tekrarla(OLAY['bisiklet'], 7, 18);
        if (sesler.indexOf('kilise') > -1) tekrarla(OLAY['kilise'], 20, 45);
        if (sesler.indexOf('tramvay') > -1) tekrarla(OLAY['tramvay'], 12, 28);
        if (sesler.indexOf('inşaat') > -1) {
            // arkada sürekli çalışan bir dizel motoru
            var motor = ctx.createOscillator(), mlp = filtre('lowpass', 160), mg = kazanc(0);
            motor.type = 'sawtooth'; motor.frequency.value = 46;
            bagla(motor, mlp, mg, ana);
            mg.gain.linearRampToValueAtTime(0.06 * sus, ctx.currentTime + 2);
            motor.start();
            kaynaklar.push(motor);
            lfo(motor.frequency, 0.3, 2);
            tekrarla(OLAY['inşaat'], 1.5, 5);
        }
        if (sesler.indexOf('bağırış') > -1) tekrarla(OLAY['bağırış'], 6, 16);
        if (sesler.indexOf('cırcır') > -1 && (ayar.sicaklik == null || ayar.sicaklik >= 20)) {
            var c = katman('bandpass', 5200, 9, 0.025);
            lfo(c.g.gain, 28, 0.02);
        }
        if (ayar.bicim === 'ayna') {
            var su = katman('lowpass', 480, 0.8, 0.05);
            lfo(su.g.gain, 0.18, 0.03);
        }
        // Rüzgâr her zaman biraz vardır; şiddeti günün rüzgârından
        var r = katman('bandpass', 550, 0.9, 0.03 + A * 0.1);
        lfo(r.f.frequency, 0.09, 250);
        lfo(r.g.gain, 0.13, 0.02 + A * 0.04);
        if (h.yagmur) {
            katman('highpass', 1400, 0.6, 0.04 + Math.min((h.mm || 2) / 12, 1) * 0.1);
            tekrarla(OLAY['damla'], 0.15, 0.6);
        }
        if (h.acik && !h.yagmur && !h.kar) tekrarla(OLAY['kuş'], 3, 9);
    }

    function durdur(hemen) {
        aktif = false;
        if (konusma) konusma.cancel();
        zamanlayicilar.forEach(clearTimeout);
        zamanlayicilar = [];
        if (!ctx || !ana) return;
        var eski = ana, eskiKaynaklar = kaynaklar;
        kaynaklar = [];
        ana = null;
        var sure = hemen ? 0.15 : 0.6;
        eski.gain.cancelScheduledValues(ctx.currentTime);
        eski.gain.setValueAtTime(eski.gain.value, ctx.currentTime);
        eski.gain.linearRampToValueAtTime(0, ctx.currentTime + sure);
        setTimeout(function () {
            eskiKaynaklar.forEach(function (k) { try { k.stop(); } catch (e) { /* çoktan durmuş */ } });
            try { eski.disconnect(); } catch (e) { /* zaten kopuk */ }
        }, sure * 1000 + 100);
    }

    window.KentSesi = {
        destek: true,
        baslat: baslat,
        durdur: function () { durdur(false); },
        gok: gok,
        durum: function () { return { aktif: aktif, kaynak: kaynaklar.length, zamanlayici: zamanlayicilar.length, baglam: ctx ? ctx.state : null }; }
    };
})();
