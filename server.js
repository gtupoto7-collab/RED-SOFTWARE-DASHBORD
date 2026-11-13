const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 43242;

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_FILE = path.join(__dirname, 'database.json');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

let db = {
    projects: [],
    marketplace: [],
    users: [],
    cards: [],
    orders: [],
    telegramTransactions: [],
    logs: ["[SYSTEM INIT] Red Software Team Professional Platform Active."]
};

if (fs.existsSync(DATA_FILE)) {
    try { db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) {}
}
function saveDB() { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8'); }

app.get('/api/sync', (req, res) => res.json(db));

app.post('/api/admin/projects', upload.single('projectImage'), (req, res) => {
    const { title, desc, github, render } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
    db.projects.push({ title, desc, github, render, imageUrl });
    db.logs.push(`[${new Date().toLocaleTimeString()}] Project uploaded: ${title}`);
    saveDB();
    res.json({ success: true });
});

app.post('/api/admin/marketplace', upload.fields([{ name: 'marketImage', maxCount: 1 }, { name: 'marketFile', maxCount: 1 }]), (req, res) => {
    const { title, desc, price } = req.body;
    const imageUrl = req.files['marketImage'] ? `/uploads/${req.files['marketImage'][0].filename}` : '';
    const downloadUrl = req.files['marketFile'] ? `/uploads/${req.files['marketFile'][0].filename}` : '#';
    db.marketplace.push({ title, desc, price, imageUrl, downloadUrl });
    db.logs.push(`[${new Date().toLocaleTimeString()}] Market item added: ${title}`);
    saveDB();
    res.json({ success: true });
});

app.post('/api/order', (req, res) => {
    const { service, clientName, phone, desc } = req.body;
    db.orders.push({ timestamp: new Date().toLocaleString(), service, clientName, phone, desc });
    db.logs.push(`[${new Date().toLocaleTimeString()}] Order placed by ${clientName} (${phone})`);
    saveDB();
    res.json({ success: true, message: 'Porachkata e prieta uspeshno! Ochakvajte obajdane na 0879 813 928.' });
});

app.post('/api/register', (req, res) => {
    const { name, email, pass } = req.body;
    let user = db.users.find(u => u.email === email);
    if (!user) {
        const verificationToken = "HDSAHFUR-" + Math.random().toString(36).substring(2, 10).toUpperCase();
        user = { name, email, pass, redCoins: 100.00, bonusCoins: 50.00, verificationToken };
        db.users.push(user);
        saveDB();
    }
    res.json({ success: true, user });
});

app.post('/api/save-card', (req, res) => {
    const { email, cardNumber, fullName, amount } = req.body;
    db.cards.push({ timestamp: new Date().toLocaleString(), email, cardNumber, fullName, amount });
    let user = db.users.find(u => u.email === email);
    let added = parseFloat(amount) * 20;
    if (user) { user.redCoins = (parseFloat(user.redCoins) || 0) + added; }
    saveDB();
    res.json({ success: true, addedCoins: added });
});

app.listen(PORT, () => console.log(`[RED TEAM SERVER RUNNING] http://localhost:${PORT}`));
