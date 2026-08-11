// Memanggil supabase dari folder config
import { supabase } from '../config/supabase.js';

let videoStream = null;
let isFaceModelLoaded = false;
let isScanning = false;
let currentLang = localStorage.getItem('appLang') || 'id'; // Default Indonesia

const translations = {
    id: {
        loginTitle: "Login - Account",
        loginDesc: "Masukkan Username dan Password akun kamu.",
        username: "Username",
        password: "Password",
        confirmBtn: "Konfirmasi &rarr;",
        hola: "Hola 👋",
        classTitle: "Kelas Anda",
        statusTitle: "Status Siswa",
        statusActive: "Aktif",
        schoolInfoTitle: "Informasi Sekolah",
        aiTitle: "Asisten AI Belajar",
        aiWelcome: "Halo 👋 Saya Asisten AI Sekolah! Ada yang bisa saya bantu terkait tugas atau materi pelajaran hari ini?",
        aiPlaceholder: "Tanya AI pelajaran/tugas...",
        absenHeader: "Absensi Digital AI",
        openCamera: "Buka Kamera",
        confirmAbsen: "Confirm Absen",
        memoryTitle: "Memory Sekolah",
        profileTitle: "Profil Saya",
        fullName: "Nama Lengkap",
        profileClass: "Kelas",
        logoutBtn: "Keluar Akun",
        navHome: "Beranda",
        navAi: "Tanya AI",
        navMemory: "Memory",
        navProfile: "Profil",
        camReady: "Kamera ready Klik 'Buka Kamera'."
    },
    en: {
        loginTitle: "Account Login",
        loginDesc: "Please enter your account username and password.",
        username: "Username",
        password: "Password",
        confirmBtn: "Confirm &rarr;",
        hola: "Hello 👋",
        classTitle: "Your Class",
        statusTitle: "Student Status",
        statusActive: "Active",
        schoolInfoTitle: "School Information",
        aiTitle: "AI Learning Assistant",
        aiWelcome: "Hello 👋 I am your School AI Assistant! Is there anything I can help with regarding today's tasks or lessons?",
        aiPlaceholder: "Ask AI about lessons/tasks...",
        absenHeader: "AI Digital Attendance",
        openCamera: "Open Camera",
        confirmAbsen: "Confirm Attendance",
        memoryTitle: "School Memories",
        profileTitle: "My Profile",
        fullName: "Full Name",
        profileClass: "Class",
        logoutBtn: "Log Out",
        navHome: "Home",
        navAi: "Ask AI",
        navMemory: "Memories",
        navProfile: "Profile",
        camReady: "Camera ready. Click 'Open Camera'."
    }
};

const video = document.getElementById('webcam');
const btnStartCamera = document.getElementById('btnStartCamera');
const btnTakeAbsen = document.getElementById('btnTakeAbsen');
const absenStatusText = document.getElementById('absenStatusText');

document.addEventListener('DOMContentLoaded', () => {
    applyLanguage();
    cekSessionLogin();
    loadAIModels();
});

// 1. GLOBAL SWITCH LANGUAGE FUNCTION
window.toggleLanguage = function() {
    currentLang = currentLang === 'id' ? 'en' : 'id';
    localStorage.setItem('appLang', currentLang);
    applyLanguage();
}

function applyLanguage() {
    const t = translations[currentLang];
    document.getElementById('langTextLogin').innerText = currentLang.toUpperCase();
    document.getElementById('langTextDash').innerText = currentLang.toUpperCase();

    document.getElementById('txtLoginTitle').innerText = t.loginTitle;
    document.getElementById('txtLoginDesc').innerText = t.loginDesc;
    document.getElementById('lblUsername').innerText = t.username;
    document.getElementById('lblPassword').innerText = t.password;
    document.getElementById('loginUsername').placeholder = currentLang === 'id' ? 'Input Username' : 'Enter Username';
    document.getElementById('loginPassword').placeholder = currentLang === 'id' ? 'Input Password' : 'Enter Password';
    document.getElementById('btnLoginSubmit').innerHTML = t.confirmBtn;

    document.getElementById('txtHola').innerText = t.hola;
    document.getElementById('txtClassTitle').innerText = t.classTitle;
    document.getElementById('txtStatusTitle').innerText = t.statusTitle;
    document.getElementById('txtStatusActive').innerText = t.statusActive;
    document.getElementById('txtSchoolInfoTitle').innerHTML = `<i class="fa-solid fa-bullhorn"></i> ${t.schoolInfoTitle}`;
    
    document.getElementById('txtAiTitle').innerHTML = `<i class="fa-solid fa-robot"></i> ${t.aiTitle}`;
    document.getElementById('txtAiWelcome').innerText = t.aiWelcome;
    document.getElementById('aiQuery').placeholder = t.aiPlaceholder;

    document.getElementById('txtAbsenHeader').innerHTML = `<i class="fa-solid fa-camera"></i> ${t.absenHeader}`;
    document.getElementById('btnStartCamera').innerHTML = `<i class="fa-solid fa-video"></i> ${t.openCamera}`;
    document.getElementById('btnTakeAbsen').innerHTML = `<i class="fa-solid fa-check-circle"></i> ${t.confirmAbsen}`;

    document.getElementById('txtMemoryTitle').innerHTML = `<i class="fa-solid fa-images"></i> ${t.memoryTitle}`;
    document.getElementById('txtProfileTitle').innerHTML = `<i class="fa-solid fa-id-card"></i> ${t.profileTitle}`;
    document.getElementById('lblFullName').innerText = t.fullName;
    document.getElementById('lblProfileClass').innerText = t.profileClass;
    document.getElementById('btnExit').innerText = t.logoutBtn;

    document.getElementById('navHome').innerText = t.navHome;
    document.getElementById('navAi').innerText = t.navAi;
    document.getElementById('navMemory').innerText = t.navMemory;
    document.getElementById('navProfile').innerText = t.navProfile;
}

