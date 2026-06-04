lucide.createIcons();

// ── PRELOADER ──
window.addEventListener('load', async () => {
// ✅ FIX: avval session tekshiriladi — login bo'lsa /dashboard ga ketadi
// login bo'lmasa quyidagi kod ishlaydi
await checkUserSession();

// URL parametrlarini tekshirish
// /login redirect → /?modal=login keladi → modal avtomatik ochiladi
// Google OAuth xatosi → /?modal=login&error=... keladi → xato ko'rsatiladi
const urlParams = new URLSearchParams(window.location.search);
const modalParam = urlParams.get('modal');
const errorParam = urlParams.get('error');

if (modalParam === 'login') {
  // Modal ochish — faqat session YO'Q bo'lganda
  // checkUserSession() async ishlaydi, shuning uchun kichik delay qo'yamiz
  setTimeout(() => {
    // Agar redirect bo'lgan bo'lsa (login qilingan) — bu blok ishlaydi
    // lekin checkUserSession allaqachon /dashboard ga yuborgani uchun bu kodni o'tkazib yuboradi
    openModal('login');
    if (errorParam === 'oauth_failed') {
      showToast("Google orqali kirish muvaffaqiyatsiz bo'ldi. Qayta urinib ko'ring.", 'error');
    } else if (errorParam === 'email_not_verified') {
      showToast("Google emailingiz tasdiqlanmagan.", 'error');
    }
    // URL ni tozalash (back button da qayta ochilmasin)
    window.history.replaceState({}, document.title, '/');
  }, 500); // checkUserSession tugashini kutish uchun 500ms
}
});

// ── NAVBAR SCROLL ──

// ── MOUSE GLOW ──
document.addEventListener('mousemove', e => {
const g = document.getElementById('mouse-glow');
if (g) { g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; }
});

// ── MOBILE MENU ──
window.toggleMobileMenu = () => {
document.getElementById('mobile-menu').classList.toggle('open');
};

// ── COUNTER ANIMATION ──
function animateCounter(id, target, suffix='') {
const el = document.getElementById(id);
let current = 0;
const step = target / 80;
const iv = setInterval(() => {
  current = Math.min(current + step, target);
  el.textContent = Math.floor(current).toLocaleString() + suffix;
  if (current >= target) clearInterval(iv);
}, 20);
}

const counterObserver = new IntersectionObserver(entries => {
entries.forEach(e => {
  if (e.isIntersecting) {
    animateCounter('count-students', 50000, '+');
    animateCounter('count-courses', 200, '+');
    animateCounter('count-instructors', 45, '+');
    animateCounter('count-countries', 12, '+');
    counterObserver.disconnect();
  }
});
});
const statsSection = document.querySelector('#count-students');
if (statsSection) counterObserver.observe(statsSection);

// ── COURSES DATA ──
const coursesData = [
{ id:1, cat:'fashion', badge:'hot', badgeText:'MASHHUR', title:'Fashion Design Asoslari', instructor:'Nilufar Rashidova', rating:4.8, reviews:2341, price:'299,000', oldPrice:'499,000', duration:'42 soat', lessons:68, img:'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=600&auto=format&fit=crop', level:'Boshlang\'ich' },
{ id:2, cat:'pattern', badge:'new', badgeText:'YANGI', title:'Pattern Making Professional', instructor:'Bobur Xasanov', rating:4.9, reviews:1205, price:'349,000', oldPrice:'599,000', duration:'36 soat', lessons:54, img:'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop', level:'O\'rta' },
{ id:3, cat:'textile', badge:'sale', badgeText:'CHEGIRMA', title:'Textile Theory & Materials', instructor:'Zulfiya Karimova', rating:4.7, reviews:876, price:'199,000', oldPrice:'399,000', duration:'28 soat', lessons:42, img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop', level:'Boshlang\'ich' },
{ id:4, cat:'fashion', badge:'hot', badgeText:'MASHHUR', title:'Kiyim Kollekciyasi Yaratish', instructor:'Nilufar Rashidova', rating:4.8, reviews:543, price:'449,000', oldPrice:'699,000', duration:'58 soat', lessons:84, img:'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop', level:'Ilg\'or' },
{ id:5, cat:'fashion', badge:'new', badgeText:'YANGI', title:'Fashion Illustration Masterclass', instructor:'Diyora Yunusova', rating:4.6, reviews:321, price:'279,000', oldPrice:'449,000', duration:'24 soat', lessons:38, img:'https://images.unsplash.com/photo-1625899845678-3fad6a4a1846?w=600&auto=format&fit=crop', level:'O\'rta' },
{ id:6, cat:'pattern', badge:'', badgeText:'', title:'Draping Texnikasi', instructor:'Bobur Xasanov', rating:4.7, reviews:689, price:'319,000', oldPrice:'499,000', duration:'32 soat', lessons:48, img:'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop', level:'O\'rta' },
{ id:7, cat:'textile', badge:'sale', badgeText:'CHEGIRMA', title:'Rang va Tekstura Nazariyasi', instructor:'Zulfiya Karimova', rating:4.9, reviews:1102, price:'159,000', oldPrice:'299,000', duration:'18 soat', lessons:28, img:'https://images.unsplash.com/photo-1620503374956-c942862f0372?q=80&w=600&auto=format&fit=crop', level:'Boshlang\'ich' },
{ id:8, cat:'fashion', badge:'hot', badgeText:'MASHHUR', title:'Sustainable Fashion Design', instructor:'Alisher Toshmatov', rating:4.8, reviews:455, price:'389,000', oldPrice:'549,000', duration:'44 soat', lessons:62, img:'https://images.unsplash.com/photo-1523381294911-8d3cead13475?q=80&w=600&auto=format&fit=crop', level:'Ilg\'or' },
];

