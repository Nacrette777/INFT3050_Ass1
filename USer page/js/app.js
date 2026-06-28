/* =============================
   GUILD TRADING PLATFORM – APP JS
   ============================= */

// ---- 预设测试账号（首次加载自动写入）----
(function seedDefaultUser() {
  const users = JSON.parse(localStorage.getItem('guild_users') || '[]');
  const exists = users.find(u => u.email === '123456@gmail.com');
  if (!exists) {
    users.push({
      name: 'Test User',
      email: '123456@gmail.com',
      password: '123456',
      joinedAt: new Date().toISOString()
    });
    localStorage.setItem('guild_users', JSON.stringify(users));
  }
})();

// ---- Mock "database" via localStorage ----
const DB = {
  getUsers: () => JSON.parse(localStorage.getItem('guild_users') || '[]'),
  saveUsers: (users) => localStorage.setItem('guild_users', JSON.stringify(users)),
  getSession: () => JSON.parse(localStorage.getItem('guild_session') || 'null'),
  setSession: (user) => localStorage.setItem('guild_session', JSON.stringify(user)),
  clearSession: () => localStorage.removeItem('guild_session'),
  getOrders: (email) => {
    const all = JSON.parse(localStorage.getItem('guild_orders') || '{}');
    return all[email] || sampleOrders(email);
  },
  saveOrders: (email, orders) => {
    const all = JSON.parse(localStorage.getItem('guild_orders') || '{}');
    all[email] = orders;
    localStorage.setItem('guild_orders', JSON.stringify(all));
  },
};

// ---- No default orders ----
function sampleOrders(email) {
  return [];
}

// ---- Toast Notification ----
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
       <polyline points="20 6 9 17 4 12"></polyline></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
       <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
       <line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ---- Field validation helpers ----
function setError(inputEl, msgEl, message) {
  inputEl.classList.add('error');
  if (msgEl) { msgEl.textContent = message; msgEl.classList.add('visible'); }
}

function clearError(inputEl, msgEl) {
  inputEl.classList.remove('error');
  if (msgEl) { msgEl.textContent = ''; msgEl.classList.remove('visible'); }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---- Auth guard (redirect if not logged in) ----
function requireAuth() {
  const session = DB.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

// ---- Redirect if already logged in ----
function redirectIfLoggedIn() {
  const session = DB.getSession();
  if (session) window.location.href = 'profile.html';
}

// ---- Update navbar user pill ----
function initNavbar() {
  const session = DB.getSession();
  const userPillContainer = document.getElementById('navUserPill');
  const navLogin = document.getElementById('navLogin');

  if (session) {
    if (userPillContainer) {
      const initials = session.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
      userPillContainer.innerHTML = `
        <a href="profile.html" class="user-pill" title="My Profile">
          <div class="user-avatar">${initials}</div>
          <span>${session.name.split(' ')[0]}</span>
        </a>
        <button class="btn-logout" onclick="logout()">Logout</button>
      `;
    }
    if (navLogin) navLogin.classList.add('hidden');
  } else {
    if (userPillContainer) {
      userPillContainer.innerHTML = `<a href="login.html" class="btn-logout" style="color:var(--gold);border-color:var(--gold)">Login</a>`;
    }
  }
}

function logout() {
  DB.clearSession();
  showToast('You have been logged out.', 'success');
  setTimeout(() => window.location.href = 'login.html', 900);
}

// ---- Toggle password visibility ----
function initPasswordToggles() {
  document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const isHidden = target.type === 'password';
      target.type = isHidden ? 'text' : 'password';
      btn.querySelector('.eye-open').classList.toggle('hidden', isHidden);
      btn.querySelector('.eye-closed').classList.toggle('hidden', !isHidden);
    });
  });
}

/* ============================
   LOGIN PAGE
   ============================ */
function initLoginPage() {
  redirectIfLoggedIn();
  initNavbar();
  initPasswordToggles();

  const form = document.getElementById('loginForm');
  if (!form) return;

  const emailInput = document.getElementById('loginEmail');
  const passInput  = document.getElementById('loginPassword');
  const emailErr   = document.getElementById('loginEmailError');
  const passErr    = document.getElementById('loginPassError');
  const submitBtn  = document.getElementById('loginBtn');

  // real-time clear
  emailInput.addEventListener('input', () => clearError(emailInput, emailErr));
  passInput.addEventListener('input',  () => clearError(passInput, passErr));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const email = emailInput.value.trim();
    const pass  = passInput.value;

    if (!email) {
      setError(emailInput, emailErr, 'Email is required.'); valid = false;
    } else if (!validateEmail(email)) {
      setError(emailInput, emailErr, 'Enter a valid email address.'); valid = false;
    } else {
      clearError(emailInput, emailErr);
    }

    if (!pass) {
      setError(passInput, passErr, 'Password is required.'); valid = false;
    } else {
      clearError(passInput, passErr);
    }

    if (!valid) return;

    submitBtn.textContent = 'Signing in…';
    submitBtn.disabled = true;

    setTimeout(() => {
      const users = DB.getUsers();
      const user  = users.find(u => u.email === email && u.password === pass);

      if (!user) {
        setError(emailInput, emailErr, 'Invalid email or password.');
        setError(passInput, passErr, 'Invalid email or password.');
        submitBtn.textContent = 'Sign In';
        submitBtn.disabled = false;
        showToast('Login failed. Check your credentials.', 'error');
        return;
      }

      DB.setSession({ name: user.name, email: user.email });
      showToast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
      setTimeout(() => window.location.href = 'profile.html', 800);
    }, 700);
  });
}

