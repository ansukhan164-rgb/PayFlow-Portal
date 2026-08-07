const Auth = {
  currentUser: null,

  init() {
    this.loadUsers();
    this.bindAuthEvents();
    this.showAuthScreen(!this.isAuthenticated());
  },

  loadUsers() {
    const stored = localStorage.getItem('payflow_users');
    this.users = stored ? JSON.parse(stored) : [];
    if (this.users.length === 0) {
      this.users = [
        { id: 'A1000', first: 'Admin', last: 'User', email: 'admin@company.com', password: 'admin123', role: 'Admin', employeeId: 'A1000' },
      ];
      this.saveUsers();
    }
  },

  saveUsers() {
    localStorage.setItem('payflow_users', JSON.stringify(this.users));
  },

  isAuthenticated() {
    const stored = sessionStorage.getItem('payflow_current_user');
    if (!stored) return false;
    try {
      this.currentUser = JSON.parse(stored);
      return true;
    } catch (e) {
      return false;
    }
  },

  setUser(user) {
    this.currentUser = user;
    sessionStorage.setItem('payflow_current_user', JSON.stringify(user));
  },

  clearUser() {
    this.currentUser = null;
    sessionStorage.removeItem('payflow_current_user');
  },

  bindAuthEvents() {
    document.getElementById('loginTab').addEventListener('click', () => this.switchTab('login'));
    document.getElementById('registerTab').addEventListener('click', () => this.switchTab('register'));
    document.getElementById('showRegisterBtn').addEventListener('click', () => this.switchTab('register'));
    document.getElementById('showLoginBtn').addEventListener('click', () => this.switchTab('login'));
    document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
    document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
  },

  switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const alert = document.getElementById('authAlert');

    if (tab === 'register') {
      loginForm.style.display = 'none';
      registerForm.style.display = 'flex';
      loginTab.classList.remove('active');
      registerTab.classList.add('active');
    } else {
      loginForm.style.display = 'flex';
      registerForm.style.display = 'none';
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
    }
    alert.style.display = 'none';
    alert.textContent = '';
  },

  showAuthScreen(show) {
    document.getElementById('authScreen').style.display = show ? 'flex' : 'none';
    document.querySelector('.app').style.display = show ? 'none' : 'flex';
  },

  showAlert(message, type = 'error') {
    const alert = document.getElementById('authAlert');
    alert.textContent = message;
    alert.className = `auth-alert ${type}`;
    alert.style.display = 'block';
  },

  handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!identifier || !password) {
      return this.showAlert('Enter email/ID and password.');
    }
    const user = this.users.find(u => (u.email.toLowerCase() === identifier.toLowerCase() || u.employeeId.toLowerCase() === identifier.toLowerCase()) && u.password === password);
    if (!user) {
      return this.showAlert('Invalid credentials.');
    }
    this.setUser(user);
    this.showAlert('Login successful!', 'success');
    setTimeout(() => {
      this.showAuthScreen(false);
      App.onLogin();
    }, 500);
  },

  handleRegister(e) {
    e.preventDefault();
    const first = document.getElementById('registerFirst').value.trim();
    const last = document.getElementById('registerLast').value.trim();
    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    const role = document.getElementById('registerRole').value;
    if (!first || !last || !email || !password || !confirm) {
      return this.showAlert('Fill in all fields.');
    }
    if (password.length < 6) {
      return this.showAlert('Password must be at least 6 characters.');
    }
    if (password !== confirm) {
      return this.showAlert('Passwords do not match.');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return this.showAlert('Enter a valid email address.');
    }
    if (this.users.some(u => u.email === email)) {
      return this.showAlert('Email already registered.');
    }
    const employeeId = role === 'Admin' ? `A${Date.now().toString().slice(-5)}` : `E${Date.now().toString().slice(-6)}`;
    const user = { id: uid(), first, last, email, password, role, employeeId };
    this.users.push(user);
    this.saveUsers();
    this.setUser(user);
    this.showAlert('Registration successful! Redirecting...', 'success');
    setTimeout(() => {
      this.showAuthScreen(false);
      App.onLogin();
    }, 700);
  },

  logout() {
    this.clearUser();
    this.showAuthScreen(true);
    this.switchTab('login');
    document.getElementById('logoutBtn').style.display = 'none';
  },
};
