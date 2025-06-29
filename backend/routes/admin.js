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
// 🆕 NUOVO: Reset forzato del sistema bloccato
router.post("/reset-locks", async (req, res) => {
  try {
    console.log('🔄 Force reset locks triggered via API...');
    
    const result = Scheduler.forceResetUpdateLocks();
    
    res.json({
      success: true,
      message: "🔄 Sistema sbloccato con successo!",
      ...result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Reset locks failed:", error.message);
    res.status(500).json({ 
      success: false,
      error: "❌ Errore durante il reset del sistema",
      details: error.message 
    });
  }
}); 

// ===================================================================
// 1. MODIFICHE AL FILE: routes/admin.js
// ===================================================================
// AGGIUNGI QUESTI DUE ENDPOINT ALLA FINE DEL FILE (prima di export default router;)

// Nuovo endpoint per eliminazione post-gironi (UNA SOLA VOLTA)
router.post("/eliminate-group-stage-teams", async (req, res) => {
  try {
    console.log('🏁 Group stage elimination triggered via API...');
    
    // Importa MatchService
    const { MatchService } = await import("../services/database/matchService.js");
    
    // Lista fissa delle squadre eliminate (nomi esatti dal database)
    const eliminatedTeamNames = [
      "Wydad AC",
      "Urawa",
      "Boca Juniors",
      "Pachuca", 
      "Red Bull Salzburg",
      "Los Angeles FC",
      "Auckland City",
      "Al Ain",
      "River Plate",
      "FC Porto",
      "Mamelodi Sundowns",
      "Atletico Madrid",
      "Ulsan Hyundai FC",
      "ES Tunis",
      "Al Ahly",
      "Seattle Sounders"
    ];
    
    const result = await MatchService.eliminateGroupStageTeams(eliminatedTeamNames);
    
    res.json({
      success: true,
      message: "🏁 Eliminazione post-gironi completata con successo!",
      ...result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Group stage elimination failed:", error.message);
    res.status(500).json({ 
      success: false,
      error: "❌ Errore durante l'eliminazione post-gironi",
      details: error.message 
    });
  }
});

// Endpoint per controllare lo status eliminazioni
router.get("/elimination-status", async (req, res) => {
  try {
    const { query } = await import("../db/connection.js");
    
    // Controlla se eliminazione post-gironi è completata
    const groupStageResult = await query(`
      SELECT value FROM system_settings 
      WHERE key = 'group_stage_elimination_completed'
    `);
    
    // Conta squadre eliminate per motivo
    const eliminationStats = await query(`
      SELECT 
        elimination_reason,
        COUNT(*) as count,
        MIN(elimination_date) as first_elimination,
        MAX(elimination_date) as last_elimination
      FROM teams 
      WHERE eliminated = true
      GROUP BY elimination_reason
    `);
    
    // Lista squadre eliminate
    const eliminatedTeams = await query(`
      SELECT name, elimination_reason, elimination_date
      FROM teams 
      WHERE eliminated = true
      ORDER BY elimination_date, name
    `);
    
    res.json({
      groupStageCompleted: !!groupStageResult.rows[0],
      groupStageCompletedAt: groupStageResult.rows[0]?.value || null,
      eliminationStats: eliminationStats.rows,
      eliminatedTeams: eliminatedTeams.rows,
      totalEliminated: eliminatedTeams.rows.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error getting elimination status:", error.message);
    res.status(500).json({ 
      error: "Errore durante il recupero dello stato eliminazioni",
      details: error.message 
    });
  }
});

router.get("/debug-palmeiras-detailed", async (req, res) => {
  try {
    const { query } = await import("../db/connection.js");
    
    // Query più dettagliata
    const matches = await query(`
      SELECT 
        m.*,
        ht.name as home_name, 
        at.name as away_name,
        m.status as current_status,
        m.home_goals,
        m.away_goals,
        m.match_date,
        EXTRACT(EPOCH FROM (NOW() - m.match_date))/3600 as hours_since_match
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id  
      JOIN teams at ON m.away_team_id = at.id
      WHERE (ht.name = 'Palmeiras' OR at.name = 'Palmeiras' OR ht.name = 'Botafogo' OR at.name = 'Botafogo')
      AND m.match_date >= '2025-06-27'
      ORDER BY m.match_date DESC
    `);
    
    res.json({ 
      matches: matches.rows,
      currentTime: new Date(),
      knockoutStart: new Date('2025-06-28'),
      systemTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/debug-api-status", async (req, res) => {
  try {
    const { MatchUpdater } = await import("../services/matchUpdater.js");
    
    console.log('🔧 Testing API status mapping...');
    const apiMatches = await MatchUpdater.fetchResultsFromAPI();
    
    const statusCounts = {};
    const statusExamples = {};
    
    apiMatches.forEach(match => {
      const status = match.fixture.status.short;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      if (!statusExamples[status]) {
        statusExamples[status] = `${match.teams.home.name} vs ${match.teams.away.name}`;
      }
    });
    
    res.json({ 
      totalMatches: apiMatches.length,
      statusCounts,
      statusExamples
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;