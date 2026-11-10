import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'database');
const DB_PATH = path.join(DB_DIR, 'users.json');

// Pastikan folder database dan file users.json ada
const initDb = () => {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2), 'utf8');
};

export const getUser = (jid) => {
    initDb();
    try {
        const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        return data[jid] || null;
    } catch {
        return null;
    }
};

export const saveUser = (jid, userData) => {
    initDb();
    try {
        const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        data[jid] = userData;
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch {
        return false;
    }
};