let activeFilter = 'all';
function renderCourses(filter) {
const grid = document.getElementById('courses-grid');
const filtered = filter === 'all' ? coursesData : coursesData.filter(c => c.cat === filter);
grid.innerHTML = filtered.map(c => `
  <div class="course-card" onclick="openModal('register')">
    <div style="overflow:hidden;position:relative;">
      <img src="${c.img}" class="course-img" alt="${c.title}">
      ${c.badge ? `<span class="course-badge badge-${c.badge}" style="position:absolute;top:12px;left:12px;">${c.badgeText}</span>` : ''}
      <span style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.7);font-size:10px;color:rgba(255,255,255,0.7);padding:3px 8px;border-radius:2px;">${c.level}</span>
    </div>
    <div style="padding:18px;">
      <h3 style="font-size:14px;font-weight:700;margin-bottom:4px;color:#fff;line-height:1.4;">${c.title}</h3>
      <p style="font-size:11px;color:#d4a84f;margin-bottom:8px;">${c.instructor}</p>
      <div class="flex items-center gap-1" style="margin-bottom:8px;">
        <span style="font-weight:700;font-size:12px;color:#f9e8ad;">${c.rating}</span>
        ${[1,2,3,4,5].map(i => `<i class="fas fa-star${c.rating < i ? '-half-alt' : ''} star-filled" style="font-size:10px;"></i>`).join('')}
        <span style="font-size:10px;color:#555;margin-left:2px;">(${c.reviews.toLocaleString()})</span>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:12px;">${c.lessons} dars · ${c.duration}</div>
      <div class="flex justify-between items-center">
        <div>
          <span style="font-weight:800;font-size:15px;color:#d4a84f;">${c.price} so'm</span>
          ${c.oldPrice ? `<span style="font-size:11px;color:#444;text-decoration:line-through;margin-left:6px;">${c.oldPrice}</span>` : ''}
        </div>
        <button style="width:32px;height:32px;border:1px solid rgba(212,168,79,0.25);background:transparent;color:#d4a84f;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;border-radius:2px;" onmouseenter="this.style.background='rgba(212,168,79,0.1)'" onmouseleave="this.style.background='transparent'">
          <i class="fas fa-cart-plus" style="font-size:12px;"></i>
        </button>
      </div>
    </div>
  </div>
`).join('');
}

window.filterCourses = (filter, btn) => {
activeFilter = filter;
document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
btn.classList.add('active');
renderCourses(filter);
};

renderCourses('all');

// ── AUTH MODAL ──
const authBox = document.getElementById('auth-box');
const modal = document.getElementById('login-modal');

// reCAPTCHA widget IDlarini kuzatish
let regWidgetId = null;
let loginWidgetId = null;