/* ============================
   REGISTER PAGE
   ============================ */
function initRegisterPage() {
  redirectIfLoggedIn();
  initNavbar();
  initPasswordToggles();

  const form = document.getElementById('registerForm');
  if (!form) return;

  const nameInput    = document.getElementById('regName');
  const emailInput   = document.getElementById('regEmail');
  const passInput    = document.getElementById('regPassword');
  const confirmInput = document.getElementById('regConfirm');
  const nameErr      = document.getElementById('regNameError');
  const emailErr     = document.getElementById('regEmailError');
  const passErr      = document.getElementById('regPassError');
  const confirmErr   = document.getElementById('regConfirmError');
  const submitBtn    = document.getElementById('registerBtn');

  nameInput.addEventListener('input',    () => clearError(nameInput, nameErr));
  emailInput.addEventListener('input',   () => clearError(emailInput, emailErr));
  passInput.addEventListener('input',    () => clearError(passInput, passErr));
  confirmInput.addEventListener('input', () => clearError(confirmInput, confirmErr));

  // Password strength indicator
  passInput.addEventListener('input', () => {
    const val = passInput.value;
    const bar = document.getElementById('passStrengthBar');
    const label = document.getElementById('passStrengthLabel');
    if (!bar) return;

    let strength = 0;
    if (val.length >= 8) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^a-zA-Z0-9]/.test(val)) strength++;

    const levels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', '#E05252', '#C9A84C', '#4A7FA5', '#3DAA6F'];
    const widths = ['0%', '25%', '50%', '75%', '100%'];

    bar.style.width = widths[strength];
    bar.style.background = colors[strength];
    if (label) label.textContent = strength > 0 ? levels[strength] : '';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const name    = nameInput.value.trim();
    const email   = emailInput.value.trim();
    const pass    = passInput.value;
    const confirm = confirmInput.value;

    if (!name || name.length < 2) {
      setError(nameInput, nameErr, 'Full name must be at least 2 characters.'); valid = false;
    } else { clearError(nameInput, nameErr); }

    if (!email || !validateEmail(email)) {
      setError(emailInput, emailErr, 'Enter a valid email address.'); valid = false;
    } else { clearError(emailInput, emailErr); }

    if (!pass || pass.length < 6) {
      setError(passInput, passErr, 'Password must be at least 6 characters.'); valid = false;
    } else { clearError(passInput, passErr); }

    if (!confirm || confirm !== pass) {
      setError(confirmInput, confirmErr, 'Passwords do not match.'); valid = false;
    } else { clearError(confirmInput, confirmErr); }

    if (!valid) return;

    const users = DB.getUsers();
    if (users.find(u => u.email === email)) {
      setError(emailInput, emailErr, 'This email is already registered.');
      showToast('Email already in use.', 'error');
      return;
    }

    submitBtn.textContent = 'Creating account…';
    submitBtn.disabled = true;

    setTimeout(() => {
      users.push({ name, email, password: pass, joinedAt: new Date().toISOString() });
      DB.saveUsers(users);
      DB.setSession({ name, email });
      showToast(`Account created! Welcome, ${name.split(' ')[0]}.`, 'success');
      setTimeout(() => window.location.href = 'profile.html', 800);
    }, 700);
  });
}

/* ============================
   PROFILE PAGE
   ============================ */

// ---- Render orders table (shared helper) ----
function renderOrders(orders, email) {
  const tbody   = document.getElementById('ordersBody');
  const countEl = document.getElementById('orderCount');
  if (!tbody) return;

  // Update count badge
  if (countEl) countEl.textContent = orders.length;

  // Update stats
  const totalSpent     = orders.filter(o => o.status === 'Completed').reduce((s, o) => s + o.total, 0);
  const completedCount = orders.filter(o => o.status === 'Completed').length;
  const elSpent = document.getElementById('statSpent');
  const elComp  = document.getElementById('statCompleted');
  if (elSpent) elSpent.textContent = '$' + totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 });
  if (elComp)  elComp.textContent  = completedCount;

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>No orders yet.</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map((order, idx) => {
    const statusClass = {
      'Completed':  'status-completed',
      'Pending':    'status-pending',
      'Processing': 'status-processing',
    }[order.status] || 'status-pending';

    const dateFormatted = new Date(order.date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

    return `
      <tr data-idx="${idx}">
        <td><span class="order-id">${order.id}</span></td>
        <td>${order.item}</td>
        <td>${dateFormatted}</td>
        <td><span class="amount">$${order.total.toFixed(2)}</span></td>
        <td><span class="status-badge ${statusClass}">${order.status}</span></td>
        <td>
          <button class="btn-delete-order" onclick="deleteOrder('${email}', ${idx})" title="Delete order">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </td>
      </tr>`;
  }).join('');
}

// ---- Delete a single order ----
function deleteOrder(email, idx) {
  if (!confirm('Delete this order? This cannot be undone.')) return;

  const orders = DB.getOrders(email);
  orders.splice(idx, 1);
  DB.saveOrders(email, orders);
  renderOrders(orders, email);
  showToast('Order deleted.', 'success');
}

function initProfilePage() {
  const session = requireAuth();
  if (!session) return;
  initNavbar();

  // Fill profile info
  const initials = session.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('profileInitials').textContent = initials;
  document.getElementById('profileName').textContent     = session.name;
  document.getElementById('profileEmail').textContent    = session.email;

  // Load and render orders
  const orders = DB.getOrders(session.email);
  renderOrders(orders, session.email);
}
