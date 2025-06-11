import express from "express";
import { MatchUpdater } from "../services/matchUpdater.js";
import { Scheduler } from "../services/scheduler.js";
import { LeaderboardService } from "../services/database/leaderboardService.js";
import { query } from "../db/connection.js";  // ⭐ AGGIUNGI QUESTA RIGA

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

// Test endpoint per simulare risultati
router.post("/test/add-result", async (req, res) => {
  try {
    const { homeTeam, awayTeam, homeGoals, awayGoals, winnerTeam } = req.body;
    
    console.log('🧪 Simulazione partita:', { homeTeam, awayTeam, homeGoals, awayGoals });
    
    // Trova o crea le squadre
    const homeTeamResult = await query('SELECT id FROM teams WHERE name = $1', [homeTeam]);
    const awayTeamResult = await query('SELECT id FROM teams WHERE name = $1', [awayTeam]);
    
    if (homeTeamResult.rows.length === 0 || awayTeamResult.rows.length === 0) {
      return res.status(400).json({ error: 'Squadre non trovate nel database' });
    }
    
    const homeTeamId = homeTeamResult.rows[0].id;
    const awayTeamId = awayTeamResult.rows[0].id;
    
    let winnerTeamId = null;
    if (winnerTeam) {
      const winnerResult = await query('SELECT id FROM teams WHERE name = $1', [winnerTeam]);
      if (winnerResult.rows.length > 0) {
        winnerTeamId = winnerResult.rows[0].id;
      }
    }
    
    // Inserisci partita fittizia con risultato
    const matchResult = await query(`
      INSERT INTO matches (
        external_id, home_team_id, away_team_id, home_goals, away_goals,
        winner_team_id, match_date, status, is_knockout
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      'TEST_' + Date.now(), // ID fittizio
      homeTeamId,
      awayTeamId, 
      homeGoals,
      awayGoals,
      winnerTeamId,
      new Date(), // Ora
      'finished',
      !!winnerTeam // true se c'è un vincitore specificato
    ]);
    
    // Ricalcola classifica
    await LeaderboardService.recalculateLeaderboard();
    
    res.json({
      success: true,
      message: "Partita di test aggiunta e classifica ricalcolata",
      match: matchResult.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Errore simulazione:", error);
    res.status(500).json({ 
      success: false,
      error: "Errore durante la simulazione",
      details: error.message 
    });
  }
});

// Reset database di test
router.post("/test/reset", async (req, res) => {
  try {
    console.log('🧹 Reset partite di test...');
    
    // Rimuovi tutte le partite di test
    await query("DELETE FROM matches WHERE external_id LIKE 'TEST_%'");
    
    // Reset classifica
    await LeaderboardService.recalculateLeaderboard();
    
    res.json({
      success: true,
      message: "Database di test resettato",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Errore reset:", error);
    res.status(500).json({ 
      success: false,
      error: "Errore durante il reset",
      details: error.message 
    });
  }
});

export default router;