# Yol

Yol hikâyeleri ve anılar. Yayın adresi: <https://rcyamanoglu.com/yol/>

Site GitHub Pages üzerinde Jekyll ile kendiliğinden oluşur; `main` dalına giren her değişiklik bir iki dakika içinde yayına çıkar.

## Yeni hikâye eklemek

1. `_drafts/ornek-hikaye.md` dosyasını kopyala, üst kısımdaki bilgileri doldur, metni yaz.
2. Hazır olunca dosyayı `_posts/` klasörüne `YYYY-AA-GG-kisa-ad.md` adıyla koy (ör. `2026-10-15-lund-treni.md`).
3. Fotoğrafları `assets/img/` klasörüne yükle.

`_drafts/` içindeki yazılar yayında görünmez. `_posts/` içinde metni boş olan bir yazı listede "Henüz yazılmadı" olarak görünür; boş yerleri böyle tutabilirsin.

## Harita: hayal edilen, var olan

Haritada her yerin iki konumu var: gerçek konum (`konum`) ve zihindeki konum (`hayal_konum`). Kaydırıcı ikisi arasında gidip gelir, aradaki kesikli çizgi farkı gösterir. `hayal_konum` yazılmamış yerler hayal katmanında boş halka olarak görünür.

**Sen de dene:** Ziyaretçi haritaya bakmadan yerleri hafızasından yerleştirir, sonra gerçeği görür. Kendi hayal konumlarını üretmek için de bunu kullanabilirsin: yerleştir, "Göster"e bas, "Konumları kopyala" ile çıkan satırları ilgili yazılara yapıştır.

### Üst bilgi alanları

| Alan | Ne işe yarar | Zorunlu mu |
|---|---|---|
| `title` | Başlık | evet |
| `yer` | "Lund, İsveç" gibi | hayır |
| `konum` | `[enlem, boylam]`; haritada nokta olur | hayır |
| `ozet` | Listede görünen kısa metin | hayır |
| `donem` | "2021 – 2023" gibi; tarih yerine görünür | hayır |
| `hayal` | Gitmeden önce nasıl hayal ettiğin, tek cümle | hayır |
| `gercek` | Vardığında ne bulduğun, tek cümle | hayır |
| `hayal_konum` | `[enlem, boylam]`; zihnindeki konum, haritanın hayal katmanı | hayır |
| `kapak` | Kapak fotoğrafı yolu | hayır |
| `kapak_aciklama` | Fotoğraf altı yazısı | hayır |

## Yerelde denemek

```sh
bundle install
bundle exec jekyll serve --drafts
```

Sonra <http://localhost:4000/yol/> adresini aç.
