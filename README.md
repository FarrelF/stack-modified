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
```

Untuk gambar di Markdown, titipkan hint pada title gambar:

```markdown
![Screenshot](screenshot.png "hint:text")
![Logo](logo.png "hint:icon|Logo caption")
```

Awalan `hint:` akan dihapus sebelum title dirender. Jika ada tanda `|`, teks setelahnya tetap dipakai sebagai caption. Hint diterapkan ke varian WebP dan AVIF, bukan ke format asli.

Rekomendasi: `photo` untuk foto/avatar, `text` atau `drawing` untuk screenshot/teks, dan `icon` atau `text` untuk logo. Jangan set `text` secara global karena ukuran WebP bisa membengkak.

Hint sengaja tidak memakai atribut Goldmark `{hint="text"}` karena itu memerlukan perubahan struktur HTML dan penyesuaian galeri; sintaks title dipilih agar PhotoSwipe tetap aman.

## Dukungan WebMCP

Tema ini menyediakan dukungan opsional untuk [WebMCP](https://developer.chrome.com/docs/ai/webmcp), API eksperimental yang memungkinkan agen peramban menemukan dan memanggil fitur situs melalui `document.modelContext`.

Fitur ini nonaktif secara bawaan. Aktifkan di konfigurasi situs (`config/params.toml`):

```toml
[webmcp]
enabled = true
```

Saat aktif, tema mendaftarkan dua _tool_ baca-saja:

- `search_site(query, limit)` -- mencari memakai indeks pencarian Stack yang sudah ada, yaitu halaman yang memakai `layout: "search"` dan menyediakan output `json`. Hasilnya memuat judul, URL, tanggal, bagian, tag, kategori, dan kutipan singkat.
- `get_current_article()` -- mengembalikan metadata artikel yang sedang dibuka, meliputi judul, URL kanonis, deskripsi, tanggal terbit dan pembaruan, penulis, bagian, tag, kategori, serta daftar _heading_.

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