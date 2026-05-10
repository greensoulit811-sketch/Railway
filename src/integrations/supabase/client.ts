// This file mocks the Supabase client to talk to our custom Node.js server
// This allows the rest of the app to work without major refactoring.

// For Vercel deployment: Set VITE_API_URL in Vercel environment variables
// Example: https://your-backend.up.railway.app/api
const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api');

// Global helper to ensure numbers are numbers (fixes toFixed errors)
const autoCast = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(autoCast);
  if (typeof obj === 'object') {
    const newObj = { ...obj };
    const numericFields = [
      'price', 'sale_price', 'cost', 'amount', 'total', 'subtotal', 
      'delivery_charge', 'discount', 'rating', 'stock', 'shipping_cost', 
      'paid_amount', 'due_amount', 'base_rate', 'fixed_partial_amount',
      'advance_amount', 'due_on_delivery', 'unit_price', 'line_total'
    ];
    for (const key in newObj) {
      if (numericFields.includes(key) && newObj[key] !== null) {
        const num = Number(newObj[key]);
        if (!isNaN(num)) newObj[key] = num;
      } else if (typeof newObj[key] === 'object') {
        newObj[key] = autoCast(newObj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

class SupabaseQueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = {};
    this.ordering = null;
    this.singleMode = false;
    this.method = 'GET';
    this.body = null;
  }

  select(columns = '*') {
    if (this.method === 'GET' || !this.method) this.method = 'GET';
    return this;
  }

  insert(data) {
    this.method = 'POST';
    this.body = data;
    return this;
  }

  update(data) {
    this.method = 'PATCH';
    this.body = data;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  upsert(data, options = {}) {
    this.method = 'PUT';
    this.body = data;
    this.upsertOptions = options;
    return this;
  }

  eq(column, value) {
    this.filters[column] = value;
    return this;
  }

  neq(column, value) {
    this.filters[`${column}_neq`] = value;
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.ordering = { column, ascending };
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  maybeSingle() {
    this.singleMode = true;
    return this;
  }

  single() {
    this.singleMode = true;
    return this;
  }

  async execute() {
    try {
      const queryParams = new URLSearchParams(this.filters);
      if (this.ordering) {
        queryParams.append('_sort', this.ordering.column);
        queryParams.append('_order', this.ordering.ascending ? 'ASC' : 'DESC');
      }

      const url = `${API_URL}/${this.table}${this.filters && Object.keys(this.filters).length > 0 ? '?' + queryParams.toString() : ''}`;
      const options = {
        method: this.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      };

      if (this.body) options.body = JSON.stringify(this.body);
      if (this.method === 'PUT' && this.upsertOptions) {
        options.headers['X-Upsert-Conflict'] = this.upsertOptions.onConflict || 'id';
      }

      const response = await fetch(url, options);
      const rawData = await response.json();
      
      let data = autoCast(rawData);
      if (this.singleMode && Array.isArray(data)) {
        data = data.length > 0 ? data[0] : null;
      }
      return { data, error: null };
    } catch (error) {
      console.error(`[API Error] ${this.table}:`, error);
      return { data: null, error };
    }
  }

  then(onfulfilled) {
    return this.execute().then(onfulfilled);
  }
}

export const supabase = {
  from: (table) => new SupabaseQueryBuilder(table),
  auth: {
    getSession: async () => {
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('auth_user') || 'null');
      if (token && user) return { data: { session: { access_token: token, user } }, error: null };
      return { data: { session: null }, error: null };
    },
    onAuthStateChange: (callback) => {
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('auth_user') || 'null');
      if (token && user) callback('SIGNED_IN', { access_token: token, user });
      else callback('SIGNED_OUT', null);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signInWithPassword: async ({ email, password }) => {
      try {
        const res = await fetch(`${API_URL.replace('/api', '')}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('auth_token', data.session.access_token);
          localStorage.setItem('auth_user', JSON.stringify(data.user));
          return { data, error: null };
        }
        return { data: null, error: new Error(data.message || 'Login failed') };
      } catch (error) {
        return { data: null, error };
      }
    },
    signUp: async ({ email, password }) => {
      try {
        const res = await fetch(`${API_URL.replace('/api', '')}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, full_name: email.split('@')[0] })
        });
        const data = await res.json();
        if (res.ok) return { data, error: null };
        return { data: null, error: new Error(data.message || 'Registration failed') };
      } catch (error) {
        return { data: null, error };
      }
    },
    signOut: async () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      return { error: null };
    }
  },
  storage: {
    from: (bucket) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
        return {
          getPublicUrl: (path) => ({
            data: { publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}` }
          }),
          upload: async (path, file) => {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${supabaseKey}` },
              body: formData
            });
            const data = await res.json();
            if (res.ok) return { data: { path: data.Key }, error: null };
            return { data: null, error: new Error(data.error || 'Upload failed') };
          }
        };
      }

      return {
        getPublicUrl: (path) => {
          if (!path) return { data: { publicUrl: '' } };
          if (path.startsWith('http')) return { data: { publicUrl: path } };
          
          // Remove leading slash if present
          let cleanPath = path.startsWith('/') ? path.substring(1) : path;
          
          // If the path already includes 'uploads/', don't add it again
          const prefix = cleanPath.startsWith('uploads/') ? '' : 'uploads/';
          const baseUrl = API_URL.replace('/api', '');
          
          return { data: { publicUrl: `${baseUrl}/${prefix}${cleanPath}` } };
        },
        upload: async (path, file) => {
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', path);
            const res = await fetch(`${API_URL.replace('/api', '')}/api/storage/upload`, {
              method: 'POST',
              body: formData
            });
            const data = await res.json();
            if (res.ok) return { data: { path: data.path }, error: null };
            return { data: null, error: new Error('Upload failed') };
          } catch (error) {
            return { data: null, error };
          }
        }
      };
    }
  },
  functions: {
    invoke: async (name, options = {}) => {
      try {
        const res = await fetch(`${API_URL}/functions/${name}`, {
          method: options.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            ...options.headers
          },
          body: options.body ? JSON.stringify(options.body) : undefined
        });
        const data = await res.json();
        if (res.ok) return { data, error: null };
        return { data: null, error: new Error(data.error || 'Function execution failed') };
      } catch (error) {
        return { data: null, error };
      }
    }
  }
};