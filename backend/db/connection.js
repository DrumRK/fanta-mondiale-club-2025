import pg from 'pg';
const { Pool } = pg;

let pool = null;

// Parse the DATABASE_URL manually to ensure proper formatting
function parseConnectionString(connectionString) {
  try {
    const url = new URL(connectionString);
    
    return {
      user: url.username,
      password: url.password,
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading '/'
      ssl: url.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : false
    };
  } catch (error) {
    console.error('❌ Error parsing connection string:', error);
    throw error;
  }
}

// Initialize pool lazily
function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    console.log('🔗 Initializing PostgreSQL connection pool...');
    
    try {
      const poolConfig = parseConnectionString(process.env.DATABASE_URL);
      
      // Add additional pool settings
      poolConfig.max = 20;
      poolConfig.idleTimeoutMillis = 30000;
      poolConfig.connectionTimeoutMillis = 2000;
      
      console.log('📊 Connection config:', {
        host: poolConfig.host,
        port: poolConfig.port,
        database: poolConfig.database,
        user: poolConfig.user,
        ssl: !!poolConfig.ssl
      });
      
      pool = new Pool(poolConfig);

      // Set up event handlers
      pool.on('connect', (client) => {
        console.log('✅ New client connected to PostgreSQL database');
      });

      pool.on('error', (err) => {
        console.error('❌ Database connection error:', err.message);
      });

      console.log('✅ PostgreSQL pool initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize database pool:', error);
      throw error;
    }
  }
  
  return pool;
}

// Helper function to execute queries
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const pool = getPool();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed', { 
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''), 
      duration: `${duration}ms`, 
      rows: res.rowCount 
    });
    return res;
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    console.error('📝 Query was:', text.substring(0, 100));
    throw error;
  }
};

// Helper function to get a client for transactions
export const getClient = async () => {
  const pool = getPool();
  return await pool.connect();
};

// Helper function to test connection
export const testConnection = async () => {
  try {
    const pool = getPool();
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    client.release();
    return result.rows[0];
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    throw error;
  }
};

// Export the lazy getter for the pool
export default {
  get pool() {
    return getPool();
  },
  query,
  getClient,
  testConnection
};