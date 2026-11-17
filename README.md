# Modifikasi dari tema "Hugo Theme Stack"
## Ikhtisar
Repositori ini merupakan kode sumber untuk tema ["Hugo Theme Stack"](https://github.com/CaiJimmy/hugo-theme-stack) yang telah dimodifikasi untuk keperluan [blog saya sendiri](https://farrel.franqois.id).

Isi dari repositori ini adalah berkas-berkas yang telah dimodifikasi dari tema aslinya, jadi ini bukanlah sebuah _fork_ dari tema aslinya, melainkan ini adalah tema turunan.

## Cara memperolehnya
Untuk memperolehnya, Anda bisa eksekusi perintah berikut untuk mengkloningnya:

```bash
git clone https://github.com/FarrelF/stack-modified.git FarrelF/stack-modified
```

Atau, jika Anda ingin menggunakan SSH, maka Anda bisa gunakan perintah berikut untuk mengkloningnya:

```bash
git clone git@github.com:FarrelF/stack-modified.git FarrelF/stack-modified
```

Atau, jika Anda menggunakan [GitHub CLI](https://cli.github.com), maka perintah untuk mengkloningnya sebagai berikut:

```bash
gh repo clone FarrelF/stack-modified FarrelF/stack-modified
```

Setelah Anda mengkloningnya, terutama dengan perintah di atas, berkas-berkas tersebut akan tersimpan di dalam folder `FarrelF/stack-modified` secara otomatis.

## Pemrosesan Gambar

Tema ini membuat varian WebP dan AVIF untuk gambar yang diproses oleh Hugo. Varian tersebut hanya dipakai jika ukurannya lebih kecil dari format asli, dan AVIF juga harus lebih kecil dari WebP pada semua lebar.

### Hint encoder

Nilai `hint` yang didukung adalah `photo` (default), `picture`, `drawing`, `icon`, dan `text`.

Untuk gambar unggulan (_featured image_), gunakan parameter `imageHint` di front matter:

```yaml
image: cover.png
imageHint: text
imgAlt: Teks alternatif khusus untuk gambar unggulan
```

`imgAlt` bersifat opsional dan hanya dipakai untuk gambar unggulan (cover). Jika kosong, teks alternatif memakai terjemahan `article.featuredImageOf` atau fallback `Featured image of post <judul>`.

Untuk gambar di Markdown, titipkan hint pada title gambar:

```markdown
![Screenshot](screenshot.png "hint:text")
![Logo](logo.png "hint:icon|Logo caption")
```

Awalan `hint:` akan dihapus sebelum title dirender. Jika ada tanda `|`, teks setelahnya tetap dipakai sebagai caption. Hint diterapkan ke varian WebP dan AVIF, bukan ke format asli.

Rekomendasi: `photo` untuk foto/avatar, `text` atau `drawing` untuk screenshot/teks, dan `icon` atau `text` untuk logo. Jangan set `text` secara global karena ukuran WebP bisa membengkak.

Hint sengaja tidak memakai atribut Goldmark `{hint="text"}` karena itu memerlukan perubahan struktur HTML dan penyesuaian galeri, jadi sintaks title dipilih agar PhotoSwipe tetap aman.

### Thumbnail, anchor, dan mode

Ukuran thumbnail dan perilaku crop bisa diatur lewat params:

```toml
[imageProcessing.thumbnail]
width = 60
height = 60
anchor = "Center"   # Smart (default), Center, Top, ...
mode = "fill"       # fill, fit, height

[imageProcessing.tile]
width = 250
height = 150
anchor = "Center"
mode = "fill"

[imageProcessing.search]
width = 120
height = 120
anchor = "Center"
```

`anchor` cuma dipakai kalau `mode = "fill"` dan nilainya mengikuti anchor Hugo, yaitu `Smart`, `Center`, `Top`, `Bottom`, `Left`, `Right`, `TopLeft`, `TopRight`, `BottomLeft`, dan `BottomRight`. Default tema masih `Smart`, tapi sebaiknya pakai `Center` supaya hasil crop selalu sama.

Ada tiga `mode` yang bisa dipakai:

- `fill` memotong gambar sesuai kotak. Ini yang paling rapi untuk foto.
- `fit` memasukkan seluruh gambar ke dalam kotak, jadi ada ruang kosong di sisi yang tersisa. Cocok untuk logo atau gambar ultrawide di tile dan section.
- `height` cuma membatasi tinggi, sedangkan lebarnya mengikuti rasio asli dan dibatasi dua kali tinggi. Cocok untuk compact list yang isinya logo. Tile selalu pakai `fill`.

`imageMode` hanya berpengaruh ke thumbnail (compact, tile, section, dan search). Cover besar di home dan single tidak memakai `imageMode`, tapi `imageCoverMode`.

Kalau perlu override per halaman:

```yaml
Image: cover.webp
ImageAnchor: Top
ImageMode: height       # thumbnail: fill, fit, height
ImagePosition: top      # CSS object-position untuk cover
ImageCoverMode: contain # cover: cover (default) atau contain
```

`ImagePosition` dipakai di cover home dan single yang memakai `Resize` dan `object-fit: cover`, bukan di thumbnail. Nilai yang valid adalah `center`, `top`, `bottom`, `left`, `right`, atau persentase.

`ImageCoverMode` juga cuma untuk cover. Kalau diisi `contain`, seluruh gambar akan tampil dengan ruang kosong di sisi yang tersisa, jadi logo tidak terpotong. Defaultnya `cover`, yang memenuhi area dan memotong sisi berlebih. `imageMode: fit` tidak otomatis mengubah cover.

Catatan:

- `publishResources = false` bikin gambar original tidak dipublikasikan, jadi jangan andalkan URL original untuk fallback.
- `--article-image-height` mengatur tinggi cover di daftar, sedangkan `--article-cover-max-height` mengatur `max-height` cover single (default `50vh`).

## Dukungan WebMCP

Tema ini menyediakan dukungan opsional untuk [WebMCP](https://developer.chrome.com/docs/ai/webmcp), API eksperimental yang memungkinkan agen peramban menemukan dan memanggil fitur situs melalui `document.modelContext`.

Fitur ini nonaktif secara bawaan. Aktifkan di konfigurasi situs (`config/params.toml`):

```toml
[webmcp]
enabled = true
```

Saat aktif, tema mendaftarkan dua _tool_ baca-saja:

- `search_site(query, limit)` untuk mencari memakai indeks pencarian Stack yang sudah ada, yaitu halaman yang memakai `layout: "search"` dan menyediakan output `json`. Hasilnya memuat judul, URL, tanggal, bagian, tag, kategori, dan kutipan singkat.
- `get_current_article()` untuk mengembalikan metadata artikel yang sedang dibuka, meliputi judul, URL kanonis, deskripsi, tanggal terbit dan pembaruan, penulis, bagian, tag, kategori, serta daftar _heading_.

_Tool_ hanya didaftarkan jika `document.modelContext` tersedia, sehingga peramban tanpa dukungan WebMCP tidak terpengaruh. Saat diaktifkan, skrip WebMCP digabungkan ke bundel `main.js` yang sudah ada sehingga tidak menambah permintaan HTTP. Kode _tool_ berada di [`assets/ts/webmcp.ts`](assets/ts/webmcp.ts) dan partial terkait berada di [`layouts/_partials/webmcp/`](layouts/_partials/webmcp/).

Jika halaman pencarian tidak memakai _layout_ `search`, setel path indeks secara eksplisit:

```toml
[webmcp]
enabled = true
searchIndex = "cari/index.json"
```

## Penggabungan Skrip Eksternal

Tema ini dapat menggabungkan skrip JavaScript eksternal yang dideklarasikan di [`data/external.toml`](data/external.toml) ke dalam bundel `main.js`, sehingga tidak ada permintaan HTTP terpisah untuk skrip tersebut. Fitur ini nonaktif secara bawaan dan baru mendukung JavaScript, CSS belum dapat digabung.

Aktifkan di konfigurasi situs (`config/params.toml`):

```toml
[external]
bundle = true
verifyIntegrity = true # opsional, bawaan true
```

Lalu tandai entri yang ingin digabung di `data/external.toml`:

```toml
Twemoji = [
    { src = "https://cdn.jsdelivr.net/npm/@twemoji/api@17.0.3/dist/twemoji.min.js", integrity = "sha512-...", type = "script", bundle = true }
]
```

Perilaku yang perlu diketahui:

- `integrity` bersifat opsional. Jika ada dan `verifyIntegrity = true`, hash diverifikasi saat build, ketidakcocokan menggagalkan build. Tanpa `integrity`, skrip tetap digabung tanpa verifikasi. Setel `verifyIntegrity = false` untuk melewati verifikasi meskipun `integrity` dideklarasikan.
- Entri yang gagal diunduh akan menghasilkan peringatan dan tetap dimuat sebagai permintaan terpisah.
- `defer` dan `async` pada entri tidak lagi berlaku setelah digabung, semuanya mengikuti `main.js` yang memakai `defer`.
- `inline = true` pada entri atau `script.inlineScript = true` membuat bundling dilewati dengan peringatan.
- Skrip ESM seperti Artalk dan PhotoSwipe tidak didukung karena tidak dapat digabung ke `main.js` klasik.
- `bundle = true` pada `type = "style"` belum didukung dan hanya menghasilkan peringatan.
- Skrip yang digabung ditempatkan setelah skrip tema dan sebelum `custom.ts`, sehingga `custom.ts` dapat memakai global seperti `twemoji`.
- Karena `main.js` dipakai di semua halaman, skrip yang ditandai `bundle = true` akan dimuat di setiap halaman. Tandai hanya resource yang memang ingin selalu dimuat.
- Build memerlukan akses jaringan saat cache Hugo masih kosong.

## Gulir Roda Vertikal pada Daftar Horizontal

Daftar kategori di halaman arsip dan daftar subbagian di halaman list dirender sebagai strip horizontal (`.subsection-list`). Karena CSS tidak bisa memetakan input roda vertikal menjadi gulir horizontal, tema ini menambahkan _progressive enhancement_ di [`assets/ts/subsectionScroll.ts`](assets/ts/subsectionScroll.ts).

Perilakunya:

- Roda vertikal di atas strip yang masih bisa digulir akan menggeser strip secara horizontal, bukan halaman.
- Setelah strip mencapai ujung awal atau akhir, event dilepaskan sehingga halaman kembali tergulir normal.
- Roda horizontal (trackpad) tetap ditangani peramban, begitu pula `Shift` + roda, `Ctrl` + roda, dan kombinasi tombol modifier lain.
- Strip yang isinya tidak melebihi lebarnya tidak diintersep sama sekali.
- Gulir sentuh, keyboard, dan _scrollbar_ tetap memakai perilaku bawaan, dan arah RTL ikut didukung.

Skrip ini hanya dimuat di halaman yang benar-benar merender `.subsection-list`, yaitu halaman arsip yang punya kategori dan halaman list yang punya subbagian, sehingga halaman lain tidak menambah permintaan HTTP.

## Cara Kontribusi
Jika Anda ingin mengubah kode sumber untuk memodifikasi tema ini, pertama-tama pastikan bahwa Anda telah mempelajari struktur direktori Hugo.

Lalu, pastikan juga bahwa Anda mengubah berkas/folder tersebut seperlunya, jangan masukkan semua isi dari tema aslinya ke sini.

**Contoh:** Jika Anda ingin memodifikasi berkas `pagination.html` yang terletak di [`layouts/partials/pagination.html`](https://github.com/CaiJimmy/hugo-theme-stack/blob/e24f5672c3bf9680fbc529b43562a94a05c90333/layouts/partials/pagination.html) yang ada di tema aslinya, maka Anda hanya perlu salinkan berkas tersebut ke dalam folder [`layouts/partials`](layouts/partials) yang ada di dalam repositori ini, lalu berkas yang perlu Anda rubah adalah `layouts/partials/pagination.html` yang ada di dalam repositori.

Serta, jika ada berkas yang ingin Anda tambahkan sendiri, silakan tambahkan itu ke dalam repositori ini.

Jika Anda memasukkan semua isi dari tema aslinya, yang mana tidak diperlukan semuanya, maka dengan senang hati saya menolak _pull request_ dari Anda. Harap maklum 😊

## Lisensi
Karena ini merupakan tema turunan, maka lisensi yang saya gunakan sama seperti tema aslinya, yakni di bawah lisensi "GNU General Public License v3.0" atau "GNU GPLv3".

Anda dapat melihat berkas [LICENSE](LICENSE) untuk membaca teks perjanjiannya.

Pengecualian berlaku jika ada sebuah kode sumber/berkas yang dilisensikan di bawah lisensi yang berbeda.