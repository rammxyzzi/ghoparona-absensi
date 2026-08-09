// Memanggil supabase dari folder config
import { supabase } from '../config/supabase.js'; 

const ADMIN_PASSWORD = "admin123"; // Ganti password admin kamu di sini

document.addEventListener('DOMContentLoaded', () => {
    cekAdminSession();
});

function cekAdminSession() {
    if (localStorage.getItem('adminIsLoggedIn') === 'true') {
        document.getElementById('adminLoginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';

        loadAbsensiData();
        loadSiswaData();
        loadInfoData();
        loadMemoryData();
    } else {
        document.getElementById('adminLoginScreen').style.display = 'block';
        document.getElementById('adminDashboard').style.display = 'none';
    }
}

// LOGIN ADMIN
document.getElementById('formAdminLogin')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pass = document.getElementById('adminPass').value;
    if (pass === ADMIN_PASSWORD) {
        localStorage.setItem('adminIsLoggedIn', 'true');
        Swal.fire({ icon: 'success', title: 'Login Admin Berhasil', timer: 1000, showConfirmButton: false });
        cekAdminSession();
    } else {
        Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'Password Admin Salah!' });
    }
});

// LOGOUT ADMIN
document.getElementById('btnAdminLogout')?.addEventListener('click', () => {
    localStorage.removeItem('adminIsLoggedIn');
    location.reload();
});

// 1. LOAD RIWAYAT ABSENSI DENGAN FILTER
window.loadAbsensiData = async function() {
    const table = document.getElementById('listAbsensiTable');
    const filterValue = document.getElementById('filterAbsenAdmin')?.value || 'semua';
    
    table.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8;">Memuat data absensi...</td></tr>`;

    let query = supabase.from('absensi').select('*').order('id', { ascending: false });
    const { data, error } = await query;

    if (error) {
        table.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #ef4444;">Gagal memuat data.</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        table.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b;">Belum ada riwayat absensi.</td></tr>`;
        return;
    }

    // Logika Filter Berdasarkan Waktu
    const now = new Date();
    const filteredData = data.filter(item => {
        const itemDate = new Date(item.waktu);
        
        if (filterValue === 'hari_ini') {
            return itemDate.toDateString() === now.toDateString();
        } 
        else if (filterValue === 'kemarin') {
            const yesterday = new Date();
            yesterday.setDate(now.getDate() - 1);
            return itemDate.toDateString() === yesterday.toDateString();
        } 
        else if (filterValue === 'bulan_ini') {
            return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        } 
        else if (filterValue === 'bulan_kemarin') {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return itemDate.getMonth() === lastMonth.getMonth() && itemDate.getFullYear() === lastMonth.getFullYear();
        }
        
        return true; // 'semua'
    });

    if (filteredData.length > 0) {
        table.innerHTML = filteredData.map(item => `
            <tr>
                <td>${new Date(item.waktu).toLocaleString('id-ID')}</td>
                <td><b>${item.nama}</b></td>
                <td>${item.kelas}</td>
                <td>
                    ${item.foto_url && item.foto_url !== '-' ? 
                        `<a href="${item.foto_url}" target="_blank" style="color: #38bdf8; text-decoration: none;"><i class="fa-solid fa-image"></i> Lihat Foto</a>` 
                        : '<span style="color:#64748b;">Tidak Ada</span>'}
                </td>
            </tr>
        `).join('');
    } else {
        table.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b;">Tidak ada data absensi untuk filter ini.</td></tr>`;
    }
}
// 2. KELOLA MASTER SISWA
async function loadSiswaData() {
    const table = document.getElementById('listSiswaTable');
    const { data } = await supabase.from('master_siswa').select('*').order('id', { ascending: false });

    if (data && data.length > 0) {
        table.innerHTML = data.map(siswa => `
            <tr>
                <td><b>${siswa.nama}</b></td>
                <td>${siswa.kelas}</td>
                <td><code>${siswa.username}</code></td>
                <td><code>${siswa.password}</code></td>
                <td>
                    <button class="btn-danger" onclick="hapusSiswa(${siswa.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } else {
        table.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b;">Belum ada siswa terdaftar.</td></tr>`;
    }
}

// GANTI BAGIAN INI DI admin.js
document.getElementById('formTambahSiswa')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nama = document.getElementById('addNama').value.trim();
    const kelas = document.getElementById('addKelas').value.trim();
    const username = document.getElementById('addUsername').value.trim().toLowerCase();
    const password = document.getElementById('addPassword').value.trim();
    
    // Tambahan baris untuk mengambil role
    const role = document.getElementById('addRole').value; 

    // Masukkan 'role' ke dalam proses insert
    const { error } = await supabase.from('master_siswa').insert([{ nama, kelas, username, password, role }]);
    
    if (error) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: error.message });
    } else {
        Swal.fire({ icon: 'success', title: 'Akun Ditambahkan', timer: 1000, showConfirmButton: false });
        document.getElementById('formTambahSiswa').reset();
        loadSiswaData();
    }
});

