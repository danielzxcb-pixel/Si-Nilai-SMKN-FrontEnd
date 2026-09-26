const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Helper login function
  async function loginAs(email, password) {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await sleep(800);

    // If already logged in, clear session
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.removeItem('sinilai_jwt_token');
    });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await sleep(800);

    // Fill form
    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
      await inputs[0].click({ clickCount: 3 });
      await inputs[0].type(email);
      await inputs[1].click({ clickCount: 3 });
      await inputs[1].type(password);
      await sleep(300);

      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
      }
    }
    await sleep(1500);
  }

  // Helper click sidebar tab
  async function clickTab(tabId) {
    await page.evaluate((id) => {
      // Find button in sidebar with data-tab or clicking by text/attr
      const buttons = Array.from(document.querySelectorAll('aside button, nav button'));
      // Check if button or span inside matches or onclick calls setCurrentTab
      for (const btn of buttons) {
        const text = btn.innerText || '';
        if (id === 'admin-dashboard' && (text.includes('Ringkasan') || text.includes('Sekolah'))) { btn.click(); return; }
        if (id === 'guru-management' && (text.includes('Tugas Mengajar') || text.includes('Guru'))) { btn.click(); return; }
        if (id === 'kelola-kelas-mapel' && (text.includes('Data Kelas') || text.includes('Mapel'))) { btn.click(); return; }
        if (id === 'monitoring-rekap' && (text.includes('Rekap') || text.includes('Pantau'))) { btn.click(); return; }
        if (id === 'realtime-tracker' && (text.includes('Progres') || text.includes('Keterisian'))) { btn.click(); return; }
        if (id === 'input-nilai' && (text.includes('Input Nilai') || text.includes('Penilaian'))) { btn.click(); return; }
        if (id === 'pkl-assessment' && (text.includes('PKL') || text.includes('Magang'))) { btn.click(); return; }
        if (id === 'cetak-rapor' && (text.includes('Cetak Rapor') || text.includes('Verifikasi'))) { btn.click(); return; }
        if (id === 'audit-log' && (text.includes('Riwayat') || text.includes('Audit'))) { btn.click(); return; }
        if (id === 'import-data' && (text.includes('Impor') || text.includes('Dapodik'))) { btn.click(); return; }
        if (id === 'formula-settings' && (text.includes('Pengaturan Bobot') || text.includes('Bobot'))) { btn.click(); return; }
        if (id === 'site-content' && (text.includes('Pesan') || text.includes('Teks'))) { btn.click(); return; }
      }
    }, tabId);
    await sleep(1200);
  }

  console.log('Capturing Login Page...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.evaluate(() => { sessionStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '00_login_portal.png') });

  // 1. ADMIN
  console.log('Logging in as Admin...');
  await loginAs('admin@sinilai.sch.id', 'password123');

  console.log('Capturing Admin - Ringkasan Sekolah...');
  await clickTab('admin-dashboard');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_admin_ringkasan_sekolah.png') });

  console.log('Capturing Admin - Tugas Guru...');
  await clickTab('guru-management');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_admin_tugas_guru.png') });

  console.log('Capturing Admin - Kelas & Mapel...');
  await clickTab('kelola-kelas-mapel');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_admin_kelas_mapel.png') });

  console.log('Capturing Admin - Impor Dapodik...');
  await clickTab('import-data');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_admin_impor_dapodik.png') });

  console.log('Capturing Admin - Pengaturan Bobot Rapor...');
  await clickTab('formula-settings');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_admin_bobot_rapor.png') });

  console.log('Capturing Admin - Pesan Sekolah...');
  await clickTab('site-content');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_admin_pesan_sekolah.png') });

  // 2. GURU
  console.log('Logging in as Guru...');
  await loginAs('guru.rpl@sinilai.sch.id', 'password123');

  console.log('Capturing Guru - Input Nilai...');
  await clickTab('input-nilai');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_guru_input_nilai.png') });

  console.log('Capturing Guru - Nilai PKL...');
  await clickTab('pkl-assessment');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_guru_pkl_magang.png') });

  // 3. WAKA KURIKULUM
  console.log('Logging in as Waka...');
  await loginAs('wakes@sinilai.sch.id', 'password123');

  console.log('Capturing Waka - Rekap Nilai...');
  await clickTab('monitoring-rekap');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_waka_rekap_nilai.png') });

  console.log('Capturing Waka - Progres Nilai...');
  await clickTab('realtime-tracker');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10_waka_progres_live.png') });

  // 4. KEPALA SEKOLAH
  console.log('Logging in as Kepsek...');
  await loginAs('kepsek@sinilai.sch.id', 'password123');

  console.log('Capturing Kepsek - Cetak Rapor...');
  await clickTab('cetak-rapor');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '11_kepsek_cetak_rapor.png') });

  console.log('Capturing Kepsek - Riwayat Nilai...');
  await clickTab('audit-log');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '12_kepsek_riwayat_nilai.png') });

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
