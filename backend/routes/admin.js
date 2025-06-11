import express from "express";
import { MatchUpdater } from "../services/matchUpdater.js";
import { Scheduler } from "../services/scheduler.js";
import { LeaderboardService } from "../services/database/leaderboardService.js";
import { query } from "../db/connection.js";

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

// 🧪 TEST ENDPOINT GET - Facile da usare dal browser!
router.get("/test/simulate-psg-real", async (req, res) => {
  try {
    console.log('🧪 Test browser: PSG 2-1 Real Madrid');
    
    // Trova le squadre
    const homeTeamResult = await query('SELECT id FROM teams WHERE name = $1', ['Paris Saint Germain']);
    const awayTeamResult = await query('SELECT id FROM teams WHERE name = $1', ['Real Madrid']);
    
    if (homeTeamResult.rows.length === 0 || awayTeamResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Squadre non trovate nel database',
        homeFound: homeTeamResult.rows.length > 0,
        awayFound: awayTeamResult.rows.length > 0,
        instruction: 'Controlla che le squadre esistano nel database'
      });
    }
    
    const homeTeamId = homeTeamResult.rows[0].id;
    const awayTeamId = awayTeamResult.rows[0].id;
    
    // Inserisci partita di test: PSG 2-1 Real Madrid
    const matchResult = await query(`
      INSERT INTO matches (
        external_id, home_team_id, away_team_id, home_goals, away_goals,
        match_date, status, is_knockout
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      Date.now(), // Usa solo il timestamp numerico (risolve l'errore)
      homeTeamId,
      awayTeamId, 
      2, // PSG goals
      1, // Real Madrid goals
      new Date(),
      'finished',
      false
    ]);
    
    // Ricalcola classifica
    await LeaderboardService.recalculateLeaderboard();
    
    res.json({
      success: true,
      message: "🎉 Test completato! PSG 2-1 Real Madrid",
      result: "ENZO dovrebbe avere +3 punti, BENNY 0 punti",
      match: matchResult.rows[0],
      nextStep: "Vai su https://fanta-mondiale-club-2025.vercel.app nella sezione Classifica!",
      testUrl: "Puoi ripetere il test: /api/admin/test/reset poi di nuovo questo endpoint",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Errore test:", error);
    res.status(500).json({ 
      success: false,
      error: "Errore durante il test",
      details: error.message 
    });
  }
});

// 🧪 TEST ENDPOINT GET - Test pareggio
router.get("/test/simulate-draw", async (req, res) => {
  try {
    console.log('🧪 Test browser: Chelsea 1-1 River Plate');
    
    // Trova le squadre
    const homeTeamResult = await query('SELECT id FROM teams WHERE name = $1', ['Chelsea']);
    const awayTeamResult = await query('SELECT id FROM teams WHERE name = $1', ['River Plate']);
    
    if (homeTeamResult.rows.length === 0 || awayTeamResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Squadre non trovate nel database',
        homeFound: homeTeamResult.rows.length > 0,
        awayFound: awayTeamResult.rows.length > 0
      });
    }
    
    const homeTeamId = homeTeamResult.rows[0].id;
    const awayTeamId = awayTeamResult.rows[0].id;
    
    // Inserisci partita di test: Chelsea 1-1 River Plate
    const matchResult = await query(`
      INSERT INTO matches (
        external_id, home_team_id, away_team_id, home_goals, away_goals,
        match_date, status, is_knockout
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      Date.now(),
      homeTeamId,
      awayTeamId, 
      1, // Chelsea goals
      1, // River Plate goals
      new Date(),
      'finished',
      false
    ]);
    
    // Ricalcola classifica
    await LeaderboardService.recalculateLeaderboard();
    
    res.json({
      success: true,
      message: "🤝 Test pareggio! Chelsea 1-1 River Plate",
      result: "ZIO ALDO e MARIO dovrebbero avere +1 punto ciascuno",
      match: matchResult.rows[0],
      nextStep: "Controlla la classifica per vedere i punti aggiornati!",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Errore test:", error);
    res.status(500).json({ 
      success: false,
      error: "Errore durante il test",
      details: error.message 
    });
  }
});

// Test endpoint per simulare risultati (POST - per uso avanzato)
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
      Date.now(), // Fix: usa solo numero invece di stringa
      homeTeamId,
      awayTeamId, 
      homeGoals,
      awayGoals,
      winnerTeamId,
      new Date(),
      'finished',
      !!winnerTeam
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
router.get("/test/reset", async (req, res) => {
  try {
    console.log('🧹 Reset partite di test...');
    
    // Rimuovi tutte le partite di test (ora con external_id numerico)
    await query("DELETE FROM matches WHERE external_id > 1700000000000");
    
    // Reset classifica
    await LeaderboardService.recalculateLeaderboard();
    
    res.json({
      success: true,
      message: "🧹 Database di test resettato! Tutte le partite di test sono state rimosse.",
      instruction: "La classifica è stata azzerata. Puoi rifare i test!",
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