// 2. PRELOAD AI FACE DETECTION
async function loadAIModels() {
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
        isFaceModelLoaded = true;
        if (absenStatusText) absenStatusText.innerText = translations[currentLang].camReady;
    } catch (err) {
        console.error("Gagal load Kamera:", err);
        isFaceModelLoaded = false;
        if (absenStatusText) absenStatusText.innerText = currentLang === 'id' ? "⚡ InfoManual: Klik 'Buka Kamera' lalu Kirim Absen." : "⚡ Manual: Click 'Open Camera' then Submit.";
    }
}
function cekSessionLogin() {
    const sessionData = localStorage.getItem('siswaSession');
    if (sessionData) {
        const session = JSON.parse(sessionData);
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboardScreen').style.display = 'block';

        document.getElementById('userName').innerText = session.nama;
        document.getElementById('userKelas').innerText = session.kelas;
        document.getElementById('userAvatar').innerText = session.nama.substring(0, 2).toUpperCase();

        document.getElementById('profileNama').value = session.nama;
        document.getElementById('profileKelas').value = session.kelas;

        // CEK ROLE: Jika dia walikelas, tampilkan menu tambahan
        if (session.role === 'walikelas') {
            document.getElementById('navItemWali').style.display = 'flex';
            document.getElementById('lblWaliKelas').innerText = session.kelas;
            // Ubah teks status di beranda
            document.getElementById('txtStatusTitle').innerText = "Status Akun";
            document.getElementById('txtStatusActive').innerText = "Wali Kelas";
            document.getElementById('txtStatusActive').style.color = "#38bdf8";
            
            // Panggil fungsi tarik data absen
            loadRekapWaliKelas();
        }

        loadInfoSekolah();
        loadMemorySekolah();
    } else {
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('dashboardScreen').style.display = 'none';
    }
}
// 4. PROSES LOGIN
const formLogin = document.getElementById('formLogin');
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value.trim();

        const { data, error } = await supabase
            .from('master_siswa')
            .update({ no_wa: tempNoWa })
            .eq('id', siswaSession.id);
            
        if (error || !siswaValid) {
            Swal.fire({ 
                icon: 'error', 
                title: currentLang === 'id' ? 'Login Gagal!' : 'Login Failed!', 
                text: currentLang === 'id' ? 'Username atau Password salah.' : 'Incorrect username or password.' 
            });
        } else {
            localStorage.setItem('siswaSession', JSON.stringify(siswaValid));
            Swal.fire({ icon: 'success', title: currentLang === 'id' ? 'Login Berhasil!' : 'Login Successful!', timer: 1200, showConfirmButton: false });
            cekSessionLogin();
        }
    });
}

// 5. LOGOUT
function logout() {
    localStorage.removeItem('siswaSession');
    location.reload();
}
document.getElementById('btnLogout')?.addEventListener('click', logout);
document.getElementById('btnExit')?.addEventListener('click', logout);

