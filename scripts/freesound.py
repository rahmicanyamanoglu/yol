#!/usr/bin/env python3
"""Freesound'dan yalnızca CC0 (kamu malı) sesleri arar ve indirir.

    python3 scripts/freesound.py ara "italian shouting" "cantiere" ...
        Her sorgu için arama sayfasını tarar, her sonucun sayfasını açıp lisansını
        doğrular ve CC0 olanları JSON olarak yazar (başlık, kişi, süre, açıklama,
        etiketler, önizleme adresi).

    python3 scripts/freesound.py indir 465284 57204 ...
        Verilen seslerin yüksek kaliteli önizlemesini (mp3) assets/ses/ altına
        indirir; lisans CC0 değilse indirmez. Kaynakları _data/ses_kaynaklari.json'a
        yazar: CC0 atıf istemez ama kimin kaydettiğini bilmek iyidir.

API anahtarı gerekmez; herkese açık sayfalar ve önizlemeler kullanılır.
"""
import html
import json
import pathlib
import re
import sys
import time
import urllib.parse
import urllib.request

KOK = pathlib.Path(__file__).resolve().parent.parent
SES = KOK / "assets" / "ses"
KAYNAK = KOK / "_data" / "ses_kaynaklari.json"
AJAN = "Mozilla/5.0 (rcyamanoglu.com/yol; CC0 ses arayışı)"
CC0 = "creativecommons.org/publicdomain/zero"


def getir(url, ikili=False):
    istek = urllib.request.Request(url, headers={"User-Agent": AJAN})
    with urllib.request.urlopen(istek, timeout=40) as y:
        veri = y.read()
    return veri if ikili else veri.decode("utf-8", "replace")


def meta(sayfa, ad):
    m = re.search(r'<meta[^>]+(?:property|name)="%s"[^>]+content="([^"]*)"' % re.escape(ad), sayfa)
    return html.unescape(m.group(1)) if m else None


def ses_bilgisi(kisi, kimlik):
    url = f"https://freesound.org/people/{kisi}/sounds/{kimlik}/"
    sayfa = getir(url)
    sure = re.search(r"(\d+:\d{2}(?:\.\d+)?)\s*</", sayfa)
    etiketler = sorted(set(re.findall(r'href="/browse/tags/([^/"]+)/"', sayfa)))
    return {
        "id": int(kimlik),
        "kisi": kisi,
        "baslik": meta(sayfa, "og:title"),
        "aciklama": (meta(sayfa, "og:description") or meta(sayfa, "description") or "")[:400],
        "onizleme": meta(sayfa, "og:audio") or (re.search(r'https://cdn\.freesound\.org/previews/[^"\']+-hq\.mp3', sayfa) or [None])[0],
        "cc0": CC0 in sayfa,
        "sure": sure.group(1) if sure else None,
        "etiketler": etiketler[:20],
        "sayfa": url,
    }


def ara(sorgular):
    gorulen, sonuc = set(), []
    for sorgu in sorgular:
        q = urllib.parse.urlencode({"q": sorgu, "f": 'license:"Creative Commons 0"'})
        try:
            sayfa = getir("https://freesound.org/search/?" + q)
        except Exception as e:
            print(f"[ara] {sorgu}: {e}", file=sys.stderr)
            continue
        bulunan = re.findall(r'/people/([^/"]+)/sounds/(\d+)/', sayfa)
        print(f"[ara] {sorgu}: {len(set(bulunan))} sonuç", file=sys.stderr)
        for kisi, kimlik in bulunan:
            if kimlik in gorulen or len(gorulen) >= 60:
                continue
            gorulen.add(kimlik)
            try:
                bilgi = ses_bilgisi(kisi, kimlik)
            except Exception as e:
                print(f"[ses] {kimlik}: {e}", file=sys.stderr)
                continue
            bilgi["sorgu"] = sorgu
            if bilgi["cc0"]:
                sonuc.append(bilgi)
            time.sleep(0.5)
    print("ADAYLAR_JSON_BASLA")
    print(json.dumps(sonuc, ensure_ascii=False, indent=1))
    print("ADAYLAR_JSON_BITIR")


def bul(kimlik):
    # Kişi adını bilmeden sesin sayfasına git: /s/ID/ kısayolu yönlendirir
    istek = urllib.request.Request(f"https://freesound.org/s/{kimlik}/", headers={"User-Agent": AJAN})
    with urllib.request.urlopen(istek, timeout=40) as y:
        son = y.geturl()
    m = re.search(r"/people/([^/]+)/sounds/(\d+)/", son)
    if not m:
        raise RuntimeError("ses sayfası bulunamadı: " + son)
    return ses_bilgisi(m.group(1), m.group(2))


def indir(kimlikler):
    SES.mkdir(parents=True, exist_ok=True)
    kaynaklar = json.loads(KAYNAK.read_text(encoding="utf-8")) if KAYNAK.exists() else []
    var = {k["id"] for k in kaynaklar}
    for kimlik in kimlikler:
        try:
            b = bul(kimlik)
        except Exception as e:
            print(f"[indir] {kimlik}: {e}", file=sys.stderr)
            continue
        if not b["cc0"]:
            print(f"[indir] {kimlik}: CC0 değil, atlandı", file=sys.stderr)
            continue
        if not b["onizleme"]:
            print(f"[indir] {kimlik}: önizleme yok", file=sys.stderr)
            continue
        dosya = SES / f"freesound-{b['id']}.mp3"
        dosya.write_bytes(getir(b["onizleme"], ikili=True))
        print(f"[indir] {kimlik}: {b['baslik']} → {dosya.relative_to(KOK)} ({dosya.stat().st_size // 1024} KB)")
        if b["id"] not in var:
            kaynaklar.append({k: b[k] for k in ("id", "kisi", "baslik", "sayfa", "sure")} | {"dosya": "/" + str(dosya.relative_to(KOK)), "lisans": "CC0"})
        time.sleep(0.5)
    KAYNAK.write_text(json.dumps(kaynaklar, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) < 3 or sys.argv[1] not in ("ara", "indir"):
        sys.exit(__doc__)
    (ara if sys.argv[1] == "ara" else indir)(sys.argv[2:])
