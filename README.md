# Sistem Perpustakaan Berbasis Web

Sistem perpustakaan berbasis web adalah sebuah web server yang dibuat dengan nodejs dan expressjs serta module npm lainnya untuk memudahkan pelaksanaan kegiatan-kegiatan dalam perpustakaan.

Aplikasi ini dibagi menjadi dua bagian, pertama bagian publik dan kedua bagian pengurus perpustakaan. 

1. Bagian Publik  
Bagian publik dapat diakses tanpa memerlukan akun, namun sangat terbatas. Jika ingin menggunakan seluruh fitur yang ada, diharapkan masuk sebagai pengguna terlebih dahulu. bagian ini terdiri dari:
   - Homepage yang berisikan search bar untuk mencari buku, tempat pengumuman, buku-buku pilihan, dan artikel-artikel.
   - Profile yang berisikan data pengguna dan juga bisa mengganti nilai data data tersebut.
   - Reservations yang berisikan riwayat antrian peminjaman yang sedang atau telah dibuat oleh pengguna tersebut. Disini pengguna dapat membatalkan antrian nya dan memodifikasi catatan/note pada antriannya.
   - Checkouts yang berisikan riwayat peminjaman buku yang sedang atau telah di buat oleh pengguna. disini pengguna bisa meminta perpanjangan tenggang waktu peminjaman buku.
   - Login yang digunakan untuk masuk sebagai pengguna tertentu.
   - Register yang digunakan untuk daftar pengguna baru.
   - News Detail yang berisikan informasi mengenai sebuah pengumuman.
   - Article Detail yang berisikan informasi mengenai sebuah artikel.
   - Articles yang berisikan artikel-artikel, pengguna dapat melakukan pencarian terhadap artikel tertentu.
   - Book Detail yang berisikan informasi mengenai buku tertentu. disini pengguna dapat membuat sebuah antrian.

2. Bagian Pengurus Perpustakaan  
Bagian pengurus perpustakaan dibuat untuk pengguna dengan role "librarian" atau "admin". untuk membuat akun dengan kedua role tersebut, hanya boleh dilakukan oleh seorang admin. bagian ini terdiri dari:
   - Admin Panel Books Section, disini pengurus dapat menambahkan data buku baru, menghapus data buku, memodifikasi data buku, dan melakukan pencarian terhadap buku-buku tertentu.
   -  Admin Panel Checkouts Section, disini pengurus dapat menambahkan data peminjaman buku, melakukan pencarian, memodifikasi data peminjaman buku, memproses pengembalian, dan memproses perpanjangan.
   - Admin Panel Reservations Section, disini pengurus dapat menambahkan data antrian peminjaman buku, 




## Langkah menjalankan nya:
1. install Postgresql database di https://www.postgresql.org/download/

2. buka pgadmin4, buat database baru bernama "librarydb" lalu masuk ke dalamnya, buka bagian "query tool" dalam pgadmin4 lalu jalankan semua perintah sql dalam folder "perintah sql" dimulai dari "perintah sql untuk membuat tabel"
 
3. buka projek (bisa melalui vs code), jalankan "npm install" di terminal, pastikan terdapat nodejs 
https://nodejs.org/en/download

4. jalankan projek dengan perintah "node src/server.js" di terminal


### Terdapat 2 user utama yaitu:
email = hanif@gmail.com  
password = hanif

email = hanifadmin@gmail.com  
password = hanifadmin