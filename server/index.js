import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { query } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

app.use(cors({ origin: '*' }));
app.use(express.json());

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Intelligent helper to cast ANY numerical string in ANY object/array to numbers
const castValues = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(castValues);
  if (typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      const val = obj[key];
      const numericKeys = ['price', 'sale_price', 'stock', 'rating', 'sort_order', 'cost', 'amount', 'min_order_amount', 'discount_amount', 'delivery_charge', 'total', 'subtotal', 'shipping_cost', 'paid_amount', 'due_amount'];
      if (numericKeys.includes(key) && val !== null && val !== undefined) {
        newObj[key] = Number(val);
      } else if (typeof val === 'object') {
        newObj[key] = castValues(val);
      } else {
        newObj[key] = val;
      }
    }
    return newObj;
  }
  return obj;
};

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query('INSERT INTO public.users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email', [email, passwordHash, full_name]);
    const user = result.rows[0];
    const userCount = await query('SELECT count(*) FROM public.users');
    const role = parseInt(userCount.rows[0].count) === 1 ? 'admin' : 'customer';
    await query('INSERT INTO public.user_roles (public_user_id, role) VALUES ($1, $2)', [user.id, role]);
    const token = jwt.sign({ id: user.id, email: user.email, role }, JWT_SECRET);
    res.json(castValues({ user: { ...user, role }, session: { access_token: token } }));
  } catch (err) {
    res.status(500).json({ message: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await query('SELECT * FROM public.users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ message: 'Invalid credentials' });
    let role = 'customer';
    try {
      const roleResult = await query('SELECT role FROM public.user_roles WHERE public_user_id = $1 OR user_id = $1 LIMIT 1', [user.id]);
      if (roleResult.rows.length > 0) role = roleResult.rows[0].role;
    } catch (e) {}
    const token = jwt.sign({ id: user.id, email: user.email, role }, JWT_SECRET);
    res.json(castValues({ user: { id: user.id, email: user.email, role }, session: { access_token: token } }));
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

app.post('/api/storage/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const targetPath = req.body.path || req.file.filename;
  const finalFilePath = path.join(uploadsDir, targetPath);
  const finalDir = path.dirname(finalFilePath);
  
  if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });
  
  // Move file from temp name to target path if different
  if (req.file.path !== finalFilePath) {
    if (fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath);
    fs.renameSync(req.file.path, finalFilePath);
  }

  const protocol = req.protocol;
  const host = req.get('host');
  const fileUrl = `${protocol}://${host}/uploads/${targetPath.replace(/\\/g, '/')}`;
  res.json({ url: fileUrl, path: targetPath });
});

// --- Order Routes with JOIN support ---
app.get('/api/orders', async (req, res) => {
  try {
    const { id, order_number } = req.query;
    let sql = 'SELECT * FROM public.orders';
    const params = [];
    if (id) { params.push(id); sql += ' WHERE id = $1'; }
    else if (order_number) { params.push(order_number); sql += ' WHERE order_number = $1'; }
    
    sql += ' ORDER BY created_at DESC';
    const ordersResult = await query(sql, params);
    
    // Fetch items for each order
    const ordersWithItems = await Promise.all(ordersResult.rows.map(async (order) => {
      const itemsResult = await query('SELECT * FROM public.order_items WHERE order_id = $1', [order.id]);
      // Ensure date is ISO string for frontend
      return { 
        ...order, 
        created_at: new Date(order.created_at).toISOString(),
        order_items: itemsResult.rows 
      };
    }));
    
    res.json(castValues(id || order_number ? ordersWithItems[0] : ordersWithItems));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Generic CRUD ---
app.get('/api/:table', async (req, res) => {
  const { table } = req.params;
  try {
    let sql = `SELECT * FROM public.${table}`;
    const params = [];
    if (Object.keys(req.query).length > 0) {
      sql += ' WHERE ';
      const conditions = [];
      Object.keys(req.query).forEach((key, index) => {
        if (key.startsWith('_')) return;
        let dbKey = key;
        if (table === 'user_roles' && key === 'user_id') dbKey = 'public_user_id';
        let val = req.query[key];
        if (val === 'true' || val === 'false') conditions.push(`${dbKey} = ${val}`);
        else {
          params.push(val);
          conditions.push(`${dbKey} = $${params.length}`);
        }
      });
      sql += conditions.join(' AND ');
    }
    const sort = req.query._sort || (table === 'slider_slides' ? 'sort_order' : 'created_at');
    const order = req.query._order || (table === 'slider_slides' ? 'ASC' : 'DESC');
    sql += ` ORDER BY ${sort} ${order} LIMIT 200`;
    const result = await query(sql, params);
    if (table === 'site_settings' || table === 'store_settings') res.json(castValues(result.rows[0]) || {});
    else res.json(castValues(result.rows));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/:table', async (req, res) => {
  const { table } = req.params;
  const data = req.body;
  try {
    if (Array.isArray(data)) {
      const results = [];
      for (const item of data) {
        const keys = Object.keys(item);
        const vals = Object.values(item);
        const sql = `INSERT INTO public.${table} (${keys.join(',')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`;
        const result = await query(sql, vals);
        results.push(result.rows[0]);
      }
      res.json(castValues(results));
    } else {
      const keys = Object.keys(data);
      const vals = Object.values(data);
      const sql = `INSERT INTO public.${table} (${keys.join(',')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`;
      const result = await query(sql, vals);
      res.json(castValues(result.rows[0]));
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/:table', async (req, res) => {
  const { table } = req.params;
  const data = req.body;
  const { id, ...updates } = data;
  const targetId = id || req.query.id;
  try {
    const keys = Object.keys(updates);
    const vals = Object.values(updates);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(',');
    const sql = `UPDATE public.${table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
    const result = await query(sql, [...vals, targetId]);
    res.json(castValues(result.rows[0]));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/:table', async (req, res) => {
  const { table } = req.params;
  const data = req.body;
  const conflictTarget = req.headers['x-upsert-conflict'] || 'id';
  
  try {
    const items = Array.isArray(data) ? data : [data];
    const results = [];
    
    for (const item of items) {
      const keys = Object.keys(item);
      const vals = Object.values(item);
      
      const updateClause = keys
        .filter(k => k !== conflictTarget)
        .map((k, i) => `${k} = EXCLUDED.${k}`)
        .join(',');
        
      const sql = `
        INSERT INTO public.${table} (${keys.join(',')}) 
        VALUES (${keys.map((_, i) => `$${i + 1}`).join(',')}) 
        ON CONFLICT (${conflictTarget}) 
        DO UPDATE SET ${updateClause}
        RETURNING *`;
        
      const result = await query(sql, vals);
      results.push(result.rows[0]);
    }
    
    res.json(castValues(Array.isArray(data) ? results : results[0]));
  } catch (err) {
    console.error('Upsert error:', err);
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/:table', async (req, res) => {
  const { table } = req.params;
  const { id } = req.query;
  try {
    await query(`DELETE FROM public.${table} WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.use((req, res, next) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