/// 6. BUKA KAMERA & SCAN AI
/// 6. BUKA KAMERA & SCAN AI
btnStartCamera?.addEventListener('click', async () => {
    try {
        // --- 0. CEK LOKASI (GEOFENCING) TERLEBIH DAHULU ---
        Swal.fire({
            title: currentLang === 'id' ? 'Mengecek Lokasi...' : 'Checking Location...',
            text: currentLang === 'id' ? 'Memastikan kamu berada di area sekolah.' : 'Verifying you are in the school area.',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        let lokasiSiswa;
        try {
            lokasiSiswa = await DapatkanLokasiSiswa();
        } catch (locErr) {
            Swal.fire({
                icon: 'error',
                title: currentLang === 'id' ? 'Lokasi Tidak Aktif' : 'Location Disabled',
                text: currentLang === 'id' ? 'Mohon izinkan akses lokasi (GPS) di browser kamu untuk absen.' : 'Please allow location (GPS) access in your browser.'
            });
            return; // Berhenti di sini, kamera tidak dibuka
        }

        const jarak = HitungJarakMeters(lokasiSiswa.lat, lokasiSiswa.lng, LOKASI_SEKOLAH.lat, LOKASI_SEKOLAH.lng);

        if (jarak > MAX_RADIUS_METER) {
            Swal.fire({
                icon: 'error',
                title: currentLang === 'id' ? 'Di Luar Area Sekolah' : 'Out of School Area',
                text: currentLang === 'id' 
                    ? `Kamu berada ${Math.round(jarak)} meter dari titik sekolah. Jarak maksimal untuk absen adalah ${MAX_RADIUS_METER} meter.` 
                    : `You are ${Math.round(jarak)} meters away from school. Max radius is ${MAX_RADIUS_METER} meters.`
            });
            return; // Berhenti di sini, kamera tidak dibuka
        }

        // --- 1. LOKASI AMAN, LANJUT BUKA KAMERA ---
        Swal.fire({
            title: currentLang === 'id' ? 'Membuka Kamera...' : 'Opening Camera...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            throw new Error("BROWSER_UNSUPPORTED");
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');

        if (!hasCamera) {
            Swal.fire({
                icon: 'warning',
                title: currentLang === 'id' ? 'Kamera Tidak Ditemukan' : 'No Camera Found',
                text: currentLang === 'id' 
                    ? 'Perangkat ini tidak memiliki kamera/webcam. Gunakan HP atau sambungkan kamera ke PC.' 
                    : 'No webcam detected on this device. Please use a mobile phone or connect a camera.'
            });
            return;
        }

        // 2. Minta akses kamera
        videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: "user",
                width: { ideal: 480 },
                height: { ideal: 360 }
            } 
        });
        video.srcObject = videoStream;
        
        video.onloadedmetadata = () => {
            video.play();
            Swal.close(); // Tutup loading SweetAlert
            btnStartCamera.style.display = 'none';
            btnTakeAbsen.style.display = 'block';

            if (isFaceModelLoaded) {
                isScanning = true;
                absenStatusText.innerText = currentLang === 'id' ? "🔍 AI Memindai Wajah... Posisikan Wajah ke Kamera" : "🔍 AI Scanning Face... Position your face to camera";
                deteksiWajahDenganAI();
            } else {
                absenStatusText.innerHTML = `<span style="color: #4ade80;">${currentLang === 'id' ? 'Posisikan wajah dengan jelas lalu tekan Kirim.' : 'Position your face clearly then submit.'}</span>`;
                btnTakeAbsen.disabled = false;
            }
        };

    } catch (err) {
        console.warn("Camera Error:", err);
        Swal.close(); // Tutup loading jika error
        
        let errorMsg = currentLang === 'id' ? 'Mohon izinkan akses kamera di browser Anda.' : 'Please allow camera access in your browser.';
        
        if (err.message === "BROWSER_UNSUPPORTED") {
            errorMsg = currentLang === 'id' ? 'Browser Anda tidak mendukung akses kamera.' : 'Your browser does not support camera access.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            errorMsg = currentLang === 'id' ? 'Perangkat kamera tidak ditemukan.' : 'Camera device not found.';
        }

        Swal.fire({ 
            icon: 'error', 
            title: currentLang === 'id' ? 'Akses Kamera Gagal' : 'Camera Access Failed', 
            text: errorMsg 
        });
    }
});

// REALTIME LOOP DETEKSI WAJAH AI
async function deteksiWajahDenganAI() {
    // Validasi tambahan agar tidak melempar error saat video belum siap/kosong
    if (!isScanning || !videoStream || video.paused || video.ended || video.readyState < 2) return;

    try {
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 });
        const detections = await faceapi.detectAllFaces(video, options);

        if (detections && detections.length > 0) {
            absenStatusText.innerHTML = `<span style="color: #4ade80; font-weight: bold;">${currentLang === 'id' ? '✅ WAJAH TERDETEKSI! SILAKAN KIRIM' : '✅ FACE DETECTED! PLEASE SUBMIT'}</span>`;
            btnTakeAbsen.disabled = false;
        } else {
            absenStatusText.innerHTML = `<span style="color: #f59e0b;">${currentLang === 'id' ? '⏳ Memindai Wajah... Dekatkan Wajah ke Kamera' : '⏳ Scanning Face... Move closer to camera'}</span>`;
            btnTakeAbsen.disabled = true;
        }
    } catch (e) {
        console.warn("Face API scan bypass:", e);
        // Jika pemindaian AI gagal/WebGL error, izinkan tombol absen tetap bisa diklik
        btnTakeAbsen.disabled = false;
    }

    if (isScanning) {
        setTimeout(deteksiWajahDenganAI, 300);
    }
}

