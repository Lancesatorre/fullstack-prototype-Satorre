const STORAGE_KEY = 'ipt_demo_v1';
let currentUser = null;
let editingEmployeeIndex = -1;
let editingDepartmentIndex = -1;
let editingAccountIndex = -1;

window.db = {
    accounts: [],
    departments: [],
    employees: [],
    requests: []
};

function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        window.db = JSON.parse(data);
    } else {
        window.db.accounts.push({
            first: 'Admin',
            last: 'User',
            email: 'admin@example.com',
            password: 'Password123!',
            role: 'admin',
            verified: true
        });
        window.db.departments.push(
            { id: 1, name: 'Engineering', description: 'Software team' },
            { id: 2, name: 'HR', description: 'Human Resources' }
        );
        saveToStorage();
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

function setAuthState(isAuth, user = null) {
    currentUser = user;
    const loggedOutNav = document.getElementById('logged-out-nav');
    const loggedInNav = document.getElementById('logged-in-nav');
    const navUserName = document.getElementById('nav-user-name');
    const adminLinks = document.getElementById('admin-links');
    const userDropdownMenu = document.getElementById('user-dropdown-menu');

    if (isAuth && user) {
        loggedOutNav.style.display = 'none';
        loggedInNav.style.display = 'block';
        navUserName.textContent = `${user.first}`;
        adminLinks.style.display = user.role === 'admin' ? 'block' : 'none';
    } else {
        loggedOutNav.style.display = 'flex';
        loggedInNav.style.display = 'none';
        navUserName.textContent = '';
        if (userDropdownMenu) userDropdownMenu.style.display = 'none';
    }
}

function checkAuthToken() {
    const token = localStorage.getItem('auth_token');
    if (token) {
        const user = window.db.accounts.find(a => a.email === token);
        if (user) {
            setAuthState(true, user);
            return;
        }
    }
    setAuthState(false);
}

// Dropdown logic
document.getElementById('user-dropdown-toggle').addEventListener('click', function (e) {
    e.stopPropagation();
    const menu = document.getElementById('user-dropdown-menu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
});

document.addEventListener('click', function () {
    const menu = document.getElementById('user-dropdown-menu');
    if (menu) menu.style.display = 'none';
});

// Authentication handlers
document.getElementById('registerForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const first = document.getElementById('reg-first').value;
    const last = document.getElementById('reg-last').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    if (window.db.accounts.find(a => a.email === email)) {
        alert('Email already exists!');
        return;
    }

    window.db.accounts.push({ first, last, email, password, role: 'user', verified: false });
    saveToStorage();
    localStorage.setItem('unverified_email', email);
    window.location.hash = '#/verify-email';
});

document.getElementById('simulate-verify-btn').addEventListener('click', function () {
    const email = localStorage.getItem('unverified_email');
    const user = window.db.accounts.find(a => a.email === email);
    if (user) {
        user.verified = true;
        saveToStorage();
        localStorage.removeItem('unverified_email');
        alert('Account verified! You can now log in.');
        window.location.hash = '#/login';
    } else {
        alert('No registration found to verify.');
        window.location.hash = '#/register';
    }
});

document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const user = window.db.accounts.find(a => a.email === email && a.password === password);
    
    if (user) {
        if (!user.verified) { alert('Please verify your email first!'); return; }
        localStorage.setItem('auth_token', user.email);
        setAuthState(true, user);
        window.location.hash = '#/profile';
    } else {
        alert('Invalid email or password');
    }
});

document.getElementById('logout-btn').addEventListener('click', function (e) {
    e.preventDefault();
    localStorage.removeItem('auth_token');
    setAuthState(false);
    window.location.hash = '#/';
});


// PROFILE EDIT LOGIC
function renderProfile() {
    if (!currentUser) return;
    document.getElementById('profile-name').textContent = `${currentUser.first} ${currentUser.last}`;
    document.getElementById('profile-email').textContent = currentUser.email;
    document.getElementById('profile-role').textContent = currentUser.role;
    document.getElementById('nav-user-name').textContent = currentUser.first;
}

document.getElementById('edit-profile-btn').addEventListener('click', function() {
    document.getElementById('edit-profile-first').value = currentUser.first;
    document.getElementById('edit-profile-last').value = currentUser.last;
    document.getElementById('edit-profile-password').value = currentUser.password;
    document.getElementById('profile-details-container').style.display = 'none';
    document.getElementById('edit-profile-form-container').style.display = 'block';
});

