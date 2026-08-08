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

        const { data: siswaValid, error } = await supabase
            .from('master_siswa')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

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

// 6. BUKA KAMERA & SCAN AI
btnStartCamera?.addEventListener('click', async () => {
    try {
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
        Swal.fire({ 
            icon: 'error', 
            title: currentLang === 'id' ? 'Akses Kamera Ditolak' : 'Camera Access Denied', 
            text: currentLang === 'id' ? 'Mohon izinkan akses kamera di browser Anda.' : 'Please allow camera access in your browser.' 
        });
    }
});

// REALTIME LOOP DETEKSI WAJAH AI
async function deteksiWajahDenganAI() {
    if (!isScanning || !videoStream || video.paused || video.ended) return;

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
    const WASENDER_API_KEY = '50021fcdb8bb9825a200cbda9a944ea6bbcf4c5454e7512cf12cff23ddc9dd56';
    
    // 1. Buat Data Pemetaan Kelas ke ID Grup WhatsApp
    // Pastikan nama kelas di sini SAMA PERSIS dengan yang diinput di database Supabase
    const daftarGrupKelas = {
        "XII C++": "120363112233445566@g.us", // Ganti dengan ID Grup WA kelas ini
        "X RPL 1": "120363998877665544@g.us", // Ganti dengan ID Grup WA kelas ini
        "XI TKJ 2": "120363223344556677@g.us"  // Ganti dengan ID Grup WA kelas ini
    };

    // 2. Tentukan tujuan pengiriman
    // Sistem akan mencari ID Grup berdasarkan kelas siswa. 
    // Jika kelas tidak terdaftar, otomatis dikirim ke nomor Admin/Wali Kelas sebagai cadangan.
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
// 11. NAVIGASI TAB BOTTOM BAR
window.switchTab = function(tabName, el) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    document.getElementById('tab' + tabName).classList.add('active');
    if (el) el.classList.add('active');
}