// 7. PROSES ABSEN & UPLOAD FOTO
btnTakeAbsen?.addEventListener('click', async () => {
    isScanning = false;
    const sessionData = localStorage.getItem('siswaSession');
    if (!sessionData) return;
    const siswa = JSON.parse(sessionData);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));

    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }

    absenStatusText.innerText = currentLang === 'id' ? "⏳ Menyimpan data & mengunggah foto..." : "⏳ Saving data & uploading photo...";

    const fileName = `absen_${siswa.nama.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
    let fotoUrl = '-';

    const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('foto-absen')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

    if (!uploadError) {
        const { data: publicUrlData } = supabase
            .storage
            .from('foto-absen')
            .getPublicUrl(fileName);
        fotoUrl = publicUrlData.publicUrl;
    }

    const waktuSekarang = new Date();
    const tanggalFormatted = waktuSekarang.toLocaleDateString('id-ID', { 
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    });
    const jamFormatted = waktuSekarang.toLocaleTimeString('id-ID', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });

    await supabase.from('absensi').insert([{
        nama: siswa.nama,
        kelas: siswa.kelas,
        tanggal: tanggalFormatted,
        waktu: waktuSekarang.toISOString(),
        status: 'Hadir (Verified AI)',
        keterangan: 'Tepat Waktu',
        foto_url: fotoUrl
    }]);

    const { count: totalHadir } = await supabase
        .from('absensi')
        .select('*', { count: 'exact', head: true })
        .eq('nama', siswa.nama);

    // WASENDER API
    const WASENDER_API_KEY = '46e8ca763fb05f8ed7008667fba6c1cb6419f9f76a92f3201d29d66e98b94a22';
    
    // Gunakan ID Grup (@g.us) atau Nomor WA Pribadi (format 628xxx)
    const daftarGrupKelas = {
        "XII C++": "6283872851796", 
        "X RPL 1": "", 
        "XI TKJ 2": ""  
    };

    const nomorAdminCadangan = '6283872851796';
    const targetTujuan = daftarGrupKelas[siswa.kelas] || nomorAdminCadangan;

    const pesanWA = 
        `*📌 ABSENSI SISWA*\n\n` +
        `👤 Nama: *${siswa.nama}*\n` +
        `🏫 Kelas: *${siswa.kelas}*\n` +
        `📅 Tanggal: ${tanggalFormatted}\n` +
        `⏰ Jam: ${jamFormatted} WIB\n` +
        `📊 Total Hadir: *${totalHadir || 1} Kali*\n\n` +
        `_Status: Hadir Terverifikasi AI System_`;

    async function kirimKeWhatsApp() {
        let payloadData = { 
            to: targetTujuan, 
            text: pesanWA 
        };
        
        if (fotoUrl && fotoUrl !== '-') payloadData.imageUrl = fotoUrl;

        try {
            let response = await fetch('https://www.wasenderapi.com/api/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${WASENDER_API_KEY}`
                },
                body: JSON.stringify(payloadData)
            });
            let result = await response.json();
            
            // Jika gagal kirim gambar, coba kirim teks saja
            if (!result.success && payloadData.imageUrl) {
                delete payloadData.imageUrl;
                await fetch('https://www.wasenderapi.com/api/send-message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${WASENDER_API_KEY}`
                    },
                    body: JSON.stringify(payloadData)
                });
            }
        } catch (e) {
            console.error('Wasender Error:', e);
        }
    }

    kirimKeWhatsApp();

    Swal.fire({ 
        icon: 'success', 
        title: currentLang === 'id' ? 'Absen Berhasil!' : 'Attendance Successful!', 
        html: `<b>${siswa.nama}</b> (${siswa.kelas})<br>${currentLang === 'id' ? 'Total Kehadiran' : 'Total Attendance'}: <b>${totalHadir || 1}x</b>`
    });

    btnStartCamera.style.display = 'block';
    btnTakeAbsen.style.display = 'none';
    absenStatusText.innerText = currentLang === 'id' ? "Absen selesai untuk hari ini." : "Attendance completed for today.";
});

// 8. FITUR AI CHATBOT INTERAKTIF
const formAiChat = document.getElementById('formAiChat');
const chatContainer = document.getElementById('chatContainer');

