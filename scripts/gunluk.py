#!/usr/bin/env python3
"""Görünmez Kentler için günlük veri.

Her yazı için (konumu olanlar) dünkü hava durumunu Open-Meteo'dan, dünkü
İngilizce Vikipedi görüntülenme sayısını Wikimedia'dan çeker ve
_data/gunluk.json dosyasına ekler. Aynı gün ikinci kez çalışırsa o günü
yeniden yazmaz. Yalnızca standart kütüphane kullanır.

Kullanım:  python3 scripts/gunluk.py [--tarih YYYY-AA-GG]
"""
import datetime as dt
import json
import pathlib
import re
import sys
import urllib.parse
import urllib.request

KOK = pathlib.Path(__file__).resolve().parent.parent
VERI = KOK / "_data" / "gunluk.json"
SAKLA = 400  # kent başına en fazla kaç gün tutulur
AJAN = "rcyamanoglu.com/yol gunluk (https://rcyamanoglu.com/yol/)"


def getir(url):
    istek = urllib.request.Request(url, headers={"User-Agent": AJAN})
    with urllib.request.urlopen(istek, timeout=30) as yanit:
        return json.load(yanit)


def yazilar():
    for yol in sorted((KOK / "_posts").glob("*.md")):
        metin = yol.read_text(encoding="utf-8")
        bas = re.match(r"^---\n(.*?)\n---", metin, re.S)
        if not bas:
            continue
        on = bas.group(1)
        konum = re.search(r"^konum:\s*\[\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\]", on, re.M)
        if not konum:
            continue
        wiki = re.search(r'^wiki:\s*"([^"]+)"', on, re.M)
        yield {
            "slug": yol.stem[11:],
            "enlem": float(konum.group(1)),
            "boylam": float(konum.group(2)),
            "wiki": wiki.group(1) if wiki else None,
        }


def hava(enlem, boylam, gun):
    sorgu = urllib.parse.urlencode({
        "latitude": enlem,
        "longitude": boylam,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code",
        "timezone": "auto",
        "start_date": gun,
        "end_date": gun,
    })
    d = getir("https://api.open-meteo.com/v1/forecast?" + sorgu)["daily"]
    al = lambda k: d.get(k, [None])[0]
    return {
        "sc_max": al("temperature_2m_max"),
        "sc_min": al("temperature_2m_min"),
        "yagis": al("precipitation_sum"),
        "ruzgar": al("wind_speed_10m_max"),
        "kod": al("weather_code"),
    }


def ilgi(sayfa, gun):
    g = gun.replace("-", "")
    baslik = urllib.parse.quote(sayfa.replace(" ", "_"), safe="")
    url = ("https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/"
           f"en.wikipedia/all-access/user/{baslik}/daily/{g}/{g}")
    ogeler = getir(url).get("items", [])
    return ogeler[0]["views"] if ogeler else None


def main():
    gun = (dt.date.today() - dt.timedelta(days=1)).isoformat()
    if "--tarih" in sys.argv:
        gun = sys.argv[sys.argv.index("--tarih") + 1]

    veri = json.loads(VERI.read_text(encoding="utf-8")) if VERI.exists() else {}
    kentler = veri.setdefault("kentler", {})
    hata = 0

    for y in yazilar():
        gecmis = kentler.setdefault(y["slug"], [])
        if any(g.get("t") == gun for g in gecmis):
            continue
        kayit = {"t": gun}
        try:
            kayit.update(hava(y["enlem"], y["boylam"], gun))
        except Exception as e:  # bir kaynağın düşmesi ötekini durdurmasın
            hata += 1
            print(f"[hava] {y['slug']}: {e}", file=sys.stderr)
        if y["wiki"]:
            try:
                kayit["ilgi"] = ilgi(y["wiki"], gun)
            except Exception as e:
                hata += 1
                print(f"[ilgi] {y['slug']}: {e}", file=sys.stderr)
        if len(kayit) > 1:
            gecmis.append(kayit)
            gecmis.sort(key=lambda g: g["t"])
            del gecmis[:-SAKLA]
        print(y["slug"], kayit)

    veri["guncelleme"] = gun
    VERI.write_text(json.dumps(veri, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    if hata:
        print(f"{hata} istek başarısız oldu", file=sys.stderr)


if __name__ == "__main__":
    main()
