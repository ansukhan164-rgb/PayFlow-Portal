// ============ Data Layer: localStorage persistence & seed data ============

const Store = {
  KEYS: {
    EMPLOYEES: 'payflow_employees',
    LEAVES: 'payflow_leaves',
    PAYROLL: 'payflow_payroll',
    INITIALIZED: 'payflow_initialized',
  },

  read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Failed to read from localStorage', key, e);
      return null;
    }
  },

  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Failed to write to localStorage', key, e);
    }
  },

  // --- Employees ---
  getEmployees() {
    return this.read(this.KEYS.EMPLOYEES) || [];
  },
  saveEmployees(list) {
    this.write(this.KEYS.EMPLOYEES, list);
  },

  // --- Leaves ---
  getLeaves() {
    return this.read(this.KEYS.LEAVES) || [];
  },
  saveLeaves(list) {
    this.write(this.KEYS.LEAVES, list);
  },

  // --- Payroll ---
  getPayroll() {
    return this.read(this.KEYS.PAYROLL) || [];
  },
  savePayroll(list) {
    this.write(this.KEYS.PAYROLL, list);
  },
};

// ============ Seed data ============
const SEED_EMPLOYEES = [
  { id: 'E1001', first: 'Deep', last: 'Sharma', email: 'deep.sinha@company.com', phone: '+91 555-0101', department: 'Engineering', position: 'Senior Software Engineer', basicSalary: 8500, allowance: 1200, hireDate: '2019-04-12', status: 'Active' },
  { id: 'E1002', first: 'Ansar', last: 'khan', email: 'ansu.khan@company.com', phone: '+1 555-0102', department: 'Engineering', position: 'Frontend Developer', basicSalary: 6200, allowance: 800, hireDate: '2021-08-03', status: 'Active' },
  { id: 'E1003', first: 'Liam', last: 'Johnson', email: 'liam.johnson@company.com', phone: '+1 555-0103', department: 'Engineering', position: 'DevOps Engineer', basicSalary: 7800, allowance: 1000, hireDate: '2020-01-20', status: 'Active' },
  { id: 'E1004', first: 'Sofia', last: 'Rodriguez', email: 'sofia.r@company.com', phone: '+1 555-0104', department: 'Marketing', position: 'Marketing Manager', basicSalary: 7200, allowance: 900, hireDate: '2018-11-05', status: 'Active' },
  { id: 'E1005', first: 'Ethan', last: 'Brown', email: 'ethan.brown@company.com', phone: '+1 555-0105', department: 'Marketing', position: 'Content Strategist', basicSalary: 4800, allowance: 500, hireDate: '2022-02-14', status: 'Active' },
  { id: 'E1006', first: 'Mei', last: 'Chen', email: 'mei.chen@company.com', phone: '+1 555-0106', department: 'Finance', position: 'Finance Analyst', basicSalary: 5900, allowance: 700, hireDate: '2020-06-30', status: 'Active' },
  { id: 'E1007', first: 'Noah', last: 'Wilson', email: 'noah.wilson@company.com', phone: '+1 555-0107', department: 'Finance', position: 'Accountant', basicSalary: 5300, allowance: 600, hireDate: '2021-10-18', status: 'Active' },
  { id: 'E1008', first: 'Aisha', last: 'Khan', email: 'aisha.khan@company.com', phone: '+1 555-0108', department: 'Human Resources', position: 'HR Specialist', basicSalary: 5100, allowance: 650, hireDate: '2021-03-22', status: 'Active' },
  { id: 'E1009', first: 'Lucas', last: 'Martins', email: 'lucas.m@company.com', phone: '+1 555-0109', department: 'Human Resources', position: 'Recruiter', basicSalary: 4400, allowance: 400, hireDate: '2023-01-09', status: 'Active' },
  { id: 'E1010', first: 'Emily', last: 'Davis', email: 'emily.davis@company.com', phone: '+1 555-0110', department: 'Sales', position: 'Sales Executive', basicSalary: 5600, allowance: 1500, hireDate: '2019-09-01', status: 'Active' },
  { id: 'E1011', first: 'Rahul', last: 'Verma', email: 'rahul.verma@company.com', phone: '+1 555-0111', department: 'Sales', position: 'Sales Manager', basicSalary: 8200, allowance: 1800, hireDate: '2017-05-15', status: 'Active' },
  { id: 'E1012', first: 'Grace', last: 'Taylor', email: 'grace.taylor@company.com', phone: '+1 555-0112', department: 'Sales', position: 'Account Executive', basicSalary: 5000, allowance: 1000, hireDate: '2022-08-08', status: 'On Leave' },
];

const SEED_LEAVES = [
  { id: 'LV001', employeeId: 'E1001', type: 'Annual Leave', from: '2026-07-20', to: '2026-07-24', reason: 'Family vacation', status: 'Approved', appliedAt: '2026-07-10T09:24:00Z' },
  { id: 'LV002', employeeId: 'E1004', type: 'Sick Leave', from: '2026-07-27', to: '2026-07-28', reason: 'Medical appointment', status: 'Pending', appliedAt: '2026-07-26T14:05:00Z' },
  { id: 'LV003', employeeId: 'E1012', type: 'Annual Leave', from: '2026-08-03', to: '2026-08-07', reason: 'Trip with family', status: 'Pending', appliedAt: '2026-07-28T10:40:00Z' },
  { id: 'LV004', employeeId: 'E1007', type: 'Personal Leave', from: '2026-07-29', to: '2026-07-29', reason: 'Personal errands', status: 'Rejected', appliedAt: '2026-07-25T16:12:00Z' },
  { id: 'LV005', employeeId: 'E1002', type: 'Sick Leave', from: '2026-07-15', to: '2026-07-16', reason: 'Flu recovery', status: 'Approved', appliedAt: '2026-07-14T08:30:00Z' },
  { id: 'LV006', employeeId: 'E1006', type: 'Maternity Leave', from: '2026-08-10', to: '2026-11-10', reason: 'Maternity', status: 'Approved', appliedAt: '2026-07-05T11:00:00Z' },
  { id: 'LV007', employeeId: 'E1003', type: 'Annual Leave', from: '2026-08-17', to: '2026-08-19', reason: 'Long weekend break', status: 'Pending', appliedAt: '2026-07-29T09:15:00Z' },
];

function seedIfNeeded() {
  if (Store.read(Store.KEYS.INITIALIZED)) return;
  Store.saveEmployees(SEED_EMPLOYEES);
  Store.saveLeaves(SEED_LEAVES);
  Store.savePayroll([]);
  Store.write(Store.KEYS.INITIALIZED, true);
}

// ============ Helpers ============
function genId(prefix) {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return prefix + n;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmtMoney(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getInitials(first, last) {
  return ((first || '?')[0] + (last || '?')[0]).toUpperCase();
}

function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${hash}, 65%, 45%)`;
}

function calcLeaveDays(from, to) {
  const ms = new Date(to) - new Date(from);
  return Math.max(0, Math.round(ms / 86400000)) + 1;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
