require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JSONFilePreset } = require('lowdb/node');
const { auth, optionalAuth, SECRET } = require('./middleware/auth'); // ← путь исправлен

const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json());

// Раздаём статику из корня проекта (там лежат index.html и profile.html)
app.use(express.static(path.join(__dirname, '../')));

let db;

async function start() {
  db = await JSONFilePreset(path.join(__dirname, 'db.json'), { users: [], products: [], favorites: [] });

  //Аутх
  app.post('/api/register', async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Заполните имя, email и пароль' });
    }
    if (db.data.users.find(u => u.email === email)) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = { id: Date.now(), email, name, password: hashed, city: '', createdAt: new Date().toISOString() };
    db.data.users.push(user);
    await db.write();
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  });

  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = db.data.users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  });

  app.get('/api/me', auth, (req, res) => {
    const user = db.data.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  //Товары
  app.get('/api/products', (req, res) => {
    let items = [...db.data.products];
    const { category, priceFrom, priceTo, condition, city, search, sort, page = 1, limit = 8 } = req.query;

    if (category && category !== 'all') items = items.filter(p => p.category === category);
    if (priceFrom) items = items.filter(p => p.price >= Number(priceFrom));
    if (priceTo) items = items.filter(p => p.price <= Number(priceTo));
    if (condition) {
      const allowed = condition.split(',');
      items = items.filter(p => allowed.includes(p.condition));
    }
    if (city && city !== 'all') items = items.filter(p => p.location === city);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(p => p.title.toLowerCase().includes(q));
    }

    if (sort === 'cheap') items.sort((a, b) => a.price - b.price);
    else if (sort === 'expensive') items.sort((a, b) => b.price - a.price);
    else items.sort((a, b) => b.id - a.id);

    const total = items.length;
    const start = (Number(page) - 1) * Number(limit);
    const pageItems = items.slice(start, start + Number(limit));

    res.json({ items: pageItems, total, page: Number(page), hasMore: start + pageItems.length < total });
  });

  app.get('/api/products/:id', (req, res) => {
    const product = db.data.products.find(p => p.id === Number(req.params.id));
    if (!product) return res.status(404).json({ error: 'Объявление не найдено' });
    res.json(product);
  });

  app.post('/api/products', auth, async (req, res) => {
    const { title, price, category, condition, location, description, image } = req.body;
    if (!title || !price || !category || !condition || !location) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }
    const product = {
      id: Date.now(),
      title, price: Number(price), category, condition, location,
      description: description || '', image: image || '📦',
      sellerId: req.user.id,
      createdAt: new Date().toISOString()
    };
    db.data.products.push(product);
    await db.write();
    res.status(201).json(product);
  });

  app.put('/api/products/:id', auth, async (req, res) => {
    const product = db.data.products.find(p => p.id === Number(req.params.id));
    if (!product) return res.status(404).json({ error: 'Объявление не найдено' });
    if (product.sellerId !== req.user.id) return res.status(403).json({ error: 'Нет доступа к этому объявлению' });
    Object.assign(product, req.body, { id: product.id, sellerId: product.sellerId });
    await db.write();
    res.json(product);
  });

  app.delete('/api/products/:id', auth, async (req, res) => {
    const product = db.data.products.find(p => p.id === Number(req.params.id));
    if (!product) return res.status(404).json({ error: 'Объявление не найдено' });
    if (product.sellerId !== req.user.id) return res.status(403).json({ error: 'Нет доступа к этому объявлению' });
    db.data.products = db.data.products.filter(p => p.id !== product.id);
    await db.write();
    res.json({ success: true });
  });

  app.get('/api/my-products', auth, (req, res) => {
    const items = db.data.products.filter(p => p.sellerId === req.user.id);
    res.json(items);
  });

  //Товары в избранном
  app.get('/api/favorites', auth, (req, res) => {
    const favIds = db.data.favorites.filter(f => f.userId === req.user.id).map(f => f.productId);
    const items = db.data.products.filter(p => favIds.includes(p.id));
    res.json(items);
  });

  app.post('/api/favorites/:productId', auth, async (req, res) => {
    const productId = Number(req.params.productId);
    const exists = db.data.favorites.find(f => f.userId === req.user.id && f.productId === productId);
    if (!exists) {
      db.data.favorites.push({ userId: req.user.id, productId });
      await db.write();
    }
    res.json({ favorite: true });
  });

  app.delete('/api/favorites/:productId', auth, async (req, res) => {
    const productId = Number(req.params.productId);
    db.data.favorites = db.data.favorites.filter(f => !(f.userId === req.user.id && f.productId === productId));
    await db.write();
    res.json({ favorite: false });
  });

  // Все остальные запросы скидываю на index.html чтобы работала навигация по ссылкам
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
  });

  app.listen(PORT, () => console.log(`Сервер запущен на: http://localhost:${PORT}`));
}

start();