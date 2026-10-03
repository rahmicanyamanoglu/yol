# Yol

Yol hikâyeleri ve anılar. Yayın adresi: <https://rcyamanoglu.com/yol/>

Site GitHub Pages üzerinde Jekyll ile kendiliğinden oluşur; `main` dalına giren her değişiklik bir iki dakika içinde yayına çıkar.

## Yeni hikâye eklemek

1. `_drafts/ornek-hikaye.md` dosyasını kopyala, üst kısımdaki bilgileri doldur, metni yaz.
2. Hazır olunca dosyayı `_posts/` klasörüne `YYYY-AA-GG-kisa-ad.md` adıyla koy (ör. `2026-10-15-lund-treni.md`).
3. Fotoğrafları `assets/img/` klasörüne yükle.

`_drafts/` içindeki yazılar yayında görünmez.

### Üst bilgi alanları

| Alan | Ne işe yarar | Zorunlu mu |
|---|---|---|
| `title` | Başlık | evet |
| `yer` | "Lund, İsveç" gibi | hayır |
| `konum` | `[enlem, boylam]`; haritada nokta olur | hayır |
| `ozet` | Listede görünen kısa metin | hayır |
| `kapak` | Kapak fotoğrafı yolu | hayır |
| `kapak_aciklama` | Fotoğraf altı yazısı | hayır |

## Yerelde denemek

```sh
bundle install
bundle exec jekyll serve --drafts
```

Sonra <http://localhost:4000/yol/> adresini aç.