window.hapusSiswa = async function(id) {
    if (confirm('Yakin ingin menghapus akun siswa ini?')) {
        await supabase.from('master_siswa').delete().eq('id', id);
        loadSiswaData();
    }
}

// 3. KELOLA INFORMASI SEKOLAH
async function loadInfoData() {
    const list = document.getElementById('adminInfoList');
    const { data } = await supabase.from('informasi_sekolah').select('*').order('id', { ascending: false });

    if (data && data.length > 0) {
        list.innerHTML = data.map(info => `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 12px; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div style="font-weight: 700; font-size: 14px; color: #38bdf8;">${info.judul}</div>
                    <p style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${info.isi}</p>
                </div>
                <button class="btn-danger" onclick="hapusInfo(${info.id})" style="margin-left: 10px;"><i class="fa-solid fa-trash"></i></button>
            </div>
        `).join('');
    } else {
        list.innerHTML = `<p style="font-size: 12px; color: #64748b;">Belum ada informasi sekolah.</p>`;
    }
}

document.getElementById('formTambahInfo')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const judul = document.getElementById('addInfoJudul').value.trim();
    const isi = document.getElementById('addInfoIsi').value.trim();

    const { error } = await supabase.from('informasi_sekolah').insert([{ judul, isi }]);
    if (error) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: error.message });
    } else {
        Swal.fire({ icon: 'success', title: 'Informasi Dipublikasikan', timer: 1000, showConfirmButton: false });
        document.getElementById('formTambahInfo').reset();
        loadInfoData();
    }
});

window.hapusInfo = async function(id) {
    if (confirm('Hapus pengumuman informasi ini?')) {
        await supabase.from('informasi_sekolah').delete().eq('id', id);
        loadInfoData();
    }
}

// 4. KELOLA MEMORY SEKOLAH
async function loadMemoryData() {
    const grid = document.getElementById('adminMemoryGrid');
    const { data } = await supabase.from('memory_sekolah').select('*').order('id', { ascending: false });

    if (data && data.length > 0) {
        grid.innerHTML = data.map(mem => `
            <div class="admin-memory-item">
                <img src="${mem.foto_url}" alt="Memory">
                <div class="admin-memory-info">
                    <div style="font-weight: 700; font-size: 12px;">${mem.judul}</div>
                    <p style="font-size: 10px; color: #94a3b8; margin-top: 2px;">${mem.deskripsi || ''}</p>
                    <button class="btn-danger" onclick="hapusMemory(${mem.id})" style="width: 100%; margin-top: 8px;"><i class="fa-solid fa-trash"></i> Hapus</button>
                </div>
            </div>
        `).join('');
    } else {
        grid.innerHTML = `<p style="font-size: 12px; color: #64748b; grid-column: 1 / -1;">Belum ada galeri memory.</p>`;
    }
}

document.getElementById('formTambahMemory')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const judul = document.getElementById('addMemJudul').value.trim();
    const foto_url = document.getElementById('addMemFotoUrl').value.trim();
    const deskripsi = document.getElementById('addMemDeskripsi').value.trim();

    const { error } = await supabase.from('memory_sekolah').insert([{ judul, foto_url, deskripsi }]);
    if (error) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: error.message });
    } else {
        Swal.fire({ icon: 'success', title: 'Memory Ditambahkan', timer: 1000, showConfirmButton: false });
        document.getElementById('formTambahMemory').reset();
        loadMemoryData();
    }
});

window.hapusMemory = async function(id) {
    if (confirm('Hapus foto memory ini?')) {
        await supabase.from('memory_sekolah').delete().eq('id', id);
        loadMemoryData();
    }
}