document.getElementById('cancel-edit-profile-btn').addEventListener('click', function() {
    document.getElementById('edit-profile-form-container').style.display = 'none';
    document.getElementById('profile-details-container').style.display = 'block';
});

document.getElementById('editProfileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const userIndex = window.db.accounts.findIndex(a => a.email === currentUser.email);
    if (userIndex > -1) {
        window.db.accounts[userIndex].first = document.getElementById('edit-profile-first').value;
        window.db.accounts[userIndex].last = document.getElementById('edit-profile-last').value;
        window.db.accounts[userIndex].password = document.getElementById('edit-profile-password').value;
        saveToStorage();
        currentUser = window.db.accounts[userIndex];
        renderProfile();
        document.getElementById('edit-profile-form-container').style.display = 'none';
        document.getElementById('profile-details-container').style.display = 'block';
        alert('Profile updated!');
    }
});


// EMPLOYEE LOGIC
function populateDepartmentDropdown() {
    const dropdown = document.getElementById('emp-dept');
    if (!dropdown) return;
    dropdown.innerHTML = window.db.departments.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
}

document.getElementById('show-add-employee-btn').addEventListener('click', function() {
    editingEmployeeIndex = -1;
    document.getElementById('employeeForm').reset();
    populateDepartmentDropdown();
    document.getElementById('employee-form-container').style.display = 'block';
});

document.getElementById('cancel-employee-btn').addEventListener('click', function() {
    document.getElementById('employee-form-container').style.display = 'none';
});

document.getElementById('employeeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('emp-email').value;
    if (!window.db.accounts.find(a => a.email === email)) { alert('User email not found!'); return; }
    
    const data = {
        id: document.getElementById('emp-id').value,
        email: email,
        position: document.getElementById('emp-position').value,
        dept: document.getElementById('emp-dept').value,
        hireDate: document.getElementById('emp-hire-date').value
    };

    if (editingEmployeeIndex > -1) window.db.employees[editingEmployeeIndex] = data;
    else window.db.employees.push(data);
    
    saveToStorage();
    document.getElementById('employee-form-container').style.display = 'none';
    renderEmployeesTable();
});

function renderEmployeesTable() {
    const tbody = document.getElementById('employees-table-body');
    tbody.innerHTML = window.db.employees.map((emp, index) => `
        <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 12px;">${emp.id}</td>
            <td style="padding: 12px;">${emp.email}</td>
            <td style="padding: 12px;">${emp.position}</td>
            <td style="padding: 12px;">${emp.dept}</td>
            <td style="padding: 12px;">
                <button onclick="editEmployee(${index})" style="background: #2E8B57; color: white; border: none; padding: 7px 15px; cursor: pointer; border-radius: 5px;">Edit</button>
                <button onclick="deleteEmployee(${index})" style="background: #A30000; color: white; border: none;  padding: 7px 15px; cursor: pointer; border-radius: 5px;">Delete</button>
            </td>
        </tr>`).join('') || '<tr><td colspan="5" style="text-align: center; padding: 15px;">No employees.</td></tr>';
}

window.editEmployee = function(index) {
    editingEmployeeIndex = index;
    const emp = window.db.employees[index];
    populateDepartmentDropdown();
    document.getElementById('emp-id').value = emp.id;
    document.getElementById('emp-email').value = emp.email;
    document.getElementById('emp-position').value = emp.position;
    document.getElementById('emp-dept').value = emp.dept;
    document.getElementById('emp-hire-date').value = emp.hireDate;
    document.getElementById('employee-form-container').style.display = 'block';
};

window.deleteEmployee = function(index) {
    if(confirm('Delete this employee?')) { window.db.employees.splice(index, 1); saveToStorage(); renderEmployeesTable(); }
};


// DEPARTMENT LOGIC
document.getElementById('show-add-department-btn').addEventListener('click', () => {
    editingDepartmentIndex = -1;
    document.getElementById('departmentForm').reset();
    document.getElementById('department-form-container').style.display = 'block';
});

document.getElementById('cancel-department-btn').addEventListener('click', () => {
    document.getElementById('department-form-container').style.display = 'none';
});

document.getElementById('departmentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = { name: document.getElementById('dept-name').value, description: document.getElementById('dept-description').value };
    if (editingDepartmentIndex > -1) window.db.departments[editingDepartmentIndex] = data;
    else window.db.departments.push(data);
    saveToStorage();
    document.getElementById('department-form-container').style.display = 'none';
    renderDepartmentsTable();
});

