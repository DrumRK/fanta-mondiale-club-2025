import express from "express";
import cors from "cors";
import classificaRouter from "./routes/classifica.js";
import incontriRouter from "./routes/incontri.js";
import calendarioRouter from "./routes/calendario.js";
import squadreRouter from "./routes/squadre.js";

const app = express();
const PORT = 3001;

console.log("🚀 Starting server...");

// Middleware
app.use(cors({
  origin: "http://localhost:5173", // Vite dev server
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/classifica", classificaRouter);
app.use("/api/incontri", incontriRouter);
app.use("/api/calendario", calendarioRouter);
app.use("/api/squadre", squadreRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Backend is running with hardcoded API key"
  });
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   - GET /api/classifica`);
  console.log(`   - GET /api/incontri`);
  console.log(`   - GET /api/calendario`);
  console.log(`   - GET /api/squadre`);
  console.log(`   - GET /api/health`);
});