function initRecaptcha() {
if (typeof grecaptcha === 'undefined' || typeof grecaptcha.render !== 'function') {
  setTimeout(initRecaptcha, 300);
  return;
}
const regEl = document.getElementById('recaptcha-reg');
const loginEl = document.getElementById('recaptcha-login');
if (regEl && regEl.childElementCount === 0) {
  regWidgetId = grecaptcha.render(regEl, { sitekey: regEl.dataset.sitekey || '6LdP_0wsAAAAACAwMCxW1GdhT6NaTnW3vVmVqEak' });
}
if (loginEl && loginEl.childElementCount === 0) {
  loginWidgetId = grecaptcha.render(loginEl, { sitekey: loginEl.dataset.sitekey || '6LdP_0wsAAAAACAwMCxW1GdhT6NaTnW3vVmVqEak' });
}
}
// grecaptcha.ready bilan chaqirish
if (typeof grecaptcha !== 'undefined' && grecaptcha.ready) {
grecaptcha.ready(initRecaptcha);
} else {
window.onRecaptchaLoad = initRecaptcha;
setTimeout(initRecaptcha, 1500); // fallback
}
document.getElementById('register-toggle').addEventListener('click', () => authBox.classList.add('active'));
document.getElementById('login-toggle').addEventListener('click', () => authBox.classList.remove('active'));

window.toggleAuthPanel = () => authBox.classList.toggle('active');
window.openModal = (mode='login') => {
modal.classList.remove('hidden');
mode === 'register' ? authBox.classList.add('active') : authBox.classList.remove('active');
try {
  if (regWidgetId !== null) grecaptcha.reset(regWidgetId);
  if (loginWidgetId !== null) grecaptcha.reset(loginWidgetId);
} catch(e) {}
};
window.closeModal = () => {
modal.classList.add('hidden');
['login-email','login-password','reg-email','reg-password','reg-name'].forEach(id => {
  const el = document.getElementById(id); if(el) el.value = '';
});
};
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

// ── GOOGLE LOGIN ──
window.signInWithGoogle = () => { window.location.href = '/auth/google'; };

// ── REGISTER ──
window.handleRegister = async () => {
const email = document.getElementById('reg-email').value;
const password = document.getElementById('reg-password').value;
const username = document.getElementById('reg-name').value;
let token = '';
try { token = grecaptcha.getResponse(regWidgetId); } catch(e) {}
if (!token) { try { token = grecaptcha.getResponse(0); } catch(e) {} }
if (!token) { try { token = grecaptcha.getResponse(); } catch(e) {} }
if (!email || !password || !username) { showToast('Barcha maydonlarni to\'ldiring', 'error'); return; }
try {
  const res = await fetch('/api/auth/register', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ username, email, password, recaptcha_token: token })
  });
  const data = await res.json();
  if (res.ok) { showToast('Muvaffaqiyatli ro\'yxatdan o\'tdingiz! 🎉', 'success'); setTimeout(() => window.location.href = '/dashboard', 1200); }
  else {
    showToast(data.detail || 'Xatolik yuz berdi', 'error');
    try { grecaptcha.reset(regWidgetId); } catch(e) { try { grecaptcha.reset(0); } catch(e2) {} }
  }
} catch { showToast('Server xatosi', 'error'); }
};

// ── LOGIN ──
window.handleLogin = async () => {
const email = document.getElementById('login-email').value;
const password = document.getElementById('login-password').value;

// reCAPTCHA token olish — widget ID bo'yicha xavfsiz olish
let token = '';
try { token = grecaptcha.getResponse(loginWidgetId); } catch(e) {}
// Agar widget ID noto'g'ri bo'lsa, nol urinib ko'ramiz
if (!token) { try { token = grecaptcha.getResponse(0); } catch(e) {} }
if (!token) { try { token = grecaptcha.getResponse(); } catch(e) {} }

if (!email || !password) { showToast("Ma'lumotlarni to'ldiring", 'error'); return; }
try {
  // ✅ BUG #13 FIX: CSRF token olish
  const csrfRes = await fetch('/api/auth/csrf-token', { credentials: 'include' });
  const { csrf_token } = await csrfRes.json();

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf_token },
    credentials: 'include',
    body: JSON.stringify({ email, password, recaptcha_token: token })
  });
  const data = await res.json();
  if (res.ok) { showToast('Xush kelibsiz!', 'success'); setTimeout(() => window.location.href = '/dashboard', 800); }
  else {
    showToast(data.detail || 'Login xato', 'error');
    try { grecaptcha.reset(loginWidgetId); } catch(e) { try { grecaptcha.reset(0); } catch(e2) {} }
  }
} catch { showToast('Server xatosi', 'error'); }
};

