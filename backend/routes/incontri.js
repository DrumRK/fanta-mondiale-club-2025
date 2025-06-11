import express from "express";
import { MatchService } from "../services/database/matchService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    console.log('⚡ Fetching today\'s matches from database...');
    
    // Get today's matches from database (super fast!)
    const matches = await MatchService.getTodaysMatches();
    
    console.log(`✅ Retrieved ${matches.length} matches for today`);
    
    res.json(matches);
    
  } catch (error) {
    console.error("❌ Error getting incontri:", error.message);
    res.status(500).json({ 
      error: "Errore durante il recupero degli incontri.",
      details: error.message 
    });
  }
});

export default router;