# MyLaaTachzan Frontend

Aplikasi Nuxt untuk website klinik dan portal operasional. Tampilan admin mengikuti tujuh desain referensi serta `design.md` proyek.

## Menjalankan

```sh
pnpm install
pnpm dev
```

Buka `http://localhost:3000`. Portal staf ada di `/admin/login`, juga tersedia melalui tautan Portal Admin pada footer website.

## Halaman

| Rute | Isi |
| --- | --- |
| `/` | Landing page klinik |
| `/booking` | Form pengajuan reservasi keluarga |
| `/admin/login` | Login administrator PostgreSQL |
| `/admin` | Ringkasan operasional dan antrean verifikasi |
| `/admin/bookings` | Booking, verifikasi, usulan jadwal, riwayat status |
| `/admin/schedule` | Jadwal, filter tenaga medis, kapasitas sesi |
| `/admin/master-data` | Paket, metode, tenaga medis, tarif |
| `/admin/payments` | Kasir setelah layanan, kuitansi dan rekap |
| `/admin/excel` | Sepuluh lembar kerja, CSV, snapshot JSON, simulasi sinkronisasi |
| `/admin/notifications` | Log pesan, template, antrean dan pengaturan simulasi |

## Login administrator

Jalankan script pada folder backend untuk membuat tepat satu akun:

```powershell
.\scripts\setup-admin.ps1
```

Masukkan password PostgreSQL, email admin, dan password login baru (12–128 karakter). Password login disimpan sebagai hash scrypt; tidak ada password bawaan atau akses cepat. Script menambahkan migrasi 005 dan mengisi koneksi privat pada frontend/.env tanpa mencetak password. Jalankan dengan Node 24+ dan dependency frontend terpasang. Restart pnpm dev setelah setup.

Sesi server disimpan di PostgreSQL selama 8 jam; cookie HttpOnly/SameSite=Lax, dengan Secure otomatis pada produksi. Middleware memeriksa sesi ke server saat masuk halaman admin. Logout mencabut sesi di database. Percobaan login dibatasi 10 per alamat koneksi per 15 menit. Belum ada fitur reset password mandiri. Script setup tidak menimpa akun yang sudah ada.

Untuk Railway, gunakan variabel DATABASE_URL privat atau NUXT_DATABASE_URL, serta NUXT_SITE_URL berisi origin HTTPS website. Jangan memakai cookie Secure=false di produksi. Password dan connection string tidak boleh masuk client/public runtimeConfig.

Data contoh admin digunakan bersama antarhalaman dalam sesi aplikasi dan kembali ke data awal saat halaman dimuat ulang. Form publik masih memiliki alur contoh tersendiri. Backend login sudah terhubung PostgreSQL; belum ada koneksi workbook atau WhatsApp eksternal, maupun transaksi pembayaran aktual. Unggah `.xlsx` hanya memeriksa format dasar untuk simulasi; isi berkas tidak diimpor. Ekspor CSV, kuitansi teks, dan snapshot JSON dapat diunduh. Pemulihan snapshot tersedia pada sesi yang sama.

Kode reservasi manual menggunakan `KHT-YYYYMMDD-NNNN` berdasarkan tanggal reservasi saat pendaftaran. Perubahan jadwal mempertahankan kode awal. Persetujuan memerlukan verifikasi identitas dan kapasitas sesi; pengusulan jadwal memerlukan alasan. Pencatatan pembayaran hanya tersedia sesudah layanan selesai dan mencegah pencatatan ganda.

## Pemeriksaan

```sh
pnpm exec nuxt typecheck
pnpm build
```

## Katalog layanan dari PostgreSQL

Master Data serta katalog publik kini terhubung ke PostgreSQL. Landing page dan form booking membaca paket/harga/benefit, metode, tenaga medis aktif, dan sesi melalui /api/catalog. Halaman beranda memakai SSR dinamis sehingga katalog tidak dibekukan saat build. Data nonaktif disembunyikan; koneksi gagal menampilkan pesan error tanpa memakai harga contoh sebagai pengganti. Biaya beberapa anak dijumlahkan dari paket masing-masing. Sebelum simulasi pengajuan, katalog diperiksa kembali dan perubahan pilihan/harga meminta pengguna meninjau ulang.

Pengiriman booking masih simulasi dan belum menyimpan data wali/anak/reservasi ke server. Dashboard operasional, pembayaran, Excel, dan WhatsApp juga belum terhubung ke data operasional PostgreSQL. Untuk melihat perubahan Master Data pada halaman publik yang sudah terbuka, muat ulang halaman.
