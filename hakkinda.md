---
layout: default
title: Hakkında
permalink: /hakkinda/
---
<article class="yazi" markdown="1">

# Hakkında

Ben Rahmi Can; L'Aquila'da, Gran Sasso Science Institute'ta ekonomik coğrafya üzerine doktora yapıyorum. Burada gittiğim yerlerden kalan hikâyeleri ve anıları yazıyorum.

Akademik çalışmalarım: [rcyamanoglu.com](https://rcyamanoglu.com/)

<details class="kaynaklar">
<summary>Kentlerin sesleri</summary>
<p>Kayıtlar <a href="https://freesound.org/">freesound</a>'dan, kamu malı (CC0). Kaydedenlere teşekkürler:</p>
<ul>
{%- for k in site.data.ses_kaynaklari %}
<li><a href="{{ k.sayfa }}">{{ k.baslik | split: " by " | first }}</a> · {{ k.kisi | url_decode }}</li>
{%- endfor %}
</ul>
</details>

</article>