formAiChat?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const queryInput = document.getElementById('aiQuery');
    const prompt = queryInput.value.trim();
    if (!prompt) return;

    chatContainer.innerHTML += `<div class="chat-msg user">${prompt}</div>`;
    queryInput.value = '';
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const loadingId = 'load-' + Date.now();
    chatContainer.innerHTML += `<div class="chat-msg bot" id="${loadingId}">⏳ ${currentLang === 'id' ? 'AI sedang berpikir...' : 'AI is thinking...'}</div>`;
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(prompt)}&format=json&no_html=1`);
        const data = await response.json();

        let reply = data.AbstractText || data.Definition;
        if (!reply) {
            reply = currentLang === 'id' 
                ? `Terima kasih atas pertanyaanmu tentang **"${prompt}"**! Jangan lupa tanyakan juga ke guru pengampu mata pelajaran terkait ya 👍`
                : `Thanks for asking about **"${prompt}"**! Don't forget to also consult your subject teacher 👍`;
        }

        document.getElementById(loadingId).innerText = reply;
    } catch (err) {
        document.getElementById(loadingId).innerText = currentLang === 'id' ? "Maaf, AI sedang berhalangan menjawab. Coba tanyakan hal lain!" : "Sorry, AI is currently unavailable. Try another question!";
    }
    chatContainer.scrollTop = chatContainer.scrollHeight;
});

// 9. LOAD INFORMASI SEKOLAH
async function loadInfoSekolah() {
    const list = document.getElementById('infoSekolahList');
    const { data } = await supabase.from('informasi_sekolah').select('*').order('id', { ascending: false });

    if (data && data.length > 0) {
        list.innerHTML = data.map(info => `
            <div class="card" style="margin-bottom: 10px; padding: 14px;">
                <div style="font-size: 11px; color: #38bdf8; margin-bottom: 2px;">${new Date(info.created_at).toLocaleDateString('id-ID')}</div>
                <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${info.judul}</div>
                <p style="font-size: 12px; color: #94a3b8;">${info.isi}</p>
            </div>
        `).join('');
    } else {
        list.innerHTML = `<p style="font-size: 12px; color: #64748b;">${currentLang === 'id' ? 'Belum ada informasi terbaru.' : 'No recent information.'}</p>`;
    }
}