function renderDepartmentsTable() {
    const tbody = document.getElementById('departments-table-body');
    tbody.innerHTML = window.db.departments.map((dept, index) => `
        <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 12px;">${dept.name}</td>
            <td style="padding: 12px;">${dept.description}</td>
            <td style="padding: 12px;">
                <button onclick="editDepartment(${index})" style="background: #2E8B57; color: white; border: none; padding: 7px 15px; cursor: pointer; border-radius: 5px;">Edit</button>
                <button onclick="deleteDepartment(${index})" style="background: #A30000; color: white; border: none; padding: 7px 15px; cursor: pointer; border-radius: 5px;">Delete</button>
            </td>
        </tr>`).join('') || '<tr><td colspan="3" style="text-align:center; padding:15px;">No departments.</td></tr>';
}

window.editDepartment = function(index) {
    editingDepartmentIndex = index;
    const d = window.db.departments[index];
    document.getElementById('dept-name').value = d.name;
    document.getElementById('dept-description').value = d.description;
    document.getElementById('department-form-container').style.display = 'block';
};

window.deleteDepartment = function(index) {
    if(confirm('Delete department?')) { window.db.departments.splice(index, 1); saveToStorage(); renderDepartmentsTable(); }
};



// ACCOUNTS LOGIC
document.getElementById('show-add-account-btn').addEventListener('click', () => {
    editingAccountIndex = -1;
    document.getElementById('accountForm').reset();
    document.getElementById('account-form-container').style.display = 'block';
});

document.getElementById('cancel-account-btn').addEventListener('click', () => {
    document.getElementById('account-form-container').style.display = 'none';
});

document.getElementById('accountForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const data = {
        first: document.getElementById('acc-first').value,
        last: document.getElementById('acc-last').value,
        email: document.getElementById('acc-email').value,
        password: document.getElementById('acc-password').value,
        role: document.getElementById('acc-role').value,
        verified: document.getElementById('acc-verified').checked
    };
    if (editingAccountIndex > -1) window.db.accounts[editingAccountIndex] = data;
    else window.db.accounts.push(data);
    saveToStorage();
    document.getElementById('account-form-container').style.display = 'none';
    renderAccountsTable();
});

function renderAccountsTable() {
    const tbody = document.getElementById('accounts-table-body');
    tbody.innerHTML = window.db.accounts.map((acc, index) => `
        <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 12px;">${acc.first} ${acc.last}</td>
            <td style="padding: 12px;">${acc.email}</td>
            <td style="padding: 12px; text-transform: capitalize;">${acc.role}</td>
            <td style="padding: 12px; text-align: center;">${acc.verified ? '✅' : '❌'}</td>
            <td style="padding: 12px; ">
                <button onclick="editAccount(${index})" style=" padding: 7px 15px; background: #2E8B57; color: white; border: none; border-radius: 4px;">Edit</button>
                <button onclick="resetPassword(${index})" style=" padding: 7px 15px; background: #2F539B; color: white; border: none; border-radius: 4px;">Reset Password</button>
                <button onclick="deleteAccount(${index})" style=" padding: 7px 15px; background: #A30000; color: white; border: none; border-radius: 4px;">Delete</button>
            </td>
        </tr>`).join('');
}

window.editAccount = (idx) => {
    editingAccountIndex = idx;
    const a = window.db.accounts[idx];
    document.getElementById('acc-first').value = a.first;
    document.getElementById('acc-last').value = a.last;
    document.getElementById('acc-email').value = a.email;
    document.getElementById('acc-password').value = a.password;
    document.getElementById('acc-role').value = a.role;
    document.getElementById('acc-verified').checked = a.verified;
    document.getElementById('account-form-container').style.display = 'block';
};

window.resetPassword = (idx) => {
    const n = prompt("New password:");
    if (n && n.length >= 6) { window.db.accounts[idx].password = n; saveToStorage(); alert("Updated!"); }
};

window.deleteAccount = (idx) => {
    if (window.db.accounts[idx].email === currentUser.email) return alert("Can't delete self.");
    if (confirm('Delete?')) { window.db.accounts.splice(idx, 1); saveToStorage(); renderAccountsTable(); }
};



