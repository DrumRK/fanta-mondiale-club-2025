import express from "express";
import { MatchService } from "../services/database/matchService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    console.log('👥 Fetching players and their teams from database...');
    
    // Get players and teams from database (super fast!)
    const playersTeams = await MatchService.getPlayersTeams();
    
    console.log(`✅ Retrieved ${playersTeams.length} players with their teams`);
    
    res.json(playersTeams);
    
  } catch (error) {
    console.error("❌ Error getting squadre:", error.message);
    res.status(500).json({ 
      error: "Errore durante il recupero delle squadre.",
      details: error.message 
    });
  }
});

export default router;