// 10. LOAD MEMORY SEKOLAH
async function loadMemorySekolah() {
    const list = document.getElementById('memorySekolahList');
    const { data } = await supabase.from('memory_sekolah').select('*').order('id', { ascending: false });

    if (data && data.length > 0) {
        list.innerHTML = data.map(mem => `
            <div class="memory-card">
                <img src="${mem.foto_url || 'https://picsum.photos/300/200'}" alt="Memory">
                <div class="memory-body">
                    <div style="font-weight: 700; font-size: 12px;">${mem.judul}</div>
                    <p style="font-size: 10px; color: #94a3b8; margin-top: 2px;">${mem.deskripsi || ''}</p>
                </div>
            </div>
        `).join('');
    } else {
        list.innerHTML = `<p style="font-size: 12px; color: #64748b; grid-column: span 2;">${currentLang === 'id' ? 'Belum ada galeri memory.' : 'No memories gallery yet.'}</p>`;
    }
}
// FUNGSI KHUSUS UNTUK MENARIK DATA REKAP WALI KELAS
window.loadRekapWaliKelas = async function() {
    const sessionData = localStorage.getItem('siswaSession');
    if (!sessionData) return;
    const session = JSON.parse(sessionData);

    const tbody = document.getElementById('tabelAbsensiWali');
    tbody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: #94a3b8; padding: 10px;">Memuat data...</td></tr>`;

    // 1. Ambil semua siswa di kelas yang sama dengan Wali Kelas
    const { data: siswaKelas } = await supabase
        .from('master_siswa')
        .select('nama')
        .eq('kelas', session.kelas)
        .eq('role', 'siswa'); // Pastikan hanya menarik akun siswa

    if (!siswaKelas || siswaKelas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: #94a3b8; padding: 10px;">Belum ada siswa terdaftar di kelas ${session.kelas}.</td></tr>`;
        return;
    }

    // 2. Ambil data absensi HARI INI untuk kelas tersebut
    const waktuSekarang = new Date();
    const tanggalFormatted = waktuSekarang.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    const { data: absenHariIni } = await supabase
        .from('absensi')
        .select('nama, waktu')
        .eq('kelas', session.kelas)
        .eq('tanggal', tanggalFormatted);

    // 3. Mapping dan Cocokkan Data
    // Buat daftar nama siapa saja yang sudah absen hari ini
    const listSudahAbsen = absenHariIni ? absenHariIni.map(a => a.nama) : [];

    // Cetak ke dalam tabel HTML
    tbody.innerHTML = siswaKelas.map(s => {
        const statusAbsen = listSudahAbsen.includes(s.nama);
        return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px 0;"><b>${s.nama}</b></td>
                <td style="padding: 12px 0;">
                    ${statusAbsen 
                        ? '<span style="color: #4ade80; font-weight: bold;"><i class="fa-solid fa-check"></i> Hadir</span>' 
                        : '<span style="color: #ef4444; font-weight: bold;"><i class="fa-solid fa-xmark"></i> Belum Absen</span>'}
                </td>
            </tr>
        `;
    }).join('');
};
//cetakLaporanWord
// ==========================================
// INI INisialisasi PANEL WALI KELAS
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    // Ambil data sesi user dari localStorage
    const siswaSession = JSON.parse(localStorage.getItem('siswaSession') || '{}');

    // Cek jika user login sebagai Wali Kelas
    if (siswaSession && siswaSession.role === 'walikelas') {
        const panelWali = document.getElementById('panelWaliKelas');
        const labelKelas = document.getElementById('labelKelasWali');

        if (panelWali) panelWali.style.display = 'block';
        if (labelKelas) labelKelas.innerText = siswaSession.kelas || '-';

        // Muat data absensi siswa kelas tersebut
        await loadAbsensiWaliKelas(siswaSession.kelas);
    }
});
// CONTOH UNTUK ADMIN (Terapkan logika yang sama untuk loadAbsensiWaliKelas di user.js)
window.loadAbsensiData = async function() {
    const table = document.getElementById('listAbsensiTable');
    const filterTanggal = document.getElementById('filterAbsenAdmin')?.value; // Mendapatkan nilai YYYY-MM-DD
    
    table.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8;">Memuat data absensi...</td></tr>`;

    let query = supabase.from('absensi').select('*').order('id', { ascending: false });
    const { data, error } = await query;

    if (error || !data || data.length === 0) {
        table.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b;">Data tidak ditemukan.</td></tr>`;
        return;
    }

    // Logika Filter Berdasarkan Kalender
    const filteredData = data.filter(item => {
        if (!filterTanggal) return true; // Jika tidak ada tanggal yang dipilih kalender, tampilkan semua
        
        const itemDate = new Date(item.waktu);
        const selectedDate = new Date(filterTanggal);
        
        // Menyamakan format tanggal untuk dibandingkan
        return itemDate.toDateString() === selectedDate.toDateString();
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
        table.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b;">Tidak ada data absensi untuk tanggal ini.</td></tr>`;
    }
}
window.btnCetakWaliExcel = async function() {
    const WASENDER_API_KEY = '50021fcdb8bb9825a200cbda9a944ea6bbcf4c5454e7512cf12cff23ddc9dd56';
    
    const isAdmin = localStorage.getItem('adminIsLoggedIn') === 'true';
    const siswaSession = JSON.parse(localStorage.getItem('siswaSession') || '{}');
    const isWaliKelas = siswaSession && siswaSession.role === 'walikelas';

    let targetKelas = null;
    let roleName = isAdmin ? "Admin Panel" : (isWaliKelas ? `Wali Kelas (${siswaSession.kelas})` : null);

    if (!roleName) {
        Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'Anda tidak memiliki akses!' });
        return;
    }
    if (isWaliKelas) targetKelas = siswaSession.kelas;

    Swal.fire({ title: 'Memproses Excel...', text: 'Mengambil data...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    try {
        let query = supabase.from('absensi').select('*').order('id', { ascending: false });
        
        // Cek apakah ada filter tanggal yang sedang aktif
        const filterTanggalElement = document.getElementById(isAdmin ? 'filterAbsenAdmin' : 'filterAbsenWali');
        const filterTanggal = filterTanggalElement ? filterTanggalElement.value : null;

        if (targetKelas) query = query.eq('kelas', targetKelas);
        const { data, error } = await query;

        if (error) throw error;
        
        // Terapkan filter kalender untuk cetak jika tanggal dipilih
        let finalData = data;
        if (filterTanggal) {
            const selectedDate = new Date(filterTanggal);
            finalData = data.filter(item => new Date(item.waktu).toDateString() === selectedDate.toDateString());
        }

        if (!finalData || finalData.length === 0) {
            Swal.fire({ icon: 'info', title: 'Data Kosong', text: 'Tidak ada data untuk dicetak.' });
            return;
        }

        // GENERATE STRUKTUR EXCEL MENGGUNAKAN HTML MIME TYPE
        const tanggalCetak = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        
        let tableRows = finalData.map((item, index) => `
            <tr>
                <td style="border: 1px solid #000; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #000;">${new Date(item.waktu).toLocaleString('id-ID')}</td>
                <td style="border: 1px solid #000;">${item.nama}</td>
                <td style="border: 1px solid #000; text-align: center;">${item.kelas}</td>
                <td style="border: 1px solid #000; text-align: center;">${item.status || 'Hadir'}</td>
                <td style="border: 1px solid #000; text-align: center;">${item.keterangan || 'Tepat Waktu'}</td>
            </tr>
        `).join('');

        // Struktur standar agar dikenali MS Excel dengan baik
        let excelDoc = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8">
                <style> table { border-collapse: collapse; } th, td { font-family: Arial, sans-serif; } th { background-color: #d1d5db; font-weight: bold; border: 1px solid #000; } </style>
            </head>
            <body>
                <table>
                    <tr><td colspan="6" style="text-align: center; font-size: 16px; font-weight: bold;">LAPORAN REKAP ABSENSI SISWA</td></tr>
                    <tr><td colspan="6" style="text-align: center; font-size: 14px; font-weight: bold;">${targetKelas ? 'KELAS: ' + targetKelas : 'SEMUA KELAS'}</td></tr>
                    <tr><td colspan="6" style="text-align: right; font-size: 11px;">Dicetak pada: ${tanggalCetak}</td></tr>
                    <tr></tr>
                    <tr>
                        <th>No</th><th>Waktu & Tanggal</th><th>Nama Siswa</th><th>Kelas</th><th>Status</th><th>Keterangan</th>
                    </tr>
                    ${tableRows}
                </table>
            </body>
            </html>
        `;

        // Proses Auto-Download File .xls
        const blob = new Blob(['\ufeff', excelDoc], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // Penamaan file dinamis berdasarkan tanggal
        const namaFileTanggal = filterTanggal ? `_${filterTanggal}` : '';
        const fileName = `Laporan_Absensi_${targetKelas ? targetKelas.replace(/\s+/g, '_') : 'Semua'}${namaFileTanggal}.xls`;
        
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Notifikasi WA
        const daftarGrupKelas = { "XII C++": "120363112233445566@g.us", "X RPL 1": "120363998877665544@g.us", "XI TKJ 2": "120363223344556677@g.us" };
        const nomorAdminCadangan = '6283872851796';
        const targetWA = targetKelas ? (daftarGrupKelas[targetKelas] || nomorAdminCadangan) : nomorAdminCadangan;

        const pesanWA = 
            `*📊 LAPORAN ABSENSI (EXCEL) BERHASIL DICETAK*\n\n` +
            `👤 Dicetak Oleh: *${roleName}*\n` +
            `🏫 Target Kelas: *${targetKelas || 'Semua Kelas'}*\n` +
            `📅 Filter Tanggal: *${filterTanggal || 'Semua Waktu'}*\n` +
            `📝 Total Rekap: *${finalData.length} Record*\n` +
            `⏰ Tanggal Cetak: ${tanggalCetak}\n\n` +
            `_File Excel (.xls) telah diunduh otomatis ke perangkat._`;

        await fetch('https://www.wasenderapi.com/api/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${WASENDER_API_KEY}` },
            body: JSON.stringify({ to: targetWA, text: pesanWA })
        }).catch(err => console.error('Wasender Error:', err));

        Swal.fire({
            icon: 'success',
            title: 'Berhasil Cetak & Kirim WA!',
            text: `File Excel (.xls) telah diunduh dan notifikasi terkirim via WhatsApp.`
        });

    } catch (err) {
        console.error("Gagal mencetak Excel:", err);
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    }
};
// ==========================================
// PENGATURAN LOKASI SEKOLAH (GEOFENCING)
// ==========================================
const LOKASI_SEKOLAH = {
    lat: -6.292115,
    lng: 107.895190
};
const MAX_RADIUS_METER = 50; // Maksimal 30 meter dari titik sekolah