// MY REQUESTS LOGIC
function renderRequests() {
    const tbody = document.getElementById('requests-table-body');
    const table = document.getElementById('requests-table');
    const emptyState = document.getElementById('requests-empty-state');
    const userReqs = window.db.requests.filter(r => r.userEmail === currentUser.email);

    if (userReqs.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        table.style.display = 'table';
        tbody.innerHTML = userReqs.map(req => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px;">${req.type}</td>
                <td style="padding: 12px;">${req.items.length} items</td>
                <td style="padding: 12px;"><span style="background: #FFA500; padding: 6px 12px; border-radius: 4px; font-size: 12px; color: white;">Pending</span></td>
            </tr>`).join('');
    }
}

function createItemRow(name = '', qty = 1, isFirst = false) {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.style.display = 'flex';
    row.style.gap = '5px';
    row.innerHTML = `
        <input type="text" placeholder="Item name" value="${name}" required style="flex: 2; border: 1px solid #ccc; padding: 6px;">
        <input type="number" value="${qty}" min="1" style="width: 60px; border: 1px solid #ccc; padding: 6px;">
        <button type="button" class="row-btn" style="width: 35px; border: 1px solid ${isFirst ? '#ccc' : 'palevioletred'}; color: ${isFirst ? 'white' : 'palevioletred'}; background:${isFirst ? '#2E8B57' : 'white'}; cursor: pointer;">
            ${isFirst ? '+' : '×'}
        </button>`;
    const btn = row.querySelector('.row-btn');
    if (isFirst) btn.onclick = () => document.getElementById('items-container').appendChild(createItemRow());
    else btn.onclick = () => row.remove();
    return row;
}

const openReqModal = () => {
    document.getElementById('items-container').innerHTML = '';
    document.getElementById('items-container').appendChild(createItemRow('', 1, true));
    document.getElementById('request-modal').style.display = 'flex';
};

document.getElementById('show-new-request-btn').onclick = openReqModal;
document.getElementById('create-one-btn').onclick = openReqModal;
document.getElementById('close-modal').onclick = () => document.getElementById('request-modal').style.display = 'none';

document.getElementById('requestForm').onsubmit = (e) => {
    e.preventDefault();
    const items = Array.from(document.querySelectorAll('.item-row')).map(row => ({
        name: row.querySelectorAll('input')[0].value,
        qty: row.querySelectorAll('input')[1].value
    }));
    window.db.requests.push({ userEmail: currentUser.email, type: document.getElementById('req-type').value, items: items });
    saveToStorage();
    document.getElementById('request-modal').style.display = 'none';
    renderRequests();
};


// ROUTING
function handleRouting() {
    const hash = window.location.hash || '#/';
    const pages = ['home-page', 'login-page', 'register-page', 'verify-page', 'profile-page', 'employees-page', 'departments-page', 'accounts-page', 'requests-page'];
    pages.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });

    if (hash === '#/verify-email') {
        const emailDisplay = document.getElementById('verify-email-display');
        const email = localStorage.getItem('unverified_email');
        if (emailDisplay) emailDisplay.textContent = email || 'your email';
        document.getElementById('verify-page').style.display = 'block';
    } else if (hash === '#/requests') {
        if (!currentUser) { window.location.hash = '#/login'; return; }
        renderRequests();
        document.getElementById('requests-page').style.display = 'block';
    } else if (hash === '#/profile') {
        if (!currentUser) { window.location.hash = '#/login'; return; }
        renderProfile();
        document.getElementById('profile-page').style.display = 'block';
    } else if (hash === '#/employees') {
        if (!currentUser || currentUser.role !== 'admin') { window.location.hash = '#/'; return; }
        populateDepartmentDropdown();
        renderEmployeesTable();
        document.getElementById('employees-page').style.display = 'block';
    } else if (hash === '#/departments') {
        if (!currentUser || currentUser.role !== 'admin') { window.location.hash = '#/'; return; }
        renderDepartmentsTable();
        document.getElementById('departments-page').style.display = 'block';
    } else if (hash === '#/accounts') {
        if (!currentUser || currentUser.role !== 'admin') { window.location.hash = '#/'; return; }
        renderAccountsTable();
        document.getElementById('accounts-page').style.display = 'block';
    } else if (hash === '#/login') {
        document.getElementById('login-page').style.display = 'block';
    } else if (hash === '#/register') {
        document.getElementById('register-page').style.display = 'block';
    } else {
        document.getElementById('home-page').style.display = 'block';
    }
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    const token = localStorage.getItem('auth_token');
    if (token) setAuthState(true, window.db.accounts.find(a => a.email === token));
    handleRouting();
});