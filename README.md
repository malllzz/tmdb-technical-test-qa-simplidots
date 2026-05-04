# TMDb "Mark as Favorite" QA Automation Test

## Project Overview
Proyek ini adalah *Technical Test* QA Intern untuk menguji fitur **"Mark as Favorite"** pada platform TMDb. Pengujian mencakup skenario manual (Gherkin) dan otomasi (Cypress) untuk alur tambah, lihat, urut, hingga hapus film favorit.

## Showcase & Documentation
*   **Video Overview**: https://drive.google.com/file/d/1kYXtMjXp1Bn4SyNmnnTPEYGE-khz3iOJ/view?usp=sharing
*   **Test Scenarios**: Mencakup *Positive* & *Negative Case* (Ubah Bahasa, Mark as Favorite, View List, Sorting, dan Remove Favorite).


## Tech Stack & Setup
*   **Tool**: Cypress (JavaScript).
*   **Pattern**: *Stateful Testing* (Test case berjalan sekuensial mengelola state data).

### Installation:
1.  `git clone repository ini`
2.  `npm install`
3.  Buat file `cypress.env.json` di root folder (file ini di-ignore oleh git demi keamanan):
    ```json
    {
      "username": "USERNAME_TMDB_ANDA",
      "password": "PASSWORD_TMDB_ANDA"
    }
    ```
4.  `npx cypress open` atau `npx cypress run`

## Exploratory Feedback
1.  **UX Entry Point**: Sistem sebaiknya otomatis me-redirect user ke halaman Login saat mencoba menandai favorit tanpa otentikasi.
2.  **Lokalisasi**: Deskripsi film belum mengikuti perubahan bahasa aplikasi (tetap Bahasa Inggris), perlu perbaikan pada sinkronisasi metadata.
3.  **Sorting**: *Sorting preference* ditemukan belum persisten setelah user melakukan re-login.
