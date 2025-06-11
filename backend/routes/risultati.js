// backend/routes/risultati.js - NUOVO FILE
import express from "express";
import { MatchService } from "../services/database/matchService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    console.log('🏆 Fetching finished matches from database...');
    
    // Query per le partite finite
    const matches = await MatchService.getFinishedMatches();
    
    console.log(`✅ Retrieved ${matches.length} finished matches`);
    
    res.json(matches);
    
  } catch (error) {
    console.error("❌ Error getting risultati:", error.message);
    res.status(500).json({ 
      error: "Errore durante il recupero dei risultati.",
      details: error.message 
    });
  }
});

export default router;