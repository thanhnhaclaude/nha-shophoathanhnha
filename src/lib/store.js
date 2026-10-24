// Kho dữ liệu dạng file JSON: đủ nhanh cho một shop hoa, không cần cài CSDL.
// Đặt DATA_DIR ra ngoài thư mục mã nguồn trên Hostinger để dữ liệu không mất khi deploy lại.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data'));
const SEED_DIR = path.join(__dirname, '..', '..', 'seed');
const COLLECTIONS = ['categories', 'products', 'posts', 'orders', 'messages', 'settings'];

const cache = new Map();

function file(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function init() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, 'uploads'), { recursive: true });
  for (const name of COLLECTIONS) {
    if (fs.existsSync(file(name))) continue;
    const seed = path.join(SEED_DIR, `${name}.json`);
    const initial = fs.existsSync(seed) ? fs.readFileSync(seed, 'utf8') : name === 'settings' ? '{}' : '[]';
    fs.writeFileSync(file(name), initial);
  }
}

function read(name) {
  if (!cache.has(name)) cache.set(name, JSON.parse(fs.readFileSync(file(name), 'utf8')));
  return cache.get(name);
}

// Ghi ra file tạm rồi đổi tên để không bao giờ để lại file hỏng giữa chừng.
function write(name, data) {
  const tmp = `${file(name)}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file(name));
  cache.set(name, data);
}

const all = (name) => read(name);
const find = (name, pred) => read(name).find(pred);
const byId = (name, id) => find(name, (x) => x.id === id);
const bySlug = (name, slug) => find(name, (x) => x.slug === slug);

function insert(name, item) {
  const list = read(name).slice();
  const doc = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...item };
  list.unshift(doc);
  write(name, list);
  return doc;
}

function update(name, id, patch) {
  const list = read(name).slice();
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) return null;
  list[i] = { ...list[i], ...patch, updatedAt: new Date().toISOString() };
  write(name, list);
  return list[i];
}

function remove(name, id) {
  write(name, read(name).filter((x) => x.id !== id));
}

const getSettings = () => read('settings');
const saveSettings = (patch) => write('settings', { ...read('settings'), ...patch });

module.exports = { DATA_DIR, init, all, find, byId, bySlug, insert, update, remove, getSettings, saveSettings };