// Fungsi mengambil koordinat siswa saat ini
function DapatkanLokasiSiswa() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Browser tidak mendukung fitur lokasi."));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => resolve({ 
                lat: position.coords.latitude, 
                lng: position.coords.longitude 
            }),
            (error) => reject(new Error("Izin lokasi ditolak atau GPS tidak aktif.")),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
}

// Rumus menghitung jarak antara 2 koordinat (dalam meter)
function HitungJarakMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radius bumi dalam meter
    const rad = Math.PI / 180;
    const a = 
        Math.sin((lat2 - lat1) * rad / 2) ** 2 +
        Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
        Math.sin((lon2 - lon1) * rad / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
// Konfigurasi Global OTP
let generatedOTP = "";
let tempNoWa = "";
const WASENDER_API_KEY = '50021fcdb8bb9825a200cbda9a944ea6bbcf4c5454e7512cf12cff23ddc9dd56'; // Pastikan API key kamu benar

// Panggil fungsi ini saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    cekStatusWA();
});

// Fungsi untuk mengecek apakah siswa punya no_wa di session
function cekStatusWA() {
    const siswaSession = JSON.parse(localStorage.getItem('siswaSession') || '{}');
    
    // Jika tidak ada no_wa atau nilainya null/'-'
    if (!siswaSession.no_wa || siswaSession.no_wa === "-" || siswaSession.no_wa.trim() === "") {
        document.getElementById('waModal').style.display = 'flex';
    }
}

