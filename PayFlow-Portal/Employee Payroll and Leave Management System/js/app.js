// ============ PayFlow HR - Application Logic ============

const App = {
  employees: [],
  leaves: [],
  payroll: [],
  charts: {},
  initialized: false,

  init() {
    if (this.initialized) return;
    seedIfNeeded();
    this.employees = Store.getEmployees();
    this.leaves = Store.getLeaves();
    this.payroll = Store.getPayroll();
    this.bindEvents();
    this.setupSelects();
    this.setPayrollMonthDefault();
    this.initialized = true;
    this.updateCurrentUserUI();
    this.navigate('dashboard');
    this.renderAll();
    document.getElementById('logoutBtn').style.display = 'inline-flex';
  },

  onLogin() {
    this.updateCurrentUserUI();
    if (!this.initialized) {
      this.init();
    } else {
      this.renderAll();
      this.navigate('dashboard');
    }
    document.getElementById('logoutBtn').style.display = 'inline-flex';
  },

  updateCurrentUserUI() {
    const user = Auth.currentUser;
    if (!user) return;
    const profileName = document.querySelector('.profile-name');
    const profileRole = document.querySelector('.profile-role');
    const avatar = document.querySelector('.profile-mini .avatar');
    if (profileName) profileName.textContent = `${user.first} ${user.last}`;
    if (profileRole) profileRole.textContent = user.role;
    if (avatar) avatar.textContent = getInitials(user.first, user.last);

    const adminItems = document.querySelectorAll('[data-permission="admin"]');
    const topAddBtn = document.getElementById('topAddBtn');
    if (user.role === 'Admin') {
      adminItems.forEach(el => el.style.display = 'flex');
      if (topAddBtn) topAddBtn.style.display = 'inline-flex';
    } else {
      adminItems.forEach(el => el.style.display = 'none');
      if (topAddBtn) topAddBtn.style.display = 'none';
    }
  },

  userCanAccess(page) {
    const user = Auth.currentUser;
    if (!user) return false;
    const adminPages = ['employees', 'payroll', 'reports'];
    if (adminPages.includes(page) && user.role !== 'Admin') return false;
    return true;
  },

  // ============ Events ============
  bindEvents() {
    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        if (!this.userCanAccess(page)) {
          this.toast('You do not have permission to view this page.', 'error');
          return;
        }
        this.navigate(page);
        this.closeSidebar();
      });
    });

    document.querySelectorAll('[data-goto]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate(el.dataset.goto);
        this.closeSidebar();
      });
    });

    document.getElementById('sidebarToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // Modals close
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal(btn.dataset.close));
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeModal(overlay.id);
      });
    });

    // Employee modal
    document.getElementById('addEmployeeBtn').addEventListener('click', () => this.openEmployeeModal());
    document.getElementById('topAddBtn').addEventListener('click', () => this.openEmployeeModal());
    document.getElementById('employeeForm').addEventListener('submit', (e) => this.handleEmployeeSubmit(e));
    document.getElementById('deptFilter').addEventListener('change', () => this.renderEmployees());

    // Payroll
    document.getElementById('runPayrollBtn').addEventListener('click', () => this.runPayroll());
    document.getElementById('printPayslip').addEventListener('click', () => window.print());

    // Leave
    document.getElementById('leaveForm').addEventListener('submit', (e) => this.handleLeaveSubmit(e));
    document.getElementById('leaveFilter').addEventListener('change', () => this.renderLeaves());

    // Global search
    document.getElementById('globalSearch').addEventListener('input', (e) => this.handleSearch(e.target.value));

    // Export CSV
    document.getElementById('exportBtn').addEventListener('click', () => this.exportCSV());

    // Escape key closes modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => this.closeModal(m.id));
    });

    window.addEventListener('beforeunload', () => this.persistAll());
  },

  persistAll() {
    Store.saveEmployees(this.employees);
    Store.saveLeaves(this.leaves);
    Store.savePayroll(this.payroll);
  },

  // ============ Navigation ============
  navigate(page) {
    if (!this.userCanAccess(page)) {
      this.toast('You do not have permission to view this page.', 'error');
      return;
    }
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + page));
    const titles = {
      dashboard: ['Dashboard', 'Overview of your organization'],
      employees: ['Employees', 'Manage your workforce'],
      payroll: ['Payroll', 'Process salaries and generate payslips'],
      leaves: ['Leave Management', 'Apply and track leave requests'],
      reports: ['Reports', 'Payroll and leave analytics'],
    };
    const [t, s] = titles[page] || titles.dashboard;
    document.getElementById('pageTitle').textContent = t;
    document.getElementById('pageSubtitle').textContent = s;
    if (page === 'dashboard') this.renderDashboard();
    if (page === 'reports') this.renderReports();
    if (page === 'employees' && Auth.currentUser.role !== 'Admin') {
      this.toast('Admins only.', 'error');
      this.navigate('dashboard');
      return;
    }
    window.scrollTo(0, 0);
  },

  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
  },

  // ============ Setup ============
  setupSelects() {
    const depts = [...new Set(this.employees.map(e => e.department))];
    const deptSelects = ['deptFilter', 'empDept'];
    deptSelects.forEach(id => {
      const sel = document.getElementById(id);
      const current = sel.value;
      sel.innerHTML = id === 'empDept' ? '<option value="">Select department</option>' : '<option value="">All Departments</option>';
      depts.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        sel.appendChild(opt);
      });
      if (current) sel.value = current;
    });
    this.renderEmployeeSelects();
  },

  renderEmployeeSelects() {
    const sel = document.getElementById('leaveEmployee');
    sel.innerHTML = '<option value="">Select employee</option>';
    this.employees.filter(e => e.status === 'Active').forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = `${e.first} ${e.last} (${e.department})`;
      sel.appendChild(opt);
    });
  },

  setPayrollMonthDefault() {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('payrollMonth').value = ym;
  },

  // ============ Render All ============
  renderAll() {
    this.updateBadges();
    this.renderEmployees();
    this.renderLeaves();
    this.renderPayroll();
    this.renderDashboard();
  },

  updateBadges() {
    document.getElementById('badgeEmployees').textContent = this.employees.length;
    const pending = this.leaves.filter(l => l.status === 'Pending').length;
    document.getElementById('badgePending').textContent = pending;
    document.getElementById('notifDot').style.display = pending > 0 ? 'block' : 'none';
  },

  // ============ Employees ============
  openEmployeeModal(emp) {
    document.getElementById('modalTitle').textContent = emp ? 'Edit Employee' : 'Add Employee';
    document.getElementById('empId').value = emp ? emp.id : '';
    document.getElementById('empFirst').value = emp ? emp.first : '';
    document.getElementById('empLast').value = emp ? emp.last : '';
    document.getElementById('empEmail').value = emp ? emp.email : '';
    document.getElementById('empPhone').value = emp ? emp.phone : '';
    document.getElementById('empDept').value = emp ? emp.department : '';
    document.getElementById('empPosition').value = emp ? emp.position : '';
    document.getElementById('empSalary').value = emp ? emp.basicSalary : '';
    document.getElementById('empAllowance').value = emp ? emp.allowance : 0;
    document.getElementById('empHireDate').value = emp ? emp.hireDate : todayISO();
    document.getElementById('empStatus').value = emp ? emp.status : 'Active';
    this.openModal('employeeModal');
  },

  handleEmployeeSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('empId').value;
    const data = {
      first: document.getElementById('empFirst').value.trim(),
      last: document.getElementById('empLast').value.trim(),
      email: document.getElementById('empEmail').value.trim(),
      phone: document.getElementById('empPhone').value.trim(),
      department: document.getElementById('empDept').value,
      position: document.getElementById('empPosition').value.trim(),
      basicSalary: parseFloat(document.getElementById('empSalary').value) || 0,
      allowance: parseFloat(document.getElementById('empAllowance').value) || 0,
      hireDate: document.getElementById('empHireDate').value,
      status: document.getElementById('empStatus').value,
    };

    if (!data.first || !data.last || !data.email || !data.department || !data.position || data.basicSalary <= 0) {
      this.toast('Please fill all required fields correctly.', 'error');
      return;
    }

    if (id) {
      const emp = this.employees.find(x => x.id === id);
      if (emp) Object.assign(emp, data);
      this.toast('Employee updated successfully.', 'success');
    } else {
      const newEmp = { id: genId('E'), ...data };
      this.employees.push(newEmp);
      this.toast('Employee added successfully.', 'success');
    }
    this.persistAll();
    this.closeModal('employeeModal');
    this.setupSelects();
    this.renderAll();
    this.navigate('employees');
  },

  deleteEmployee(id) {
    if (!confirm('Delete this employee? Related leave records will also be removed.')) return;
    this.employees = this.employees.filter(e => e.id !== id);
    this.leaves = this.leaves.filter(l => l.employeeId !== id);
    this.persistAll();
    this.setupSelects();
    this.renderAll();
    this.navigate('employees');
    this.toast('Employee deleted.', 'warning');
  },

  renderEmployees() {
    const tbody = document.getElementById('employeeBody');
    const empty = document.getElementById('employeeEmpty');
    const filter = document.getElementById('deptFilter').value;
    let list = this.employees;
    if (filter) list = list.filter(e => e.department === filter);

    tbody.innerHTML = '';
    if (list.length === 0) {
      empty.style.display = 'block';
      tbody.style.display = 'none';
      return;
    }
    empty.style.display = 'none';
    tbody.style.display = '';

    list.forEach(e => {
      const tr = document.createElement('tr');
      const statusClass = e.status === 'Active' ? 'active' : (e.status === 'On Leave' ? 'onleave' : 'inactive');
      tr.innerHTML = `
        <td>
          <div class="emp-cell">
            <div class="avatar" style="background:${avatarColor(e.first + e.last)}">${getInitials(e.first, e.last)}</div>
            <div>
              <div class="emp-name">${esc(e.first)} ${esc(e.last)}</div>
              <div class="emp-mail">${esc(e.id)}</div>
            </div>
          </div>
        </td>
        <td>${esc(e.department)}</td>
        <td>${esc(e.position)}</td>
        <td>
          <div class="emp-name">${esc(e.email)}</div>
          <div class="emp-mail">${esc(e.phone)}</div>
        </td>
        <td>${fmtMoney(e.basicSalary)}</td>
        <td><span class="badge ${statusClass}">${esc(e.status)}</span></td>
        <td>
          <div class="actions">
            <button class="icon-btn" data-edit="${e.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="icon-btn" data-payslip="${e.id}" title="Payslip"><i class="fa-solid fa-file-invoice"></i></button>
            <button class="icon-btn" data-del="${e.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Bind row actions
    tbody.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {
      const emp = this.employees.find(x => x.id === b.dataset.edit);
      if (emp) this.openEmployeeModal(emp);
    }));
    tbody.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => this.deleteEmployee(b.dataset.del)));
    tbody.querySelectorAll('[data-payslip]').forEach(b => b.addEventListener('click', () => {
      const emp = this.employees.find(x => x.id === b.dataset.payslip);
      if (emp) this.showPayslip(emp, this.getLatestPayslip(emp.id));
    }));
  },

  // ============ Payroll ============
  getPayrollRows() {
    const month = document.getElementById('payrollMonth').value;
    return this.payroll.filter(p => p.month === month);
  },

  runPayroll() {
    const month = document.getElementById('payrollMonth').value;
    if (!month) {
      this.toast('Please select a payroll month.', 'error');
      return;
    }
    if (this.employees.length === 0) {
      this.toast('No employees to process.', 'error');
      return;
    }

    // Remove existing rows for this month
    this.payroll = this.payroll.filter(p => p.month !== month);
    const monthLabel = new Date(month + '-01T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    this.employees.forEach(emp => {
      const tax = this.calcTax(emp.basicSalary + emp.allowance);
      const insurance = Math.round((emp.basicSalary * 0.07) * 100) / 100;
      const gross = emp.basicSalary + emp.allowance;
      const totalDeductions = tax + insurance;
      const net = gross - totalDeductions;
      this.payroll.push({
        id: uid(),
        employeeId: emp.id,
        month,
        monthLabel,
        basic: emp.basicSalary,
        allowance: emp.allowance,
        gross,
        tax,
        insurance,
        totalDeductions,
        net: Math.round(net * 100) / 100,
        status: 'Paid',
        generatedAt: new Date().toISOString(),
      });
    });

    this.persistAll();
    this.renderPayroll();
    this.toast(`Payroll processed for ${monthLabel}.`, 'success');
  },

  calcTax(annualBase) {
    // Progressive-ish flat tax example: 15% for simplicity
    return Math.round(annualBase * 0.15 * 100) / 100;
  },

  renderPayroll() {
    const month = document.getElementById('payrollMonth').value;
    const rows = this.getPayrollRows();
    const tbody = document.getElementById('payrollBody');
    const empty = document.getElementById('payrollEmpty');

    if (rows.length === 0) {
      empty.style.display = 'block';
      tbody.style.display = 'none';
    } else {
      empty.style.display = 'none';
      tbody.style.display = '';
    }
    tbody.innerHTML = '';

    rows.forEach(p => {
      const emp = this.employees.find(x => x.id === p.employeeId);
      const name = emp ? `${emp.first} ${emp.last}` : p.employeeId;
      const dept = emp ? emp.department : '-';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="emp-cell">
            <div class="avatar" style="background:${avatarColor(name)}">${emp ? getInitials(emp.first, emp.last) : '?'}</div>
            <div>
              <div class="emp-name">${esc(name)}</div>
              <div class="emp-mail">${esc(p.employeeId)}</div>
            </div>
          </div>
        </td>
        <td>${esc(dept)}</td>
        <td>${fmtMoney(p.basic)}</td>
        <td>${fmtMoney(p.allowance)}</td>
        <td class="stat-delta warn">${fmtMoney(p.totalDeductions)}</td>
        <td class="emp-name">${fmtMoney(p.net)}</td>
        <td><span class="badge approved">${esc(p.status)}</span></td>
        <td>
          <div class="actions">
            <button class="icon-btn" data-view="${p.id}" title="View Payslip"><i class="fa-solid fa-file-invoice"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
      const p = this.payroll.find(x => x.id === b.dataset.view);
      const emp = this.employees.find(x => x.id === p.employeeId);
      this.showPayslip(emp, p);
    }));

    // History table
    const historyBody = document.getElementById('payslipHistory');
    const historyEmpty = document.getElementById('historyEmpty');
    const recent = [...this.payroll].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt)).slice(0, 10);
    historyBody.innerHTML = '';
    if (recent.length === 0) {
      historyEmpty.style.display = 'block';
      historyBody.style.display = 'none';
    } else {
      historyEmpty.style.display = 'none';
      historyBody.style.display = '';
    }
    recent.forEach(p => {
      const emp = this.employees.find(x => x.id === p.employeeId);
      const name = emp ? `${emp.first} ${emp.last}` : p.employeeId;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="emp-cell">
            <div class="avatar" style="background:${avatarColor(name)}">${emp ? getInitials(emp.first, emp.last) : '?'}</div>
            <div class="emp-name">${esc(name)}</div>
          </div>
        </td>
        <td>${esc(p.monthLabel)}</td>
        <td class="emp-name">${fmtMoney(p.net)}</td>
        <td>${formatDate(p.generatedAt)}</td>
        <td>
          <div class="actions">
            <button class="btn btn-sm btn-ghost" data-viewh="${p.id}"><i class="fa-solid fa-eye"></i> View</button>
          </div>
        </td>
      `;
      historyBody.appendChild(tr);
    });
    historyBody.querySelectorAll('[data-viewh]').forEach(b => b.addEventListener('click', () => {
      const p = this.payroll.find(x => x.id === b.dataset.viewh);
      const emp = this.employees.find(x => x.id === p.employeeId);
      this.showPayslip(emp, p);
    }));
  },

  getLatestPayslip(employeeId) {
    return [...this.payroll].filter(p => p.employeeId === employeeId).sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0] || null;
  },

  showPayslip(emp, payslip) {
    if (!payslip || !emp) {
      this.toast('No payslip found for this employee. Run payroll first.', 'warning');
      return;
    }
    const body = document.getElementById('payslipBody');
    body.innerHTML = `
      <div class="payslip-header">
        <h2>PayFlow <span>HR</span></h2>
        <div class="ps-month">Payslip — ${esc(payslip.monthLabel)}</div>
      </div>
      <div class="emp-row"><span class="lbl">Employee</span><span class="val">${esc(emp.first)} ${esc(emp.last)} (${esc(emp.id)})</span></div>
      <div class="emp-row"><span class="lbl">Department</span><span class="val">${esc(emp.department)}</span></div>
      <div class="emp-row"><span class="lbl">Position</span><span class="val">${esc(emp.position)}</span></div>
      <div class="emp-row"><span class="lbl">Pay Period</span><span class="val">${esc(payslip.monthLabel)}</span></div>

      <div class="ps-section">
        <h4>Earnings</h4>
        <div class="ps-row"><span>Basic Salary</span><span class="amt">${fmtMoney(payslip.basic)}</span></div>
        <div class="ps-row"><span>Allowances</span><span class="amt">${fmtMoney(payslip.allowance)}</span></div>
        <div class="ps-row"><span>Gross Pay</span><span class="amt">${fmtMoney(payslip.gross)}</span></div>
      </div>
      <div class="ps-section">
        <h4>Deductions</h4>
        <div class="ps-row neg"><span>Income Tax (15%)</span><span class="amt">-${fmtMoney(payslip.tax)}</span></div>
        <div class="ps-row neg"><span>Insurance (7%)</span><span class="amt">-${fmtMoney(payslip.insurance)}</span></div>
        <div class="ps-row neg"><span>Total Deductions</span><span class="amt">-${fmtMoney(payslip.totalDeductions)}</span></div>
      </div>
      <div class="ps-total">
        <span class="net-label">Net Pay</span>
        <span class="net-amount">${fmtMoney(payslip.net)}</span>
      </div>
      <div class="ps-footer">
        Generated on ${formatDate(payslip.generatedAt)} &nbsp;|&nbsp; This is a system-generated payslip.
      </div>
    `;
    this.openModal('payModal');
  },

  // ============ Leaves ============
  handleLeaveSubmit(e) {
    e.preventDefault();
    const employeeId = document.getElementById('leaveEmployee').value;
    const type = document.getElementById('leaveType').value;
    const from = document.getElementById('leaveFrom').value;
    const to = document.getElementById('leaveTo').value;
    const reason = document.getElementById('leaveReason').value.trim();

    if (!employeeId || !type || !from || !to) {
      this.toast('Please fill all required fields.', 'error');
      return;
    }
    if (new Date(to) < new Date(from)) {
      this.toast('"To" date must be after "From" date.', 'error');
      return;
    }

    const emp = this.employees.find(x => x.id === employeeId);
    const leave = {
      id: genId('LV'),
      employeeId,
      type,
      from,
      to,
      reason: reason || '-',
      status: 'Pending',
      appliedAt: new Date().toISOString(),
    };
    this.leaves.push(leave);
    if (emp) emp.status = 'On Leave';
    this.persistAll();
    this.renderLeaves();
    this.renderEmployees();
    this.updateBadges();
    this.toast('Leave request submitted for approval.', 'success');
    e.target.reset();
  },

  updateLeaveStatus(id, status) {
    const leave = this.leaves.find(x => x.id === id);
    if (!leave) return;
    leave.status = status;
    // Update employee status if approved and currently applicable
    const emp = this.employees.find(x => x.id === leave.employeeId);
    if (emp) {
      if (status === 'Approved') emp.status = 'On Leave';
      if (status === 'Rejected') {
        const otherActive = this.leaves.some(l => l.employeeId === emp.id && l.status === 'Approved');
        emp.status = otherActive ? 'On Leave' : 'Active';
      }
    }
    this.persistAll();
    this.renderLeaves();
    this.renderEmployees();
    this.updateBadges();
    this.toast(`Leave request ${status.toLowerCase()}.`, status === 'Approved' ? 'success' : (status === 'Rejected' ? 'warning' : 'success'));
  },

  renderLeaves() {
    const tbody = document.getElementById('leaveBody');
    const empty = document.getElementById('leaveEmpty');
    const filter = document.getElementById('leaveFilter').value;
    let list = [...this.leaves].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
    if (filter) list = list.filter(l => l.status === filter);

    tbody.innerHTML = '';
    if (list.length === 0) {
      empty.style.display = 'block';
      tbody.style.display = 'none';
    } else {
      empty.style.display = 'none';
      tbody.style.display = '';
    }

    const statusClass = { 'Approved': 'approved', 'Pending': 'pending', 'Rejected': 'rejected' };

    list.forEach(l => {
      const emp = this.employees.find(x => x.id === l.employeeId);
      const name = emp ? `${emp.first} ${emp.last}` : l.employeeId;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="emp-cell">
            <div class="avatar" style="background:${avatarColor(name)}">${emp ? getInitials(emp.first, emp.last) : '?'}</div>
            <div class="emp-name">${esc(name)}</div>
          </div>
        </td>
        <td>${esc(l.type)}</td>
        <td>${formatDate(l.from)}</td>
        <td>${formatDate(l.to)}</td>
        <td><span class="badge active">${calcLeaveDays(l.from, l.to)} day${calcLeaveDays(l.from, l.to) > 1 ? 's' : ''}</span></td>
        <td title="${esc(l.reason)}">${esc(truncate(l.reason, 24))}</td>
        <td><span class="badge ${statusClass[l.status]}">${esc(l.status)}</span></td>
        <td>
          ${l.status === 'Pending' ? `
            <div class="actions">
              <button class="icon-btn" data-aprove="${l.id}" title="Approve" style="color:var(--success)"><i class="fa-solid fa-check"></i></button>
              <button class="icon-btn" data-reject="${l.id}" title="Reject" style="color:var(--danger)"><i class="fa-solid fa-xmark"></i></button>
            </div>` : `<span class="emp-mail">${formatDate(l.appliedAt)}</span>`}
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('[data-aprove]').forEach(b => b.addEventListener('click', () => this.updateLeaveStatus(b.dataset.aprove, 'Approved')));
    tbody.querySelectorAll('[data-reject]').forEach(b => b.addEventListener('click', () => this.updateLeaveStatus(b.dataset.reject, 'Rejected')));
  },

  // ============ Dashboard ============
  renderDashboard() {
    // Stats
    const active = this.employees.filter(e => e.status === 'Active').length;
    document.getElementById('statEmployees').textContent = this.employees.length;
    document.getElementById('statPayroll').textContent = fmtMoney(Math.round(this.monthlyPayrollCost()));
    document.getElementById('statPending').textContent = this.leaves.filter(l => l.status === 'Pending').length;
    document.getElementById('statAttendance').textContent = Math.min(100, Math.round(85 + (this.employees.length * 1.2))) + '%';

    // Directory (top 5)
    const dirBody = document.getElementById('dirBody');
    dirBody.innerHTML = '';
    this.employees.slice(0, 6).forEach(e => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="emp-cell">
            <div class="avatar" style="background:${avatarColor(e.first + e.last)}">${getInitials(e.first, e.last)}</div>
            <div>
              <div class="emp-name">${esc(e.first)} ${esc(e.last)}</div>
              <div class="emp-mail">${esc(e.id)}</div>
            </div>
          </div>
        </td>
        <td>${esc(e.department)}</td>
        <td>${esc(e.position)}</td>
        <td>${fmtMoney(e.basicSalary)}</td>
        <td><span class="badge ${e.status === 'Active' ? 'active' : (e.status === 'On Leave' ? 'onleave' : 'inactive')}">${esc(e.status)}</span></td>
      `;
      dirBody.appendChild(tr);
    });
    if (this.employees.length === 0) dirBody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><p>No employees yet</p></div></td></tr>';

    // Recent leaves
    const recent = document.getElementById('recentLeaves');
    recent.innerHTML = '';
    const list = [...this.leaves].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)).slice(0, 5);
    if (list.length === 0) recent.innerHTML = '<div class="empty-state"><p>No leave activity</p></div>';
    list.forEach(l => {
      const emp = this.employees.find(x => x.id === l.employeeId);
      const name = emp ? `${emp.first} ${emp.last}` : l.employeeId;
      const item = document.createElement('div');
      item.className = 'activity-item';
      const colors = { 'Approved': '#10b981', 'Pending': '#f59e0b', 'Rejected': '#ef4444' };
      item.innerHTML = `
        <div class="activity-avatar" style="background:${colors[l.status]}">
          <i class="fa-solid ${l.status === 'Approved' ? 'fa-check' : (l.status === 'Pending' ? 'fa-clock' : 'fa-xmark')}"></i>
        </div>
        <div>
          <div class="act-name">${esc(name)} <span class="act-detail">· ${esc(l.type)}</span></div>
          <div class="act-detail">${formatDate(l.from)} → ${formatDate(l.to)} (${calcLeaveDays(l.from, l.to)} days)</div>
        </div>
        <span class="badge ${l.status === 'Approved' ? 'approved' : (l.status === 'Pending' ? 'pending' : 'rejected')}" style="margin-left:auto;">${esc(l.status)}</span>
      `;
      recent.appendChild(item);
    });

    this.renderPayrollChart();
  },

  monthlyPayrollCost() {
    return this.employees.reduce((sum, e) => sum + e.basicSalary + e.allowance, 0);
  },

  renderPayrollChart() {
    const deptMap = {};
    this.employees.forEach(e => {
      deptMap[e.department] = (deptMap[e.department] || 0) + e.basicSalary + e.allowance;
    });
    const labels = Object.keys(deptMap);
    const values = Object.values(deptMap);
    const ctx = document.getElementById('payrollChart');
    if (this.charts.payroll) this.charts.payroll.destroy();
    if (labels.length === 0) return;
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'];
    this.charts.payroll = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: colors, borderWidth: 3, borderColor: '#fff', hoverOffset: 8 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => ` ${c.label}: ${fmtMoney(c.raw)}`,
            },
          },
        },
      },
    });
    const legend = document.getElementById('payrollLegend');
    legend.innerHTML = labels.map((l, i) => `<span><i class="dot" style="background:${colors[i % colors.length]}"></i>${esc(l)} — ${fmtMoney(values[i])}</span>`).join('');
  },

  // ============ Reports ============
  renderReports() {
    // Department chart
    const deptMap = {};
    this.employees.forEach(e => {
      deptMap[e.department] = (deptMap[e.department] || 0) + e.basicSalary + e.allowance;
    });
    const labels = Object.keys(deptMap);
    const values = Object.values(deptMap);
    const ctxD = document.getElementById('deptChart');
    if (this.charts.dept) this.charts.dept.destroy();
    if (labels.length > 0) {
      this.charts.dept = new Chart(ctxD, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Monthly cost',
            data: values,
            backgroundColor: 'rgba(79,70,229,.85)',
            borderRadius: 8,
            maxBarThickness: 46,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${fmtMoney(c.raw)}` } } },
          scales: { y: { beginAtZero: true, ticks: { callback: (v) => '$' + (v >= 1000 ? v / 1000 + 'k' : v) } }, x: { grid: { display: false } } },
        },
      });
    }

    // Leave type chart
    const typeMap = {};
    this.leaves.forEach(l => { typeMap[l.type] = (typeMap[l.type] || 0) + 1; });
    const tLabels = Object.keys(typeMap);
    const tValues = Object.values(typeMap);
    const ctxL = document.getElementById('leaveChart');
    if (this.charts.leave) this.charts.leave.destroy();
    if (tLabels.length > 0) {
      const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#ef4444'];
      this.charts.leave = new Chart(ctxL, {
        type: 'polarArea',
        data: { labels: tLabels, datasets: [{ data: tValues, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } },
      });
    }

    // Summary table
    const sumBody = document.getElementById('summaryBody');
    sumBody.innerHTML = '';
    const deptStats = {};
    this.employees.forEach(e => {
      if (!deptStats[e.department]) deptStats[e.department] = { count: 0, basic: 0, allow: 0, net: 0 };
      const d = deptStats[e.department];
      d.count++;
      d.basic += e.basicSalary;
      d.allow += e.allowance;
      const tax = this.calcTax(e.basicSalary + e.allowance);
      d.net += e.basicSalary + e.allowance - tax - Math.round(e.basicSalary * 0.07 * 100) / 100;
    });
    if (Object.keys(deptStats).length === 0) {
      sumBody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>No data available</p></div></td></tr>';
      return;
    }
    Object.entries(deptStats).forEach(([dept, d]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="emp-name">${esc(dept)}</td>
        <td>${d.count}</td>
        <td>${fmtMoney(Math.round(d.basic))}</td>
        <td>${fmtMoney(Math.round(d.allow))}</td>
        <td class="stat-delta warn">${fmtMoney(Math.round(d.basic * 0.15 + d.basic * 0.07))}</td>
        <td class="emp-name">${fmtMoney(Math.round(d.net))}</td>
      `;
      sumBody.appendChild(tr);
    });
  },

  // ============ Search ============
  handleSearch(query) {
    query = query.trim().toLowerCase();
    if (!query) {
      this.renderEmployees();
      return;
    }
    this.navigate('employees');
    const list = this.employees.filter(e =>
      `${e.first} ${e.last} ${e.id} ${e.department} ${e.position} ${e.email}`.toLowerCase().includes(query)
    );
    const tbody = document.getElementById('employeeBody');
    tbody.innerHTML = '';
    const empty = document.getElementById('employeeEmpty');
    if (list.length === 0) {
      empty.style.display = 'block';
      tbody.style.display = 'none';
      return;
    }
    empty.style.display = 'none';
    tbody.style.display = '';
    list.forEach(e => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="emp-cell">
            <div class="avatar" style="background:${avatarColor(e.first + e.last)}">${getInitials(e.first, e.last)}</div>
            <div>
              <div class="emp-name">${esc(e.first)} ${esc(e.last)}</div>
              <div class="emp-mail">${esc(e.id)}</div>
            </div>
          </div>
        </td>
        <td>${esc(e.department)}</td>
        <td>${esc(e.position)}</td>
        <td>${fmtMoney(e.basicSalary)}</td>
        <td><span class="badge ${e.status === 'Active' ? 'active' : 'inactive'}">${esc(e.status)}</span></td>
      `;
      tbody.appendChild(tr);
    });
  },

  // ============ Export CSV ============
  exportCSV() {
    const rows = [['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Department', 'Position', 'Basic Salary', 'Allowance', 'Hire Date', 'Status']];
    this.employees.forEach(e => {
      rows.push([e.id, e.first, e.last, e.email, e.phone, e.department, e.position, e.basicSalary, e.allowance, e.hireDate, e.status]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payflow-employees.csv';
    a.click();
    URL.revokeObjectURL(url);
    this.toast('CSV exported.', 'success');
  },

  // ============ Modals ============
  openModal(id) {
    document.getElementById(id).classList.add('open');
  },
  closeModal(id) {
    document.getElementById(id).classList.remove('open');
  },

  // ============ Toast ============
  toast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation' };
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.success}"></i><span>${esc(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },
};

// ============ Helpers (escaping) ============
function esc(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

// ============ Boot ============
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
  if (Auth.isAuthenticated()) {
    App.init();
  }
});
