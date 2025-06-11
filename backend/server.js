import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file with explicit path
const envPath = join(__dirname, '.env');
console.log("🔍 Looking for .env file at:", envPath);

// Try multiple ways to load environment variables
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("❌ Error loading .env file:", result.error);
  // Try loading from current directory
  dotenv.config();
} else {
  console.log("✅ .env file loaded successfully");
}

// Force load specific variables if they're missing
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://fanta-mondiale_owner:npg_Cf5wFEPTsG7O@ep-twilight-bonus-a828wmjv-pooler.eastus2.azure.neon.tech/fanta-mondiale?sslmode=require";
}

if (!process.env.RAPID_API_KEY) {
  process.env.RAPID_API_KEY = "ea94cfdf4bmshf69bdb973c12389p1c0c6fjsn29f022cc6533";
}

// Debug: Check if env vars are loaded
console.log("🔍 Environment check:");
console.log("🔑 API Key loaded:", process.env.RAPID_API_KEY ? "✅ Yes" : "❌ No");
console.log("🔑 API Key first 10 chars:", process.env.RAPID_API_KEY ? process.env.RAPID_API_KEY.substring(0, 10) + "..." : "undefined");
console.log("🗄️ Database URL loaded:", process.env.DATABASE_URL ? "✅ Yes" : "❌ No");
console.log("🗄️ Database URL first 20 chars:", process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + "..." : "undefined");

// Now import other modules
import express from "express";
import cors from "cors";

// Import routes
import classificaRouter from "./routes/classifica.js";
import incontriRouter from "./routes/incontri.js";
import calendarioRouter from "./routes/calendario.js";
import squadreRouter from "./routes/squadre.js";
import adminRouter from "./routes/admin.js";

// Import services
import { Scheduler } from "./services/scheduler.js";
import ConfigService from "./services/configService.js";
import db from "./db/connection.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"], // Vite dev server
  credentials: true
}));
app.use(express.json());

// Initialize database connection
async function initializeDatabase() {
  try {
    console.log("🔌 Testing database connection...");
    console.log("🔗 Using connection string:", process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + "..." : "undefined");
    
    // Test the connection using the lazy-loaded connection
    const result = await db.testConnection();
    console.log("🕐 Database time:", result.current_time);
    console.log("🗄️ Database version:", result.db_version.substring(0, 50) + "...");
    
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("💡 Full error:", error);
    console.error("💡 Make sure your DATABASE_URL is correct in .env file");
    return false;
  }
}

// Routes
app.use("/api/classifica", classificaRouter);
app.use("/api/incontri", incontriRouter);
app.use("/api/calendario", calendarioRouter);
app.use("/api/squadre", squadreRouter);
app.use("/api/admin", adminRouter);

// Health check
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    const result = await db.testConnection();
    
    res.json({ 
      status: "OK", 
      message: "Backend is running with PostgreSQL",
      database: "connected",
      serverTime: result.current_time,
      scheduler: Scheduler.getStatus(),
      environment: {
        hasApiKey: !!process.env.RAPID_API_KEY,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed", 
      error: error.message,
      environment: {
        hasApiKey: !!process.env.RAPID_API_KEY,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
      }
    });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  Scheduler.stop();
  if (db.pool) {
    db.pool.end(() => {
      console.log('🗄️ Database pool closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  Scheduler.stop();
  if (db.pool) {
    db.pool.end(() => {
      console.log('🗄️ Database pool closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Start server
async function startServer() {
  console.log("🚀 Starting Fanta Mondiale Backend...");
  
  // Validate configuration first
  try {
    ConfigService.validateConfig();
  } catch (error) {
    console.error("❌ Configuration validation failed:", error.message);
    process.exit(1);
  }
  
  // Initialize database
  const dbConnected = await initializeDatabase();
  
  if (!dbConnected) {
    console.error("❌ Cannot start server without database connection");
    console.log("🔧 Trying to continue anyway for debugging...");
  }
  
  // Start scheduler only if database is connected
  if (dbConnected) {
    try {
      Scheduler.start();
      console.log("✅ Scheduler started successfully");
    } catch (error) {
      console.error("⚠️ Scheduler failed to start:", error.message);
      console.log("📝 Server will continue without scheduler");
    }
  }
  
  // Start HTTP server
  app.listen(PORT, () => {
    console.log(`\n🎉 Server ready!`);
    console.log(`✅ Backend running on http://localhost:${PORT}`);
    console.log(`🗄️ Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
    console.log(`⏰ Scheduler: ${Scheduler.getStatus().isRunning ? 'Running' : 'Stopped'}`);
    console.log(`\n📊 API endpoints:`);
    console.log(`   - GET  /api/health`);
    console.log(`   - GET  /api/classifica`);
    console.log(`   - GET  /api/squadre`);
    console.log(`   - GET  /api/admin/status`);
    console.log(`   - POST /api/admin/update-matches`);
    console.log(`\n🔧 Test health: http://localhost:${PORT}/api/health\n`);
  });
}

// Start the server
startServer().catch(error => {
  console.error("❌ Failed to start server:", error);
  console.log("🔧 Trying to start anyway...");
});