// ── LOGOUT ──
window.handleLogout = async () => {
try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); }
finally { window.location.href = '/'; }
};

// ── SESSION CHECK ──
async function checkUserSession() {
const authBtns = document.getElementById('auth-buttons');
const profile = document.getElementById('user-profile');
try {
  const res = await fetch('/api/me', { credentials: 'include' });
  if (!res.ok) throw new Error();
  const user = await res.json();

  // ✅ FIX: Admin → /manage/courses, oddiy user → /dashboard
  const redirect = user.role === 'admin' ? '/manage/courses' : '/dashboard';
  window.location.replace(redirect);
  return;

} catch {
  // Login qilinmagan — normal index sahifani ko'rsatish
  authBtns.classList.remove('hidden');
  profile.classList.add('hidden'); profile.classList.remove('flex');
}
}

// ── FORGOT PASSWORD ──
window.toggleResetView = (show) => {
document.getElementById('login-content').style.display = show ? 'none' : 'flex';
document.getElementById('reset-content').style.display = show ? 'flex' : 'none';
};

window.handleForgotPassword = async () => {
const email = document.getElementById('reset-email-input').value;
if (!email) { showToast('Email kiriting', 'error'); return; }
showToast('Parolni tiklash havolasi yuborildi ✉️', 'success');
setTimeout(() => toggleResetView(false), 1500);
fetch('/api/auth/forgot-password', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email}) }).catch(() => {});
};

// ── PASSWORD HELPERS ──
window.togglePassword = (icon, id) => {
const inp = document.getElementById(id);
const isText = inp.type === 'text';
inp.type = isText ? 'password' : 'text';
icon.classList.toggle('fa-eye', isText);
icon.classList.toggle('fa-eye-slash', !isText);
};
window.analyzePassword = (pw) => {
const meter = document.getElementById('strength-meter');
const bars = [1,2,3,4].map(i => document.getElementById('bar-'+i));
const text = document.getElementById('strength-text');
if (!pw) { meter.style.display = 'none'; return; }
meter.style.display = 'block'; meter.style.opacity = '1';
let score = 0;
if (pw.length >= 8) score++; if (pw.length >= 12) score++;
if (/[A-Z]/.test(pw)) score++;
if (/[0-9]|[^A-Za-z0-9]/.test(pw)) score++;
bars.forEach(b => b.style.background = '#eee');
const colors = ['#ff4444','#ff4444','#ffbb33','#00C851'];
const labels = ['Juda kuchsiz','Kuchsiz','O\'rtacha','Kuchli 💪'];
for (let i = 0; i < score; i++) bars[i].style.background = colors[Math.min(score-1,3)];
text.textContent = labels[Math.min(score-1,3)] || '—';
text.style.color = colors[Math.min(score-1,3)];
};
window.checkCapsLock = (e) => {
const warn = document.getElementById('caps-warning');
warn.style.display = e.getModifierState?.('CapsLock') ? 'flex' : 'none';
};

// ── TOAST ──
window.showToast = (msg, type) => {
const c = document.getElementById('toast-container');
const t = document.createElement('div');
const color = type === 'success' ? '#00C851' : '#ff4444';
t.style.cssText = `background:#111;color:#fff;padding:14px 22px;border-radius:4px;margin-bottom:8px;border-left:3px solid ${color};display:flex;align-items:center;gap:10px;font-family:'Outfit',sans-serif;font-size:13px;transform:translateX(120%);transition:transform 0.3s ease;box-shadow:0 4px 20px rgba(0,0,0,0.5);`;
t.innerHTML = `<i class="fas ${type==='success'?'fa-check-circle':'fa-exclamation-circle'}" style="color:${color}"></i><span>${msg}</span>`;
c.appendChild(t);
setTimeout(() => t.style.transform = 'translateX(0)', 80);
setTimeout(() => { t.style.transform = 'translateX(120%)'; setTimeout(() => t.remove(), 300); }, 3200);
};
