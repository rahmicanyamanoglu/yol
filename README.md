# Yol

Yol hikâyeleri ve anılar. Yayın adresi: <https://rcyamanoglu.com/yol/>

Site GitHub Pages üzerinde Jekyll ile kendiliğinden oluşur; `main` dalına giren her değişiklik bir iki dakika içinde yayına çıkar.

## Yeni hikâye eklemek

1. `_drafts/ornek-hikaye.md` dosyasını kopyala, üst kısımdaki bilgileri doldur, metni yaz.
2. Hazır olunca dosyayı `_posts/` klasörüne `YYYY-AA-GG-kisa-ad.md` adıyla koy (ör. `2026-10-15-lund-treni.md`).
3. Fotoğrafları `assets/img/` klasörüne yükle.

`_drafts/` içindeki yazılar yayında görünmez. `_posts/` içinde metni boş olan bir yazı listede "Henüz yazılmadı" olarak görünür; boş yerleri böyle tutabilirsin.

## Görünmez Kentler

`/kentler/` sayfası, Calvino'nun *Görünmez Kentler*'inden esinle her yeri hayali bir mimariye çevirir. Çizim, yerin adından türetilen bir tohumla üretilir; yani her kent her açılışta aynı görünür. Beş biçim var:

| `kent` | Biçim | Esin |
|---|---|---|
| `ince` | Direkler, platformlar, merdivenler üstünde bir kent | Zenobia |
| `ip` | Direkler arasında renkli iplerle örülü bir kent | Ersilia |
| `asili` | İki uçurum arasında gerilmiş bir ağa asılı kent | Octavia |
| `ayna` | Suda yansıyan bir kent | Valdrada |
| `hali` | Kentin gerçek biçimini taşıyan labirent bir halı | Eudoxia |

`kent` yazılmazsa biçim addan türetilir. Bir kente tıklayınca içeri girilir: çizim kendini çizer, imleçle derinlik kazanır, dokunulan yere kentin biçimine uygun yeni bir parça eklenir (ziyaretçinin tarayıcısında saklanır). "Görünen" düğmesi aynı yeri gerçek haritada gösterir; `hayal` cümlesi "Marco Polo anlatır" başlığıyla yanında durur.

## Yerelde denemek

```sh
bundle install
bundle exec jekyll serve --drafts
```

Sonra <http://localhost:4000/yol/> adresini aç.
