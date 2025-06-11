import express from "express";
import { MatchService } from "../services/database/matchService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    console.log('📅 Fetching upcoming matches from database...');
    
    // Get upcoming matches from database (super fast!)
    const matches = await MatchService.getUpcomingMatches();
    
    console.log(`✅ Retrieved ${matches.length} upcoming matches`);
    
    res.json(matches);
    
  } catch (error) {
    console.error("❌ Error getting calendario:", error.message);
    res.status(500).json({ 
      error: "Errore durante il recupero del calendario.",
      details: error.message 
    });
  }
});

export default router;