// Fungsi mengirim OTP via Bot Wasender
window.kirimOTP = async function() {
    const inputWa = document.getElementById('inputNoWa').value;
    
    // Validasi nomor Indonesia (harus pakai 62)
    if (!inputWa || inputWa.length < 10) {
        Swal.fire({ icon: 'warning', title: 'Oops', text: 'Masukkan nomor WA yang valid!' });
        return;
    }
    
    let formattedWa = inputWa.startsWith('0') ? '62' + inputWa.substring(1) : inputWa;
    tempNoWa = formattedWa;
    
    // Generate 4 digit OTP acak
    generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
    
    Swal.fire({ title: 'Mengirim OTP...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    const pesanOTP = `*KODE VERIFIKASI ABSENSI*\n\nHalo, ini adalah kode OTP kamu:\n*${generatedOTP}*\n\n_JANGAN BERIKAN KODE INI KEPADA SIAPAPUN. Kode ini digunakan untuk mendaftarkan nomor WA kamu di sistem presensi._`;

    try {
        const response = await fetch('https://www.wasenderapi.com/api/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${WASENDER_API_KEY}` },
            body: JSON.stringify({ to: tempNoWa, text: pesanOTP })
        });
        
        const result = await response.json();

        if (response.ok) {
            Swal.close();
            // Ganti tampilan ke input OTP
            document.getElementById('stepInputWa').style.display = 'none';
            document.getElementById('stepInputOTP').style.display = 'block';
        } else {
            throw new Error(result.message || 'Gagal mengirim pesan');
        }
    } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Gagal Kirim', text: 'Gagal mengirim OTP. Pastikan API bot aktif.' });
    }
}

// Fungsi memverifikasi kode yang diinput user
window.verifikasiOTP = async function() {
    const inputOTP = document.getElementById('inputOTP').value;
    
    if (inputOTP !== generatedOTP) {
        Swal.fire({ icon: 'error', title: 'Salah', text: 'Kode OTP tidak cocok! Silakan cek kembali WA kamu.' });
        return;
    }

    Swal.fire({ title: 'Menyimpan data...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    try {
        const siswaSession = JSON.parse(localStorage.getItem('siswaSession'));
        
        // UPDATE ke database Supabase (Asumsi nama tabel siswanya 'siswa', sesuaikan jika beda)
        const { data, error } = await supabase
            .from('siswa') 
            .update({ no_wa: tempNoWa })
            .eq('id', siswaSession.id); // Asumsi primary key adalah 'id'

        if (error) throw error;

        // Update local storage session
        siswaSession.no_wa = tempNoWa;
        localStorage.setItem('siswaSession', JSON.stringify(siswaSession));

        Swal.fire({ 
            icon: 'success', 
            title: 'Berhasil!', 
            text: 'Nomor WhatsApp berhasil dihubungkan.' 
        }).then(() => {
            // Tutup Modal
            document.getElementById('waModal').style.display = 'none';
        });

    } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Database Error', text: 'Gagal menyimpan ke database.' });
    }
}

// Fungsi kembali ke tahap awal jika salah masukin nomor
window.resetOTP = function() {
    generatedOTP = "";
    tempNoWa = "";
    document.getElementById('inputOTP').value = "";
    document.getElementById('stepInputOTP').style.display = 'none';
    document.getElementById('stepInputWa').style.display = 'block';
}
// ================= EFEK ANIMASI 3D & GLOW PADA LOGIN =================
document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('loginScreen');
    const loginCard = document.getElementById('loginCard');
    const ambientLight = document.getElementById('ambientLight');

    if (loginScreen && loginCard && ambientLight) {
        loginScreen.addEventListener('mousemove', (e) => {
            // Animasi hanya berjalan jika layar login sedang aktif/ditampilkan
            if (loginScreen.style.display !== 'none') {
                const rect = loginScreen.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Gerakkan glow mengikuti mouse
                ambientLight.style.left = `${x}px`;
                ambientLight.style.top = `${y}px`;

                // Kalkulasi rotasi kartu 3D
                const cardRect = loginCard.getBoundingClientRect();
                const cardCenterX = cardRect.left + cardRect.width / 2;
                const cardCenterY = cardRect.top + cardRect.height / 2;
                
                const moveX = (e.clientX - cardCenterX) / (cardRect.width / 2);
                const moveY = (e.clientY - cardCenterY) / (cardRect.height / 2);

                // Miringkan tipis maksimal 6 derajat
                loginCard.style.transform = `rotateX(${moveY * -6}deg) rotateY(${moveX * 6}deg)`;
            }
        });

        // Reset kemiringan kalau mouse keluar layar
        loginScreen.addEventListener('mouseleave', () => {
            loginCard.style.transform = 'rotateX(0deg) rotateY(0deg)';
        });
    }
});

// Fungsi Toggle Lihat Password
window.togglePassword = function() {
    const pwInput = document.getElementById('loginPassword');
    const eyeIcon = document.getElementById('eyeIcon');
    
    if (pwInput.type === 'password') {
        pwInput.type = 'text';
        eyeIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        pwInput.type = 'password';
        eyeIcon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}
// 11. NAVIGASI TAB BOTTOM BAR
window.switchTab = function(tabName, el) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    document.getElementById('tab' + tabName).classList.add('active');
    if (el) el.classList.add('active');
}
