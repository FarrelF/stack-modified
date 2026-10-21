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