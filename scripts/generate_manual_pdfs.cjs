const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROOT_DIR = path.join(__dirname, '..');
const SCREENSHOT_DIR = path.join(ROOT_DIR, 'docs', 'screenshots');

function getBase64Image(filename) {
  const filePath = path.join(SCREENSHOT_DIR, filename);
  if (!fs.existsSync(filePath)) return '';
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function generatePDFs() {
  console.log('Generating HTML templates with base64 screenshots...');

  const imgLogin = getBase64Image('00_login_portal.png');
  const imgAdminRingkasan = getBase64Image('01_admin_ringkasan_sekolah.png');
  const imgAdminTugasGuru = getBase64Image('02_admin_tugas_guru.png');
  const imgAdminKelasMapel = getBase64Image('03_admin_kelas_mapel.png');
  const imgAdminImpor = getBase64Image('04_admin_impor_dapodik.png');
  const imgAdminBobot = getBase64Image('05_admin_bobot_rapor.png');
  const imgAdminPesan = getBase64Image('06_admin_pesan_sekolah.png');
  const imgGuruInput = getBase64Image('07_guru_input_nilai.png');
  const imgGuruPkl = getBase64Image('08_guru_pkl_magang.png');
  const imgWakaRekap = getBase64Image('09_waka_rekap_nilai.png');
  const imgWakaProgres = getBase64Image('10_waka_progres_live.png');
  const imgKepsekCetak = getBase64Image('11_kepsek_cetak_rapor.png');
  const imgKepsekRiwayat = getBase64Image('12_kepsek_riwayat_nilai.png');

  // ==========================================
  // DOCUMENT 1: PANDUAN LENGKAP FITUR (4 ROLE)
  // ==========================================
  const htmlDoc1 = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Buku Panduan Pengguna SiNilai - SMKN 1 Tanjungpandan</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
      @bottom-right {
        content: "Halaman " counter(page);
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #1e293b;
      background: #ffffff;
      font-size: 9.5pt;
      line-height: 1.5;
    }

    .page {
      page-break-after: always;
      position: relative;
      min-height: 100%;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    /* COVER PAGE */
    .cover-container {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100vh;
      padding: 40px 20px;
      text-align: center;
    }

    .school-emblem {
      width: 110px;
      height: 110px;
      margin: 0 auto 20px auto;
      object-fit: contain;
    }

    .cover-title {
      font-size: 26pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      line-height: 1.2;
      margin-bottom: 12px;
    }

    .cover-subtitle {
      font-size: 13pt;
      font-weight: 600;
      color: #2563eb;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .cover-desc {
      font-size: 10pt;
      color: #64748b;
      max-width: 520px;
      margin: 0 auto 30px auto;
    }

    .role-badge-container {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 40px;
    }

    .role-pill {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 8.5pt;
      font-weight: 700;
      color: #334155;
    }

    .cover-footer {
      border-top: 2px solid #e2e8f0;
      padding-top: 20px;
      font-size: 9pt;
      color: #475569;
    }

    /* SECTION HEADER */
    .role-section-header {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .role-section-header.role-guru {
      background: linear-gradient(135deg, #065f46 0%, #059669 100%);
    }

    .role-section-header.role-waka {
      background: linear-gradient(135deg, #7c2d12 0%, #d97706 100%);
    }

    .role-section-header.role-kepsek {
      background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%);
    }

    .role-header-title {
      font-size: 14pt;
      font-weight: 800;
    }

    .role-header-sub {
      font-size: 8.5pt;
      opacity: 0.9;
      margin-top: 2px;
    }

    .role-tag {
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* FEATURE ROW: SIDE-BY-SIDE (SCREENSHOT + EXPLANATION) */
    .feature-block {
      page-break-inside: avoid;
      margin-bottom: 26px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .feature-title-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1.5px solid #f1f5f9;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }

    .feature-title {
      font-size: 11pt;
      font-weight: 800;
      color: #0f172a;
    }

    .feature-category {
      font-size: 7.5pt;
      font-weight: 700;
      background: #eff6ff;
      color: #1d4ed8;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 16px;
      align-items: start;
    }

    .screenshot-box {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      background: #f8fafc;
      box-shadow: 0 2px 4px rgba(0,0,0,0.06);
    }

    .screenshot-box img {
      width: 100%;
      height: auto;
      display: block;
    }

    .explanation-box {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .info-group {
      font-size: 8.5pt;
    }

    .info-group strong {
      display: block;
      color: #0f172a;
      font-size: 8.5pt;
      margin-bottom: 3px;
    }

    .info-group p {
      color: #334155;
      line-height: 1.45;
    }

    .step-list {
      margin-left: 16px;
      color: #334155;
      font-size: 8.2pt;
      line-height: 1.45;
    }

    .step-list li {
      margin-bottom: 3px;
    }

    .tip-box {
      background: #f0fdf4;
      border-left: 3px solid #22c55e;
      padding: 8px 10px;
      border-radius: 0 6px 6px 0;
      font-size: 8pt;
      color: #166534;
    }

    .tip-box strong {
      color: #15803d;
    }

    .alert-box {
      background: #fef2f2;
      border-left: 3px solid #ef4444;
      padding: 8px 10px;
      border-radius: 0 6px 6px 0;
      font-size: 8pt;
      color: #991b1b;
    }

    .table-summary {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin-top: 10px;
    }

    .table-summary th, .table-summary td {
      border: 1px solid #e2e8f0;
      padding: 6px 8px;
      text-align: left;
    }

    .table-summary th {
      background: #f8fafc;
      font-weight: 700;
      color: #334155;
    }
  </style>
</head>
<body>

  <!-- ==================== HALAMAN 1: COVER ==================== -->
  <div class="page cover-container">
    <div>
      <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpZ6o2KrkbKXybZ8cIkhA02LSpGOzSFlKIw3CipEuDrqObqM96n2s41f6-eE5v8RSsP5b719kbLOB-6T04n5thTef-An5Mz-25dpf7XHsBVqUZvd5Zi_wm4Ay4yLSCy3fV2_97BphWxxWq5S3u-rCp2FJXecQ8gnagFS_JkvyFeCnR5kFXegfvRQLchiwk3jcYLHnZG4ga-y-l3LyWeCKGSYLOYHRWUBr_kk93hCqrucT-lOVsQ3Z20g" alt="Logo SMKN 1 Tanjungpandan" class="school-emblem" />
      <div class="cover-subtitle">Pemerintah Provinsi Kepulauan Bangka Belitung</div>
      <h1 class="cover-title">BUKU PANDUAN PENGGUNA<br>APLIKASI SiNilai SMK</h1>
      <div style="font-size: 11pt; font-weight: 700; color: #1e293b; margin-bottom: 6px;">
        Sistem Manajemen Nilai & Cetak Rapor Digital Kurikulum Merdeka
      </div>
      <div style="font-size: 12pt; font-weight: 800; color: #059669; margin-bottom: 24px;">
        SMK NEGERI 1 TANJUNGPANDAN
      </div>
      <p class="cover-desc">
        Buku pedoman resmi pengoperasian aplikasi nilai bagi seluruh tenaga pendidik dan kependidikan. Dilengkapi tangkapan layar (screenshot) dan instruksi langkah demi langkah untuk setiap hak akses (Role).
      </p>

      <div class="role-badge-container">
        <span class="role-pill">🛠️ Administrator</span>
        <span class="role-pill">👨‍🏫 Guru Pengajar</span>
        <span class="role-pill">📊 Waka Kurikulum</span>
        <span class="role-pill">🏛️ Kepala Sekolah</span>
      </div>
    </div>

    <!-- Kotak Info Login Cepat -->
    <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 14px 20px; max-width: 600px; margin: 0 auto; text-align: left;">
      <div style="font-size: 9pt; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
        🔑 Akses Akun Resmi SiNilai SMK:
      </div>
      <table class="table-summary" style="margin-top: 0;">
        <tr>
          <th>Peran (Role)</th>
          <th>Nama Pengguna / Email</th>
          <th>Kata Sandi Default</th>
          <th>Wewenang Utama</th>
        </tr>
        <tr>
          <td><strong>Administrator</strong></td>
          <td><code>admin@sinilai.sch.id</code></td>
          <td><code>password123</code></td>
          <td>Master data, penugasan guru, pembobotan, backup</td>
        </tr>
        <tr>
          <td><strong>Guru Pengajar</strong></td>
          <td><code>guru.rpl@sinilai.sch.id</code></td>
          <td><code>password123</code></td>
          <td>Input UH, Tugas dinamis, UAS/SAS, PKL, serahkan nilai</td>
        </tr>
        <tr>
          <td><strong>Waka Kurikulum</strong></td>
          <td><code>wakes@sinilai.sch.id</code></td>
          <td><code>password123</code></td>
          <td>Rekapitulasi nilai sekolah, pantau live progress, deadline</td>
        </tr>
        <tr>
          <td><strong>Kepala Sekolah</strong></td>
          <td><code>kepsek@sinilai.sch.id</code></td>
          <td><code>password123</code></td>
          <td>Cetak rapor siswa ber-QR hash, riwayat nilai, audit sekolah</td>
        </tr>
      </table>
    </div>

    <div class="cover-footer">
      <strong>SMK Negeri 1 Tanjungpandan</strong> • Bidang Manajemen Mutu & Kurikulum<br>
      Tahun Ajaran 2024/2025 • Semester Ganjil/Genap
    </div>
  </div>

  <!-- ==================== HALAMAN 2: PORTAL LOGIN ==================== -->
  <div class="page">
    <div class="role-section-header">
      <div>
        <div class="role-header-title">1. Portal Masuk (Login) Sistem</div>
        <div class="role-header-sub">Gerbang otentikasi aman untuk seluruh guru dan pegawai SMKN 1 Tanjungpandan</div>
      </div>
      <div class="role-tag">Semua Pengguna</div>
    </div>

    <div class="feature-block">
      <div class="feature-title-bar">
        <span class="feature-title">Halaman Masuk (Single Sign-On SiNilai)</span>
        <span class="feature-category">Keamanan & Otentikasi</span>
      </div>
      <div class="feature-grid">
        <div class="screenshot-box">
          <img src="${imgLogin}" alt="Tangkapan Layar Login Portal" />
        </div>
        <div class="explanation-box">
          <div class="info-group">
            <strong>Fungsi & Kegunaan Halaman:</strong>
            <p>Halaman utama tempat Bapak/Ibu Guru dan Staf masuk ke dalam sistem penilaian menggunakan NIP resmi atau alamat email sekolah yang terdaftar.</p>
          </div>
          <div class="info-group">
            <strong>Langkah-Langkah Masuk:</strong>
            <ol class="step-list">
              <li>Ketik alamat web portal pada peramban (Chrome/Edge): <code>http://localhost:5173</code> (atau IP server lokal).</li>
              <li>Masukkan <strong>NIP</strong> atau <strong>Email Sekolah</strong> pada kolom pertama.</li>
              <li>Masukkan <strong>Kata Sandi</strong> pada kolom kedua.</li>
              <li>Klik tombol <strong>"Masuk ke Portal SiNilai"</strong>.</li>
            </ol>
          </div>
          <div class="tip-box">
            <strong>Keamanan Berlapis:</strong> Sistem dilengkapi proteksi otomatis (Rate Limiting). Jika salah memasukkan kata sandi lebih dari 5 kali berturut-turut, akun akan terkunci sementara selama 15 menit demi keamanan database nilai siswa.
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== ROLE 1: ADMINISTRATOR ==================== -->
  <div class="page">
    <div class="role-section-header">
      <div>
        <div class="role-header-title">2. Modul Administrator Sekolah</div>
        <div class="role-header-sub">Pengelolaan pusat data guru, kelas, mata pelajaran, impor Dapodik, dan bobot rapor</div>
      </div>
      <div class="role-tag">Hak Akses: Administrator</div>
    </div>

    <!-- Fitur 1: Ringkasan Sekolah -->
    <div class="feature-block">
      <div class="feature-title-bar">
        <span class="feature-title">A. Ringkasan Sekolah (Dashboard Utama Admin)</span>
        <span class="feature-category">Pusat Informasi</span>
      </div>
      <div class="feature-grid">
        <div class="screenshot-box">
          <img src="${imgAdminRingkasan}" alt="Admin Ringkasan Sekolah" />
        </div>
        <div class="explanation-box">
          <div class="info-group">
            <strong>Fungsi Halaman:</strong>
            <p>Menampilkan status kesehatan sistem penilaian, jumlah guru aktif, total siswa, progres penyerahan nilai seluruh kelas, dan aktivitas audit terkini.</p>
          </div>
          <div class="info-group">
            <strong>Komponen Utama:</strong>
            <ul class="step-list">
              <li><strong>Kartu Statistik:</strong> Jumlah Guru Pengajar, Rombongan Belajar (Kelas), Siswa Aktif, dan Persentase Rapor Tuntas.</li>
              <li><strong>Grafik Progres Pengisian:</strong> Menunjukkan perbandingan jumlah kelas yang sudah diserahkan vs yang masih diisi.</li>
              <li><strong>Menu Navigasi Cepat:</strong> Akses kilat menuju pembagian tugas guru, kelas, dan pengaturan bobot rapor.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Fitur 2: Tugas Mengajar Guru -->
    <div class="feature-block">
      <div class="feature-title-bar">
        <span class="feature-title">B. Data Guru & Pembagian Tugas Mengajar</span>
        <span class="feature-category">Manajemen SDM</span>
      </div>
      <div class="feature-grid">
        <div class="screenshot-box">
          <img src="${imgAdminTugasGuru}" alt="Admin Tugas Guru" />
        </div>
        <div class="explanation-box">
          <div class="info-group">
            <strong>Fungsi Halaman:</strong>
            <p>Menentukan mata pelajaran dan rombongan belajar (kelas) yang diampu oleh masing-masing guru, serta memberikan izin khusus cetak rapor.</p>
          </div>
          <div class="info-group">
            <strong>Cara Menetapkan Tugas Guru:</strong>
            <ol class="step-list">
              <li>Cari nama guru pada daftar melalui kolom pencarian.</li>
              <li>Klik tombol <strong>"Atur Tugas & Izin"</strong> di sebelah kanan nama guru.</li>
              <li>Centang mata pelajaran yang diajarkan (misal: Pemrograman Web).</li>
              <li>Centang kelas-kelas yang diampu (misal: 10 RPL 1, 10 RPL 2).</li>
              <li>Klik <strong>"Simpan Tugas Guru"</strong>. Sistem otomatis mensinkronkan hak akses guru tersebut secara instan.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- PAGE: ADMIN FITUR LANJUTAN -->
  <div class="page">
    <!-- Fitur 3: Data Kelas & Mapel -->
    <div class="feature-block">
      <div class="feature-title-bar">
        <span class="feature-title">C. Data Rombel Kelas & Mata Pelajaran</span>
        <span class="feature-category">Kurikulum Sekolah</span>
      </div>
      <div class="feature-grid">
        <div class="screenshot-box">
          <img src="${imgAdminKelasMapel}" alt="Admin Kelas & Mapel" />
        </div>
        <div class="explanation-box">
          <div class="info-group">
            <strong>Fungsi Halaman:</strong>
            <p>Mengelola struktur rombongan belajar (Tingkat X, XI, XII jurusan RPL, TKJ, AK, MP, dll.) serta daftar mata pelajaran umum dan kejuruan.</p>
          </div>
          <div class="info-group">
            <strong>Fitur Unggulan:</strong>
            <ul class="step-list">
              <li><strong>Tambah Rombel:</strong> Membuka kelas baru sesuai kebutuhan tahun ajaran aktif.</li>
              <li><strong>Kelola Mapel & KKM:</strong> Menetapkan KKM/Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) standar per mata pelajaran.</li>
              <li><strong>Kategori Pembelajaran:</strong> Pengelompokan Muatan Nasional/Umum, Kejuruan Vokasi, dan Muatan Lokal Bangka Belitung.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Fitur 4: Impor Dapodik / Excel -->
    <div class="feature-block">
      <div class="feature-title-bar">
        <span class="feature-title">D. Impor Data Siswa Dapodik / File Excel</span>
        <span class="feature-category">Integrasi Data</span>
      </div>
      <div class="feature-grid">
        <div class="screenshot-box">
          <img src="${imgAdminImpor}" alt="Admin Impor Dapodik" />
        </div>
        <div class="explanation-box">
          <div class="info-group">
            <strong>Fungsi Halaman:</strong>
            <p>Memasukkan ratusan data siswa rombel baru sekaligus dari file Excel unduhan Dapodik tanpa perlu mengetik satu per satu.</p>
          </div>
          <div class="info-group">
            <strong>Cara Mengimpor Berkas:</strong>
            <ol class="step-list">
              <li>Siapkan file Excel dengan kolom: <em>NISN, Nama Siswa, NIS, Jenis Kelamin (L/P), Rombel Kelas</em>.</li>
              <li>Tarik file atau klik tombol <strong>"Pilih File Excel/CSV"</strong>.</li>
              <li>Sistem akan menampilkan pratinjau tabel siswa dan memvalidasi duplikasi NISN.</li>
              <li>Klik <strong>"Konfirmasi & Simpan ke Database"</strong>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- PAGE: ADMIN PENGATURAN BOBOT & KONTEN -->
  <div class="page">
    <!-- Fitur 5: Pengaturan Bobot Rapor -->
    <div class="feature-block">
      <div class="feature-title-bar">
        <span class="feature-title">E. Pengaturan Bobot Nilai Rapor (SMKN 1 Tanjungpandan)</span>
        <span class="feature-category">Rumus Nilai Akhir (NA)</span>
      </div>
      <div class="feature-grid">
        <div class="screenshot-box">
          <img src="${imgAdminBobot}" alt="Admin Bobot Rapor" />
        </div>
        <div class="explanation-box">
          <div class="info-group">
            <strong>Fungsi Halaman:</strong>
            <p>Menentukan formula perhitungan Nilai Akhir (NA) rapor secara transparan dan fleksibel, baik secara umum (global) maupun khusus mata pelajaran kejuruan tertentu.</p>
          </div>
          <div class="info-group">
            <strong>Rumus Penghitungan Otomatis:</strong>
            <p><code>NA = (Rata UH × Bobot%) + (Rata Tugas × Bobot%) + (SAS/UAS × Bobot%)</code></p>
          </div>
          <div class="info-group">
            <strong>Aturan Sistem:</strong>
            <ul class="step-list">
              <li>Total akumulasi ketiga komponen wajib berjumlah tepat <strong>100%</strong>.</li>
              <li>Admin & Kepala Sekolah dapat menetapkan formula standar (misal: UH 40%, Tugas 20%, SAS 40%).</li>
              <li>Jika ada mata pelajaran kejuruan yang memerlukan bobot praktik lebih besar, dapat diatur khusus per mapel.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Fitur 6: Pesan & Teks Sekolah -->
    <div class="feature-block">
      <div class="feature-title-bar">
        <span class="feature-title">F. Pesan & Teks Sekolah (SMKN 1 Tanjungpandan)</span>
        <span class="feature-category">Konten & Pengumuman</span>
      </div>
      <div class="feature-grid">
        <div class="screenshot-box">
          <img src="${imgAdminPesan}" alt="Admin Pesan Sekolah" />
        </div>
        <div class="explanation-box">
          <div class="info-group">
            <strong>Fungsi Halaman:</strong>
            <p>Admin dapat mengubah pengumuman running text, salam pembuka, nama sekolah di header, dan instruksi pengisian nilai tanpa menyentuh kode program.</p>
          </div>
          <div class="info-group">
            <strong>Langkah Perubahan:</strong>
            <ol class="step-list">
              <li>Pilih kelompok halaman (Global, Login, Dashboard Guru, dll.).</li>
              <li>Ubah teks pada kotak input yang diinginkan.</li>
              <li>Klik tombol <strong>"Simpan Semua Perubahan"</strong> di pojok kanan atas.</li>
              <li>Perubahan langsung aktif seketika untuk semua guru yang sedang membuka website.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== ROLE 2: GURU PENGAJAR ==================== -->
  <div class="page">
    <div class="role-section-header role-guru">
      <div>
        <div class="role-header-title">3. Modul Guru Pengajar</div>
        <div class="role-header-sub">Input penilaian harian, tugas dinamis, ujian teori/praktik, catatan capaian, dan penilaian PKL</div>
      </div>
      <div class="role-tag">Hak Akses: Guru</div>
    </div>

    <!-- Fitur 7: Input Nilai Siswa -->
    <div class="feature-block">
      <div class="feature-title-bar">
        <span class="feature-title">A. Input Nilai Siswa (Tabel Fleksibel & Tombol Teori/Praktik)</span>
        <span class="feature-category">Penilaian Rapor Utama</span>
      </div>
      <div class="feature-grid">
        <div class="screenshot-box">
          <img src="${imgGuruInput}" alt="Guru Input Nilai" />
        </div>
        <div class="explanation-box">
          <div class="info-group">
            <strong>Fungsi Halaman:</strong>
            <p>Tempat guru menginput nilai siswa untuk mata pelajaran dan rombel yang diampu. Dilengkapi fitur penambahan kolom tugas/UH dinamis serta toggle saklar Teori/Praktik.</p>
          </div>
          <div class="info-group">
            <strong>Fitur Unggulan Terbaru:</strong>
            <ul class="step-list">
              <li><strong>Kolom Dinamis (+ Tambah Kolom):</strong> Guru dapat menambah kolom penilaian harian (UH5, UH6...) dan kolom Tugas (Tugas1, Tugas2...) sesuai kebutuhan silabus.</li>
              <li><strong>Hapus Kolom (Tombol X):</strong> Dekatkan kursor mouse ke header kolom tambahan untuk menghapus kolom jika salah buat.</li>
              <li><strong>Saklar Teori & Praktik:</strong> Dapat disembunyikan/ditampilkan menggunakan tombol ON/OFF jika mapel hanya menilai salah satunya.</li>
              <li><strong>Kunci Kolom Siswa:</strong> Kolom No, NISN, dan Nama Siswa terkunci rapi (sticky freeze) saat tabel digeser ke kanan.</li>
              <li><strong>Perhitungan Otomatis:</strong> Nilai Rata-rata dan Nilai Akhir (NA) terkalkulasi secara realtime.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Fitur 8: Nilai PKL Siswa -->
    <div class="feature-block">
      <div class="feature-title-bar">
        <span class="feature-title">B. Penilaian Praktik Kerja Lapangan (PKL) / Magang</span>
        <span class="feature-category">Pendidikan Vokasi V/V</span>
      </div>
      <div class="feature-grid">
        <div class="screenshot-box">
          <img src="${imgGuruPkl}" alt="Guru Penilaian PKL" />
        </div>
        <div class="explanation-box">
          <div class="info-group">
            <strong>Fungsi Halaman:</strong>
            <p>Pencatatan dan evaluasi nilai magang industri peserta didik SMKN 1 Tanjungpandan yang terintegrasi dengan rapor Kurikulum Merdeka.</p>
          </div>
          <div class="info-group">
            <strong>4 Aspek Penilaian Industri:</strong>
            <ul class="step-list">
              <li><strong>Disiplin & Etika Kerja (25%):</strong> Kehadiran, ketepatan waktu, dan SOP tempat kerja.</li>
              <li><strong>Keahlian Teknis / Hard Skill (35%):</strong> Penguasaan kompetensi kejuruan di dunia industri.</li>
              <li><strong>Kerjasama & Komunikasi (20%):</strong> Interaksi dengan tim dan atasan di tempat magang.</li>
              <li><strong>Laporan & Portofolio PKL (20%):</strong> Kelengkapan dokumen laporan akhir hasil magang.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== ROLE 3: WAKA KURIKULUM ==================== -->
  <div class="page">
    <div class="role-section-header role-waka">
      <div>
        <div class="role-header-title">4. Modul Wakil Kepala Sekolah (Waka Kurikulum)</div>
        <div class="role-header-sub">Pemantauan kelengkapan leger nilai, batas waktu pengumpulan, dan ekspor file Excel</div>
      </div>
      <div class="role-tag">Hak Akses: Waka Kurikulum</div>
    </div>

    <!-- Fitur 9: Rekap Nilai Siswa -->
    <div class="feature-block">
      <div class="feature-title-bar">
        <span class="feature-title">A. Rekapitulasi & Pemantauan Nilai Rapor Siswa</span>
        <span class="feature-category">Leger Nilai Terpadu</span>
      </div>
      <div class="feature-grid">
        <div class="screenshot-box">
          <img src="${imgWakaRekap}" alt="Waka Rekap Nilai" />
        </div>
        <div class="explanation-box">
          <div class="info-group">
            <strong>Fungsi Halaman:</strong>
            <p>Melihat dan memeriksa leger nilai seluruh rombel kelas secara komprehensif, memeriksa siswa di bawah KKTP/KKM, dan mengunduh rekapitulasi ke berkas Excel.</p>
          </div>
          <div class="info-group">
            <strong>Wewenang Khusus Waka:</strong>
            <ul class="step-list">
              <li><strong>Atur Batas Waktu (Deadline):</strong> Menetapkan tanggal jatuh tempo pengumpulan nilai bagi seluruh guru mata pelajaran.</li>
              <li><strong>Kembalikan Nilai (Revisi):</strong> Jika ditemukan kesalahan nilai dari guru, Waka dapat mengembalikan status rapor menjadi draf dengan catatan revisi khusus.</li>
              <li><strong>Unduh Rekap Excel:</strong> Mengekspor rekapitulasi nilai satu kelas dalam format spreadsheet standar dinas.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Fitur 10: Live Progress Pengisian Nilai -->
    <div class="feature-block">
      <div class="feature-title-bar">
        <span class="feature-title">B. Progres Pengisian & Penyerahan Nilai Guru (Live)</span>
        <span class="feature-category">Monitoring Keterisian</span>
      </div>
      <div class="feature-grid">
        <div class="screenshot-box">
          <img src="${imgWakaProgres}" alt="Waka Progres Nilai Live" />
        </div>
        <div class="explanation-box">
          <div class="info-group">
            <strong>Fungsi Halaman:</strong>
            <p>Memantau secara langsung (real-time) status pengisian rapor setiap guru tanpa harus bertanya satu per satu melalui pesan teks.</p>
          </div>
          <div class="info-group">
            <strong>Arti Indikator Status:</strong>
            <ul class="step-list">
              <li><span style="color:#15803d; font-weight:700;">🟢 Terkirim & Terverifikasi:</span> Guru telah menyelesaikan dan menyerahkan nilai resmi ke kurikulum.</li>
              <li><span style="color:#b45309; font-weight:700;">🟡 Sedang Diisi (Draf):</span> Guru sudah mulai mengisi sebagian nilai siswa.</li>
              <li><span style="color:#b91c1c; font-weight:700;">🔴 Belum Mengisi:</span> Guru belum mulai menginput nilai pada rombel tersebut.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== ROLE 4: KEPALA SEKOLAH ==================== -->
  <div class="page">
    <div class="role-section-header role-kepsek">
      <div>
        <div class="role-header-title">5. Modul Kepala Sekolah</div>
        <div class="role-header-sub">Pencetakan rapor resmi ber-QR Code Hash, validasi dokumen, dan riwayat audit perubahan nilai</div>
      </div>
      <div class="role-tag">Hak Akses: Kepala Sekolah</div>
    </div>

    <!-- Fitur 11: Cetak Rapor & Verifikasi QR -->
    <div class="feature-block">
      <div class="feature-title-bar">
        <span class="feature-title">A. Cetak Rapor Resmi & Verifikasi Keaslian QR Code</span>
        <span class="feature-category">Dokumen Resmi Sekolah</span>
      </div>
      <div class="feature-grid">
        <div class="screenshot-box">
          <img src="${imgKepsekCetak}" alt="Kepsek Cetak Rapor" />
        </div>
        <div class="explanation-box">
          <div class="info-group">
            <strong>Fungsi Halaman:</strong>
            <p>Mencetak dokumen rapor Kurikulum Merdeka resmi lengkap dengan Kop Surat SMKN 1 Tanjungpandan, tabel nilai capaian, tanda tangan elektronik, serta QR Hash anti-pemalsuan.</p>
          </div>
          <div class="info-group">
            <strong>Fitur Keamanan QR Hash:</strong>
            <ul class="step-list">
              <li>Setiap lembar rapor memiliki kode unik kriptografi (SHA-256) yang tercetak dalam bentuk QR Code.</li>
              <li>Orang tua atau instansi penerima dapat memindai QR untuk memastikan keaslian nilai siswa langsung ke server sekolah.</li>
              <li>Fitur cetak ini diproteksi secara ketat: hanya dapat diakses oleh Kepala Sekolah, Waka, dan Admin.</li>
            </ul>
          </div>
          <div class="tip-box">
            <strong>Petunjuk Cetak:</strong> Klik tombol <strong>"Cetak Rapor / Simpan PDF"</strong>. Pada jendela print dialog, pilih printer atau opsi "Save as PDF" dengan orientasi Portrait dan ukuran kertas A4.
          </div>
        </div>
      </div>
    </div>

    <!-- Fitur 12: Riwayat Perubahan Nilai (Audit Log) -->
    <div class="feature-block">
      <div class="feature-title-bar">
        <span class="feature-title">B. Riwayat Perubahan Nilai Siswa (Audit Log)</span>
        <span class="feature-category">Transparansi & Akuntabilitas</span>
      </div>
      <div class="feature-grid">
        <div class="screenshot-box">
          <img src="${imgKepsekRiwayat}" alt="Kepsek Riwayat Nilai" />
        </div>
        <div class="explanation-box">
          <div class="info-group">
            <strong>Fungsi Halaman:</strong>
            <p>Buku catatan digital yang merekam seluruh jejak perubahan nilai siswa. Mencegah manipulasi nilai dan menjamin transparansi penilaian sekolah.</p>
          </div>
          <div class="info-group">
            <strong>Informasi yang Terekam:</strong>
            <ul class="step-list">
              <li><strong>Waktu Kejadian (WIB):</strong> Tanggal, jam, menit, dan detik perubahan dilakukan.</li>
              <li><strong>Nama Pengubah & Role:</strong> Identitas guru atau admin yang melakukan update.</li>
              <li><strong>Siswa & Mata Pelajaran:</strong> Nama murid dan mapel yang nilainya disesuaikan.</li>
              <li><strong>Nilai Sebelum vs Sesudah:</strong> Nilai lama dan nilai baru yang dimasukkan.</li>
              <li><strong>Alasan Perubahan:</strong> Keterangan wajib dari pengubah (misal: Remedial Bab 3).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== HALAMAN PENUTUP ==================== -->
  <div class="page" style="display: flex; flex-direction: column; justify-content: center; text-align: center; padding: 40px 20px;">
    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpZ6o2KrkbKXybZ8cIkhA02LSpGOzSFlKIw3CipEuDrqObqM96n2s41f6-eE5v8RSsP5b719kbLOB-6T04n5thTef-An5Mz-25dpf7XHsBVqUZvd5Zi_wm4Ay4yLSCy3fV2_97BphWxxWq5S3u-rCp2FJXecQ8gnagFS_JkvyFeCnR5kFXegfvRQLchiwk3jcYLHnZG4ga-y-l3LyWeCKGSYLOYHRWUBr_kk93hCqrucT-lOVsQ3Z20g" alt="Logo SMKN 1 Tanjungpandan" class="school-emblem" style="margin-bottom: 24px;" />
    <h2 style="font-size: 20pt; font-weight: 800; color: #0f172a; margin-bottom: 12px;">
      KOMITMEN MUTU & INTEGRITAS PENILAIAN
    </h2>
    <h3 style="font-size: 13pt; font-weight: 700; color: #2563eb; margin-bottom: 20px;">
      SMK NEGERI 1 TANJUNGPANDAN
    </h3>
    <p style="font-size: 10pt; color: #475569; max-width: 600px; margin: 0 auto 30px auto; line-height: 1.6;">
      Aplikasi SiNilai SMK dirancang untuk mewujudkan tata kelola penilaian yang transparan, akuntabel, dan efisien bagi seluruh civitas akademika SMK Negeri 1 Tanjungpandan. Melalui sistem ini, pendidik dapat fokus mengembangkan potensi setiap peserta didik sesuai semangat Kurikulum Merdeka.
    </p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; max-width: 500px; margin: 0 auto; text-align: left; font-size: 8.5pt;">
      <strong>Layanan Dukungan & Bantuan Teknis:</strong>
      <ul style="margin-left: 18px; margin-top: 6px; color: #334155; line-height: 1.5;">
        <li>Ruang Kerja Tim IT & Dapodik SMKN 1 Tanjungpandan</li>
        <li>Alamat: Jl. Merdeka No. 1, Tanjungpandan, Belitung</li>
        <li>Surel Resmi Sekolah: <code>admin@sinilai.sch.id</code></li>
      </ul>
    </div>
  </div>

</body>
</html>`;

  // ==========================================
  // DOCUMENT 2: CARA MENJALANKAN SERVER
  // ==========================================
  const htmlDoc2 = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Panduan Menjalankan Server SiNilai SMK - SMKN 1 Tanjungpandan</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 14mm 15mm 15mm 15mm;
      @bottom-right {
        content: "Halaman " counter(page);
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #1e293b;
      background: #ffffff;
      font-size: 9.5pt;
      line-height: 1.55;
    }

    .page {
      page-break-after: always;
      position: relative;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    .doc-header {
      border-bottom: 3px double #0f172a;
      padding-bottom: 12px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .doc-header img {
      width: 60px;
      height: 60px;
      object-fit: contain;
    }

    .doc-header-text h1 {
      font-size: 15pt;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
    }

    .doc-header-text h2 {
      font-size: 10pt;
      font-weight: 700;
      color: #2563eb;
    }

    .doc-header-text p {
      font-size: 8pt;
      color: #64748b;
    }

    .section-title {
      font-size: 12pt;
      font-weight: 800;
      color: #0f172a;
      border-left: 4px solid #2563eb;
      padding-left: 10px;
      margin-top: 20px;
      margin-bottom: 12px;
    }

    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
      page-break-inside: avoid;
    }

    .card h3 {
      font-size: 10pt;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    pre, code {
      font-family: 'JetBrains Mono', monospace;
    }

    pre {
      background: #0f172a;
      color: #38bdf8;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 8.5pt;
      overflow-x: auto;
      margin: 8px 0;
      line-height: 1.4;
    }

    code {
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 8.5pt;
      font-weight: 600;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }

    .table-spec {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin: 10px 0;
    }

    .table-spec th, .table-spec td {
      border: 1px solid #e2e8f0;
      padding: 7px 10px;
      text-align: left;
    }

    .table-spec th {
      background: #f8fafc;
      font-weight: 700;
      color: #334155;
    }

    .badge-pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 7.5pt;
      font-weight: 700;
    }

    .badge-blue { background: #eff6ff; color: #1d4ed8; }
    .badge-green { background: #f0fdf4; color: #15803d; }
    .badge-amber { background: #fefce8; color: #b45309; }

    .note-box {
      background: #eff6ff;
      border-left: 3.5px solid #3b82f6;
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      font-size: 8.5pt;
      color: #1e40af;
      margin: 10px 0;
    }

    .success-box {
      background: #f0fdf4;
      border-left: 3.5px solid #22c55e;
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      font-size: 8.5pt;
      color: #166534;
      margin: 10px 0;
    }
  </style>
</head>
<body>

  <!-- ==================== HALAMAN 1 ==================== -->
  <div class="page">
    <div class="doc-header">
      <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpZ6o2KrkbKXybZ8cIkhA02LSpGOzSFlKIw3CipEuDrqObqM96n2s41f6-eE5v8RSsP5b719kbLOB-6T04n5thTef-An5Mz-25dpf7XHsBVqUZvd5Zi_wm4Ay4yLSCy3fV2_97BphWxxWq5S3u-rCp2FJXecQ8gnagFS_JkvyFeCnR5kFXegfvRQLchiwk3jcYLHnZG4ga-y-l3LyWeCKGSYLOYHRWUBr_kk93hCqrucT-lOVsQ3Z20g" alt="Logo SMKN 1" />
      <div class="doc-header-text">
        <h1>Panduan Menjalankan & Mengelola Server</h1>
        <h2>Aplikasi SiNilai SMK — SMKN 1 Tanjungpandan</h2>
        <p>Petunjuk Teknis Deployment, Menjalankan Backend PHP CodeIgniter 4, Frontend Vite, dan Database</p>
      </div>
    </div>

    <div class="section-title">1. Arsitektur & Spesifikasi Sistem</div>
    <div class="card">
      <p>Aplikasi <strong>SiNilai SMKN 1 Tanjungpandan</strong> dibangun menggunakan arsitektur modern terpisah (Decoupled Single Page Application):</p>
      <table class="table-spec">
        <tr>
          <th>Komponen</th>
          <th>Teknologi / Framework</th>
          <th>Port Default</th>
          <th>Keterangan</th>
        </tr>
        <tr>
          <td><strong>Frontend Client</strong></td>
          <td>React 18 + Vite + TypeScript + Tailwind CSS</td>
          <td><code>5173</code></td>
          <td>Antarmuka pengguna interaktif (SPA)</td>
        </tr>
        <tr>
          <td><strong>Backend API</strong></td>
          <td>CodeIgniter 4 (PHP 8.x) + RESTful Controller</td>
          <td><code>8000</code></td>
          <td>Otentikasi JWT, filter keamanan, API kalkulasi</td>
        </tr>
        <tr>
          <td><strong>Database</strong></td>
          <td>SQLite 3 / MySQL (Kompatibel)</td>
          <td>Internal</td>
          <td>Penyimpanan terenkripsi & riwayat audit</td>
        </tr>
      </table>
    </div>

    <div class="section-title">2. Prasyarat Perangkat Lunak (System Requirements)</div>
    <div class="card">
      <p>Sebelum menjalankan server di komputer lokal atau laptop server sekolah, pastikan perangkat lunak berikut telah terpasang:</p>
      <ul style="margin-left: 20px; font-size: 8.5pt; margin-top: 6px;">
        <li><strong>Node.js:</strong> Versi 18.x atau lebih baru (Disarankan versi LTS, cek dengan <code>node -v</code>).</li>
        <li><strong>PHP:</strong> Versi 8.1 atau 8.2+ (Cek dengan <code>php -v</code>).</li>
        <li><strong>Ekstensi PHP Wajib:</strong> <code>php_pdo_sqlite</code>, <code>php_sqlite3</code>, <code>php_intl</code>, <code>php_mbstring</code>, <code>php_fileinfo</code>.</li>
        <li><strong>Web Browser:</strong> Google Chrome atau Microsoft Edge versi terbaru.</li>
      </ul>
    </div>

    <div class="section-title">3. Langkah Menjalankan Server Backend (CodeIgniter 4)</div>
    <div class="card">
      <h3>Langkah 3.1: Buka Terminal pada Folder Backend</h3>
      <p>Buka terminal PowerShell atau Command Prompt pada direktori backend:</p>
      <pre><code>cd "c:\Website coba2\Sekolah\Aplikasi Management Nilai\backend-ci4"</code></pre>

      <h3>Langkah 3.2: Jalankan PHP Built-in Server</h3>
      <p>Jalankan server PHP yang mengarah ke direktori <code>public</code>:</p>
      <pre><code>php -S 127.0.0.1:8000 -t public</code></pre>

      <div class="success-box">
        <strong>Backend Berjalan!</strong> Terminal akan menampilkan pesan: <code>[Date] Development Server (http://127.0.0.1:8000) started</code>. Jangan tutup jendela terminal ini selama aplikasi digunakan.
      </div>
    </div>
  </div>

  <!-- ==================== HALAMAN 2 ==================== -->
  <div class="page">
    <div class="section-title">4. Langkah Menjalankan Server Frontend (React + Vite)</div>
    <div class="card">
      <h3>Langkah 4.1: Buka Terminal Baru untuk Frontend</h3>
      <p>Buka jendela terminal kedua (jangan gunakan terminal backend yang sedang berjalan), lalu arahkan ke folder utama aplikasi:</p>
      <pre><code>cd "c:\Website coba2\Sekolah\Aplikasi Management Nilai"</code></pre>

      <h3>Langkah 4.2: Instalasi Ketergantungan (Jika baru pertama kali)</h3>
      <pre><code>npm install</code></pre>

      <h3>Langkah 4.3: Jalankan Server Development Vite</h3>
      <pre><code>npm run dev</code></pre>

      <div class="success-box">
        <strong>Frontend Berjalan!</strong> Terminal akan menampilkan:
        <pre style="margin-top: 4px;"><code>  VITE v8.3.1  ready in 450 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/ (Dapat diakses oleh laptop guru lain)</code></pre>
      </div>
    </div>

    <div class="section-title">5. Mengakses Aplikasi SiNilai pada Browser</div>
    <div class="card">
      <p>Buka peramban Google Chrome atau Microsoft Edge, kemudian ketikkan alamat:</p>
      <pre><code>http://localhost:5173</code></pre>
      <p style="margin-top: 8px;">Gunakan salah satu dari 4 akun resmi berikut untuk masuk ke sistem:</p>

      <table class="table-spec">
        <tr>
          <th>Role / Jabatan</th>
          <th>Email / Akun Login</th>
          <th>Kata Sandi</th>
          <th>Halaman Awal Default</th>
        </tr>
        <tr>
          <td><span class="badge-pill badge-blue">Admin</span></td>
          <td><code>admin@sinilai.sch.id</code></td>
          <td><code>password123</code></td>
          <td>Tugas Mengajar Guru & Ringkasan Sekolah</td>
        </tr>
        <tr>
          <td><span class="badge-pill badge-green">Guru</span></td>
          <td><code>guru.rpl@sinilai.sch.id</code></td>
          <td><code>password123</code></td>
          <td>Input Nilai Siswa (Tabel Penilaian)</td>
        </tr>
        <tr>
          <td><span class="badge-pill badge-amber">Waka</span></td>
          <td><code>wakes@sinilai.sch.id</code></td>
          <td><code>password123</code></td>
          <td>Rekapitulasi & Pemantauan Nilai Rapor</td>
        </tr>
        <tr>
          <td><span class="badge-pill badge-blue">Kepsek</span></td>
          <td><code>kepsek@sinilai.sch.id</code></td>
          <td><code>password123</code></td>
          <td>Cetak Rapor Siswa & Riwayat Nilai</td>
        </tr>
      </table>
    </div>

    <div class="section-title">6. Panduan Menghubungkan Laptop Guru via WiFi Sekolah (LAN)</div>
    <div class="card">
      <p>Agar Bapak/Ibu Guru dapat membuka aplikasi dari laptop masing-masing tanpa menyalakan server di tiap laptop:</p>
      <ol style="margin-left: 20px; font-size: 8.5pt; margin-top: 6px;">
        <li>Pastikan laptop server dan laptop guru terhubung pada jaringan WiFi yang sama di SMKN 1 Tanjungpandan.</li>
        <li>Cek IP Address laptop server melalui terminal: <code>ipconfig</code> (misal didapat: <code>192.168.1.50</code>).</li>
        <li>Jalankan frontend dengan opsi host: <code>npm run dev -- --host</code></li>
        <li>Jalankan backend dengan binding 0.0.0.0: <code>php -S 0.0.0.0:8000 -t public</code></li>
        <li>Bapak/Ibu Guru cukup membuka alamat: <code>http://192.168.1.50:5173</code> pada browser masing-masing.</li>
      </ol>
    </div>

    <div class="section-title">7. Solusi Kendala Teknis Umum (Troubleshooting)</div>
    <div class="card">
      <table class="table-spec">
        <tr>
          <th>Gejala Kendala</th>
          <th>Penyebab Kemungkinan</th>
          <th>Langkah Solusi</th>
        </tr>
        <tr>
          <td><strong>Port 8000 already in use</strong></td>
          <td>Ada proses PHP atau aplikasi lain yang memakai port 8000.</td>
          <td>Gunakan perintah <code>taskkill /F /IM php.exe</code> pada CMD, atau ganti port: <code>php -S 127.0.0.1:8001 -t public</code>.</td>
        </tr>
        <tr>
          <td><strong>Driver SQLite not found</strong></td>
          <td>Ekstensi pdo_sqlite di <code>php.ini</code> belum dibuka centangnya.</td>
          <td>Buka file <code>php.ini</code>, hapus tanda titik koma (<code>;</code>) di depan baris <code>extension=pdo_sqlite</code> dan <code>extension=sqlite3</code>, lalu simpan.</td>
        </tr>
        <tr>
          <td><strong>CORS Error saat Login</strong></td>
          <td>Server backend belum dinyalakan atau port salah.</td>
          <td>Pastikan terminal backend sudah menampilkan status server <code>127.0.0.1:8000 started</code> sebelum menekan tombol login.</td>
        </tr>
      </table>
    </div>
  </div>

</body>
</html>`;

  // Write HTML files for archival and preview
  const htmlDoc1Path = path.join(ROOT_DIR, 'docs', 'Panduan_Fitur_SiNilai.html');
  const htmlDoc2Path = path.join(ROOT_DIR, 'docs', 'Panduan_Menjalankan_Server.html');

  fs.writeFileSync(htmlDoc1Path, htmlDoc1, 'utf8');
  fs.writeFileSync(htmlDoc2Path, htmlDoc2, 'utf8');
  console.log('HTML files created successfully.');

  // Launch Puppeteer to print PDF
  console.log('Printing PDFs using headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Print PDF 1
  console.log('Rendering PDF 1: Panduan Fitur SiNilai SMKN 1 Tanjungpandan...');
  const page1 = await browser.newPage();
  const fileUrl1 = 'file:///' + htmlDoc1Path.replace(/\\/g, '/');
  await page1.goto(fileUrl1, { waitUntil: 'load', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1000));
  const pdf1Path = path.join(ROOT_DIR, 'Panduan_Fitur_SiNilai_SMKN1_Tanjungpandan.pdf');
  await page1.pdf({
    path: pdf1Path,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
  });
  console.log(`PDF 1 created at: ${pdf1Path}`);
  await page1.close();

  // Print PDF 2
  console.log('Rendering PDF 2: Panduan Menjalankan Server SiNilai...');
  const page2 = await browser.newPage();
  const fileUrl2 = 'file:///' + htmlDoc2Path.replace(/\\/g, '/');
  await page2.goto(fileUrl2, { waitUntil: 'load', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1000));
  const pdf2Path = path.join(ROOT_DIR, 'Panduan_Menjalankan_Server_SiNilai.pdf');
  await page2.pdf({
    path: pdf2Path,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
  });
  console.log(`PDF 2 created at: ${pdf2Path}`);
  await page2.close();

  await browser.close();
  console.log('ALL PDFS GENERATED SUCCESSFULLY!');
}

generatePDFs().catch((err) => {
  console.error('Error generating PDFs:', err);
  process.exit(1);
});