// 5. KIRIM NOTIFIKASI REALTIME KE HP SISWA
document.getElementById('formKirimNotifHp')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const judul = document.getElementById('notifAdminJudul').value.trim();
    const pesan = document.getElementById('notifAdminPesan').value.trim();
    const btn = document.getElementById('btnBroadcastHp');

    btn.innerText = "Mengirim...";
    btn.disabled = true;

    const { error } = await supabase.from('notif_hp').insert([{ judul, pesan }]);

    if (error) {
        Swal.fire({ icon: 'error', title: 'Gagal Mengirim', text: error.message });
    } else {
        Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Notifikasi berhasil dikirim ke HP seluruh siswa.', timer: 1500, showConfirmButton: false });
        document.getElementById('formKirimNotifHp').reset();
    }

    btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Kirim Notifikasi Sekarang`;
    btn.disabled = false;
});
// FUNGSI CETAK LAPORAN WORD & KIRIM NOTIFIKASI WA
window.cetakLaporanWord = async function() {
    const WASENDER_API_KEY = '50021fcdb8bb9825a200cbda9a944ea6bbcf4c5454e7512cf12cff23ddc9dd56';
    
    // 1. Cek Sesi dan Role User (Admin / Wali Kelas)
    const isAdmin = localStorage.getItem('adminIsLoggedIn') === 'true';
    const siswaSession = JSON.parse(localStorage.getItem('siswaSession') || '{}');
    const isWaliKelas = siswaSession && siswaSession.role === 'walikelas';

    let targetKelas = null;
    let roleName = "Admin";

    if (isAdmin) {
        roleName = "Admin Panel";
    } else if (isWaliKelas) {
        targetKelas = siswaSession.kelas;
        roleName = `Wali Kelas (${targetKelas})`;
    } else {
        Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'Anda tidak memiliki hak akses untuk mencetak laporan!' });
        return;
    }

    Swal.fire({
        title: 'Memproses Laporan...',
        text: 'Mengambil data dari database...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        // 2. Query Data Absensi dari Supabase
        let query = supabase.from('absensi').select('*').order('id', { ascending: false });
        
        // Filter spesifik kelas jika yang mencetak adalah Wali Kelas
        if (targetKelas) {
            query = query.eq('kelas', targetKelas);
        }

        const { data, error } = await query;

        if (error) throw error;
        if (!data || data.length === 0) {
            Swal.fire({ icon: 'info', title: 'Data Kosong', text: 'Tidak ada data absensi untuk dicetak.' });
            return;
        }

        // 3. Generasi Struktur Dokumen Microsoft Word (.doc)
        const tanggalCetak = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        
        let tableRows = data.map((item, index) => `
            <tr>
                <td style="padding: 8px; text-align: center; border: 1px solid #000;">${index + 1}</td>
                <td style="padding: 8px; border: 1px solid #000;">${new Date(item.waktu).toLocaleString('id-ID')}</td>
                <td style="padding: 8px; border: 1px solid #000;"><b>${item.nama}</b></td>
                <td style="padding: 8px; text-align: center; border: 1px solid #000;">${item.kelas}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #000;">${item.status || 'Hadir'}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #000;">${item.keterangan || 'Tepat Waktu'}</td>
            </tr>
        `).join('');

        let htmlDoc = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Laporan Absensi Siswa</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th { background-color: #f2f2f2; padding: 10px; border: 1px solid #000; text-align: center; }
                    h2, h4 { text-align: center; margin: 5px 0; }
                </style>
            </head>
            <body>
                <h2>LAPORAN REKAP ABSENSI SISWA</h2>
                <h4>${targetKelas ? 'KELAS: ' + targetKelas : 'SEMUA KELAS'}</h4>
                <p style="text-align: right; font-size: 12px;">Dicetak pada: ${tanggalCetak}</p>
                <table>
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Waktu & Tanggal</th>
                            <th>Nama Siswa</th>
                            <th>Kelas</th>
                            <th>Status</th>
                            <th>Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        // 4. Proses Auto-Download File Word
        const blob = new Blob(['\ufeff', htmlDoc], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const fileName = `Laporan_Absensi_${targetKelas ? targetKelas.replace(/\s+/g, '_') : 'Semua'}_${Date.now()}.doc`;
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // 5. Kirim Notifikasi Cetak ke WhatsApp Menggunakan WASender API
        const daftarGrupKelas = {
            "XII C++": "120363112233445566@g.us",
            "X RPL 1": "120363998877665544@g.us",
            "XI TKJ 2": "120363223344556677@g.us"
        };
        const nomorAdminCadangan = '6283872851796';

        const targetWA = targetKelas ? (daftarGrupKelas[targetKelas] || nomorAdminCadangan) : nomorAdminCadangan;

        const pesanWA = 
            `*📑 LAPORAN ABSENSI BERHASIL DICETAK*\n\n` +
            `👤 Dicetak Oleh: *${roleName}*\n` +
            `🏫 Target Kelas: *${targetKelas || 'Semua Kelas'}*\n` +
            `📊 Total Rekap: *${data.length} Record Absensi*\n` +
            `📅 Tanggal Cetak: ${tanggalCetak}\n\n` +
            `_File Word (.doc) telah dikirim dan terunduh otomatis dari panel admin._`;

        await fetch('https://www.wasenderapi.com/api/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WASENDER_API_KEY}`
            },
            body: JSON.stringify({
                to: targetWA,
                text: pesanWA
            })
        }).catch(err => console.error('Wasender API Error:', err));

        Swal.fire({
            icon: 'success',
            title: 'Berhasil Cetak & Kirim WA!',
            text: `File Word telah diunduh dan notifikasi berhasil dikirim via WhatsApp.`
        });

    } catch (err) {
        console.error("Gagal mencetak laporan:", err);
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    }
};
// SWITCH TAB MENU ADMIN
window.switchAdminTab = function(tabName, el) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById('tab' + tabName).classList.add('active');
    if (el) el.classList.add('active');
}
