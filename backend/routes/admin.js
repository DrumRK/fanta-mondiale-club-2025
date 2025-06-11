import express from "express";
import { MatchUpdater } from "../services/matchUpdater.js";
import { Scheduler } from "../services/scheduler.js";
import { LeaderboardService } from "../services/database/leaderboardService.js";

const router = express.Router();

// Manual update matches from API
router.post("/update-matches", async (req, res) => {
  try {
    console.log('🔧 Manual match update triggered via API...');
    
    const result = await MatchUpdater.manualUpdate();
    
    res.json({
      success: true,
      message: "Partite aggiornate con successo",
      ...result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Manual update failed:", error.message);
    res.status(500).json({ 
      success: false,
      error: "Errore durante l'aggiornamento delle partite",
      details: error.message 
    });
  }
});

// Get scheduler status
router.get("/scheduler/status", (req, res) => {
  try {
    const status = Scheduler.getStatus();
    res.json(status);
  } catch (error) {
    console.error("❌ Error getting scheduler status:", error.message);
    res.status(500).json({ 
      error: "Errore durante il recupero dello stato dello scheduler",
      details: error.message 
    });
  }
});

// Manually trigger scheduler update
router.post("/scheduler/trigger", async (req, res) => {
  try {
    console.log('🔧 Manual scheduler trigger via API...');
    
    const result = await Scheduler.triggerUpdate();
    
    res.json({
      success: true,
      message: "Aggiornamento schedulato eseguito con successo",
      ...result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Manual scheduler trigger failed:", error.message);
    res.status(500).json({ 
      success: false,
      error: "Errore durante l'esecuzione dell'aggiornamento schedulato",
      details: error.message 
    });
  }
});

// Get system status
router.get("/status", async (req, res) => {
  try {
    const lastUpdate = await MatchUpdater.getLastUpdateTime();
    const leaderboardUpdate = await LeaderboardService.getLastUpdateTime();
    const schedulerStatus = Scheduler.getStatus();
    
    res.json({
      system: "Fanta Mondiale Club 2025",
      status: "running",
      database: "connected",
      lastApiUpdate: lastUpdate,
      lastLeaderboardUpdate: leaderboardUpdate,
      scheduler: schedulerStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error getting system status:", error.message);
    res.status(500).json({ 
      error: "Errore durante il recupero dello stato del sistema",
      details: error.message 
    });
  }
});

router.get("/trigger-update", async (req, res) => {
  try {
    console.log('🔧 Browser-triggered manual update...');
    
    const result = await MatchUpdater.manualUpdate();
    
    res.json({
      success: true,
      message: "✅ Partite aggiornate con successo!",
      ...result,
      timestamp: new Date().toISOString(),
      instruction: "Refresh your frontend to see the updated data!"
    });
    
  } catch (error) {
    console.error("❌ Browser update failed:", error.message);
    res.status(500).json({ 
      success: false,
      error: "❌ Errore durante l'aggiornamento delle partite",
      details: error.message 
    });
  }
});

router.post("/update-schedule", async (req, res) => {
  try {
    const result = await Scheduler.triggerScheduleUpdate();
    res.json({
      success: true,
      message: "📅 Schedule aggiornato con successo",
      ...result
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: "Errore aggiornamento schedule",
      details: error.message 
    });
  }
});

// Manual results update (live scores)
router.post("/update-results", async (req, res) => {
  try {
    const result = await Scheduler.triggerResultsUpdate();
    res.json({
      success: true,
      message: "⚽ Risultati aggiornati con successo",
      ...result
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: "Errore aggiornamento risultati",
      details: error.message 
    });
  }
});

export default router;