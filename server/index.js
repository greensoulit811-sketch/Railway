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

// --- Dedicated Route for Site Settings ---
app.put('/api/site_settings', async (req, res) => {
  const data = req.body;
  console.log('[DEBUG] Received site_settings update request:', JSON.stringify(data));
  try {
    // 1. Prepare data (ensure id is global)
    const item = { ...data };
    delete item.id; // Remove id from updates
    const keys = Object.keys(item);
    
    if (keys.length === 0) {
      return res.json({ message: 'No fields to update' });
    }

    // 2. Try to update existing row first
    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const updateSql = `UPDATE public.site_settings SET ${setClause}, updated_at = NOW() WHERE id = 'global' RETURNING *`;
    const updateResult = await query(updateSql, keys.map(k => item[k]));

    if (updateResult.rows.length > 0) {
      console.log('[DEBUG] site_settings row UPDATED successfully');
      return res.json(castValues(updateResult.rows[0]));
    }

    // 3. If no row updated, insert a new one
    console.log('[DEBUG] site_settings row not found, INSERTING new row');
    const allKeys = ['id', ...keys];
    const insertSql = `INSERT INTO public.site_settings (${allKeys.map(k => `"${k}"`).join(', ')}) VALUES ($1, ${keys.map((_, i) => `$${i + 2}`).join(', ')}) RETURNING *`;
    const insertResult = await query(insertSql, ['global', ...keys.map(k => item[k])]);
    
    res.json(castValues(insertResult.rows[0]));
  } catch (err) {
    console.error('[ERROR] site_settings Save Failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/store_settings', async (req, res) => {
  const data = req.body;
  try {
    const item = { ...data, id: 'global' };
    const keys = Object.keys(item).filter(k => k !== 'id');
    const existCheck = await query("SELECT id FROM public.store_settings WHERE id = 'global'");
    let result;
    if (existCheck.rows.length > 0) {
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(',');
      const sql = `UPDATE public.store_settings SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
      result = await query(sql, [...keys.map(k => item[k]), 'global']);
    } else {
      const allKeys = Object.keys(item);
      const sql = `INSERT INTO public.store_settings (${allKeys.join(',')}) VALUES (${allKeys.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`;
      result = await query(sql, allKeys.map(k => item[k]));
    }
    res.json(castValues(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    if (table === 'site_settings' || table === 'store_settings') res.json(result.rows.length > 0 ? castValues(result.rows[0]) : null);
    else res.json(castValues(result.rows));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/:table', async (req, res) => {
  const { table } = req.params;
  const data = req.body;
  
  try {
    const items = Array.isArray(data) ? data : [data];
    const results = [];

    for (const item of items) {
      const keys = Object.keys(item).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
      const values = keys.map(k => item[k]);
      
      const sql = `INSERT INTO public."${table}" (${keys.map(k => `"${k}"`).join(',')}) 
                   VALUES (${keys.map((_, i) => `$${i + 1}`).join(',')}) 
                   RETURNING *`;
      
      const result = await query(sql, values);
      results.push(result.rows[0]);
    }
    
    console.log(`[POST /api/${table}] SUCCESS: ${results.length} row(s) inserted`);
    res.json(Array.isArray(data) ? castValues(results) : castValues(results[0]));
  } catch (err) {
    console.error(`[POST /api/${table}] FAILED:`, err.message);
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
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(',');
    const sql = `UPDATE public.${table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
    const result = await query(sql, [...keys.map(k => updates[k]), targetId]);
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
      if (table === 'site_settings' || table === 'store_settings') {
        item.id = 'global';
      }
      
      const keys = Object.keys(item);
      let conflictVal = item[conflictTarget];
      
      if (table === 'site_settings') conflictVal = 'global';
      if (!conflictVal && table === 'store_settings') conflictVal = 'global';

      if (!conflictVal) throw new Error(`Missing conflict target ${conflictTarget}`);

      const existCheck = await query(`SELECT ${conflictTarget} FROM public.${table} WHERE ${conflictTarget} = $1`, [conflictVal]);
      
      if (existCheck.rows.length > 0) {
        const updates = keys.filter(k => k !== conflictTarget);
        const setClause = updates.map((k, i) => `${k} = $${i + 1}`).join(',');
        const sql = `UPDATE public.${table} SET ${setClause} WHERE ${conflictTarget} = $${updates.length + 1} RETURNING *`;
        const result = await query(sql, [...updates.map(k => item[k]), conflictVal]);
        results.push(result.rows[0]);
      } else {
        const sql = `INSERT INTO public.${table} (${keys.join(',')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`;
        const result = await query(sql, keys.map(k => item[k]));
        results.push(result.rows[0]);
      }
    }
    
    res.json(castValues(Array.isArray(data) ? results : results[0]));
  } catch (err) {
    console.error(`[UPSERT ERROR] ${table}:`, err);
    res.status(500).json({ error: err.message, table, data });
  }
});

// --- Function Routes ---
app.all('/api/functions/:name', async (req, res) => {
  const { name } = req.params;
  const authHeader = req.headers.authorization;
  
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.replace('Bearer ', '');
  
  let user;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (name === 'manage-capi-token') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    
    // Ensure table exists
    await query(`
      CREATE TABLE IF NOT EXISTS public.capi_secrets (
        id text PRIMARY KEY DEFAULT 'global',
        access_token text,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    if (req.method === 'POST') {
      const { access_token } = req.body;
      if (!access_token) return res.status(400).json({ error: 'Access token is required' });
      
      await query(`
        INSERT INTO public.capi_secrets (id, access_token, updated_at)
        VALUES ('global', $1, now())
        ON CONFLICT (id) DO UPDATE SET access_token = $1, updated_at = now()
      `, [access_token]);
      
      return res.json({ success: true, message: 'Access token saved securely' });
    }

    if (req.method === 'GET') {
      const result = await query("SELECT access_token, updated_at FROM public.capi_secrets WHERE id = 'global'");
      const row = result.rows[0];
      const hasToken = !!row?.access_token;
      
      return res.json({
        has_token: hasToken,
        updated_at: row?.updated_at || null,
        masked: hasToken ? row.access_token.substring(0, 4) + '••••••••' : null
      });
    }
  }

  if (name === 'meta-capi') {
    const { 
      event_name, 
      event_id, 
      event_source_url, 
      user_data = {}, 
      custom_data = {},
      test_mode = false 
    } = req.body;

    if (!event_name || !event_id) return res.status(400).json({ error: 'event_name and event_id are required' });

    try {
      // 1. Get settings
      const settingsResult = await query("SELECT * FROM public.site_settings WHERE id = 'global' LIMIT 1");
      const settings = settingsResult.rows[0];
      if (!settings || !settings.fb_capi_enabled) {
        return res.json({ success: true, skipped: true, reason: 'capi_disabled' });
      }

      // 2. Get access token
      const secretResult = await query("SELECT access_token FROM public.capi_secrets WHERE id = 'global' LIMIT 1");
      const accessToken = secretResult.rows[0]?.access_token;
      if (!accessToken) return res.json({ success: true, skipped: true, reason: 'token_missing' });

      const datasetId = settings.fb_capi_dataset_id || settings.fb_pixel_id;
      if (!datasetId) return res.json({ success: true, skipped: true, reason: 'dataset_id_missing' });

      const apiVersion = settings.fb_capi_api_version || 'v24.0';

      // 3. Helper for hashing
      const crypto = await import('crypto');
      const hash = (val) => crypto.createHash('sha256').update(String(val).trim().toLowerCase()).digest('hex');

      // 4. Build user data
      const hashedUserData = {
        client_user_agent: user_data.client_user_agent,
        client_ip_address: req.ip || user_data.client_ip_address,
        fbp: user_data.fbp,
        fbc: user_data.fbc
      };

      if (user_data.em) hashedUserData.em = [hash(user_data.em)];
      if (user_data.ph) hashedUserData.ph = [hash(user_data.ph)];
      if (user_data.external_id) hashedUserData.external_id = [hash(user_data.external_id)];

      // 5. Build payload
      const eventPayload = {
        event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id,
        action_source: 'website',
        event_source_url: event_source_url || `https://${req.get('host')}${req.originalUrl}`,
        user_data: hashedUserData,
        custom_data: custom_data
      };

      const requestBody = { data: [eventPayload] };
      const testEventCode = test_mode ? settings.fb_capi_test_event_code : null;
      if (testEventCode) requestBody.test_event_code = testEventCode;

      // 6. Send to Meta
      const url = `https://graph.facebook.com/${apiVersion}/${datasetId}/events?access_token=${accessToken}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      if (!response.ok) {
        console.error('[CAPI Error]', JSON.stringify(result));
        return res.json({ success: false, error: result.error?.message || 'Meta API error' });
      }

      console.log(`[CAPI Success] Event: ${event_name}, ID: ${event_id}, TestMode: ${!!testEventCode}`);
      return res.json({ success: true, events_received: result.events_received });
    } catch (err) {
      console.error('[CAPI Crash]', err);
      return res.status(500).json({ error: 'CAPI processing failed' });
    }
  }

  res.status(404).json({ error: 'Function not found' });
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
