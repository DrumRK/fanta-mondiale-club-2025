import express from "express";
import { LeaderboardService } from "../services/database/leaderboardService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    console.log('📊 Fetching leaderboard from database...');
    
    // Get leaderboard from database (super fast!)
    const classifica = await LeaderboardService.getLeaderboard();
    
    // Get last update time
    const lastUpdate = await LeaderboardService.getLastUpdateTime();
    
    console.log(`✅ Retrieved leaderboard with ${classifica.length} players`);
    
    res.json({
      data: classifica,
      lastUpdate: lastUpdate,
      source: 'database'
    });
    
  } catch (error) {
    console.error("❌ Error getting leaderboard:", error.message);
    res.status(500).json({ 
      error: "Errore durante il recupero della classifica.",
      details: error.message 
    });
  }
});

// Endpoint to force recalculation (for testing)
router.post("/recalculate", async (req, res) => {
  try {
    console.log('🔄 Manually recalculating leaderboard...');
    
    const classifica = await LeaderboardService.recalculateLeaderboard();
    
    console.log('✅ Leaderboard recalculated successfully');
    
    res.json({
      message: "Classifica ricalcolata con successo",
      data: classifica,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error recalculating leaderboard:", error.message);
    res.status(500).json({ 
      error: "Errore durante il ricalcolo della classifica.",
      details: error.message 
    });
  }
});

export default router;