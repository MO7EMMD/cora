// نظام حساب وتسجيل دخول بسيط يعمل بالكامل على المتصفح (localStorage).
// ملاحظة: هذا تخزين تجريبي محلي فقط لأغراض العرض، وليس بديلاً عن خادم مصادقة حقيقي.
const AUTH_STORAGE_KEY = "wc_users_db";
const AUTH_SESSION_KEY = "wc_current_user";

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)) || {};
  } catch (error) {
    return {};
  }
}

function writeUsers(users) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function signup(name, email, password) {
  const users = readUsers();
  const key = email.trim().toLowerCase();

  if (users[key]) {
    throw new Error("هذا البريد الإلكتروني مسجّل بالفعل.");
  }

  users[key] = {
    name: name.trim(),
    email: key,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString()
  };

  writeUsers(users);
  setSession(key);
  return users[key];
}

async function login(email, password) {
  const users = readUsers();
  const key = email.trim().toLowerCase();
  const user = users[key];

  if (!user) {
    throw new Error("لا يوجد حساب بهذا البريد الإلكتروني.");
  }

  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) {
    throw new Error("كلمة المرور غير صحيحة.");
  }

  setSession(key);
  return user;
}

function setSession(emailKey) {
  localStorage.setItem(AUTH_SESSION_KEY, emailKey);
}

function logout() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

function getCurrentUser() {
  const key = localStorage.getItem(AUTH_SESSION_KEY);
  if (!key) return null;

  const users = readUsers();
  return users[key] || null;
}

window.WCAuth = { signup, login, logout, getCurrentUser };
