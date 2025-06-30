import { query } from '../../db/connection.js';

export class MatchService {

  // Get upcoming matches with player ownership info
  static async getUpcomingMatches() {
    try {
      const result = await query(`
        SELECT 
          m.id,
          m.external_id,
          m.match_date as date,
          ht.name as home,
          at.name as away,
          hp.name as homeOwner,
          ap.name as awayOwner,
          m.status
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        LEFT JOIN player_teams hpt ON ht.id = hpt.team_id
        LEFT JOIN players hp ON hpt.player_id = hp.id
        LEFT JOIN player_teams apt ON at.id = apt.team_id  
        LEFT JOIN players ap ON apt.player_id = ap.id
        WHERE m.status IN ('scheduled', 'live')
        ORDER BY m.match_date ASC
      `);
      
      console.log(`📅 Retrieved ${result.rows.length} upcoming matches`);
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting upcoming matches:', error);
      throw error;
    }
  }

// Get finished matches with results
static async getFinishedMatches() {
  try {
    const result = await query(`
      SELECT DISTINCT
        m.id,
        m.external_id,
        m.match_date as date,
        ht.name as home,
        at.name as away,
        COALESCE(hp.name, 'N/A') as homeowner,
        COALESCE(ap.name, 'N/A') as awayowner,
        m.home_goals,
        m.away_goals,
        m.status,
        m.is_knockout,
        COALESCE(wt.name, '') as winner_team,
        COALESCE(wp.name, 'N/A') as winner_owner,
        CASE 
          WHEN m.home_goals > m.away_goals THEN 'home'
          WHEN m.away_goals > m.home_goals THEN 'away'
          WHEN m.home_goals = m.away_goals AND m.winner_team_id = m.home_team_id THEN 'home'
          WHEN m.home_goals = m.away_goals AND m.winner_team_id = m.away_team_id THEN 'away'
          ELSE 'draw'
        END as result_type
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN player_teams hpt ON ht.id = hpt.team_id
      LEFT JOIN players hp ON hpt.player_id = hp.id
      LEFT JOIN player_teams apt ON at.id = apt.team_id
      LEFT JOIN players ap ON apt.player_id = ap.id
      LEFT JOIN teams wt ON m.winner_team_id = wt.id
      LEFT JOIN player_teams wpt ON wt.id = wpt.team_id
      LEFT JOIN players wp ON wpt.player_id = wp.id
      WHERE m.status = 'finished'
        AND m.home_goals IS NOT NULL 
        AND m.away_goals IS NOT NULL
      ORDER BY m.match_date DESC
      LIMIT 500
    `);
    
    console.log(`🏆 Retrieved ${result.rows.length} finished matches`);
    return result.rows;
  } catch (error) {
    console.error('❌ Error getting finished matches:', error);
    throw error;
  }
}

  // Get today's matches
  static async getTodaysMatches() {
    try {
      const result = await query(`
        SELECT 
          m.id,
          m.external_id,
          m.match_date as data,
          ht.name as home,
          at.name as away,
          hp.name as homeOwner,
          ap.name as awayOwner,
          m.status
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        LEFT JOIN player_teams hpt ON ht.id = hpt.team_id
        LEFT JOIN players hp ON hpt.player_id = hp.id
        LEFT JOIN player_teams apt ON at.id = apt.team_id
        LEFT JOIN players ap ON apt.player_id = ap.id
        WHERE DATE(m.match_date) = CURRENT_DATE
        ORDER BY m.match_date ASC
      `);
      
      console.log(`⚡ Retrieved ${result.rows.length} matches for today`);
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting today\'s matches:', error);
      throw error;
    }
  }

  // Save or update match from API data
  static async saveMatch(matchData) {
  try {
    // TEMPORARY DEBUG: Log match data structure
    console.log(`🔍 DEBUGGING: ${matchData.teams.home.name} vs ${matchData.teams.away.name}`);
    console.log('   Status:', matchData.fixture.status.short);
    console.log('   Score penalty:', matchData.score.penalty);
    console.log('   Score extratime:', matchData.score.extratime);
    console.log('   Full score object:', JSON.stringify(matchData.score, null, 2));
    
    // First, find or create teams
    const homeTeam = await this.findOrCreateTeam(matchData.teams.home.name);
    const awayTeam = await this.findOrCreateTeam(matchData.teams.away.name);
   
    let winnerTeamId = null;
   
    // First try to get winner from API
    if (matchData.teams.winner) {
      const winnerTeam = await this.findOrCreateTeam(matchData.teams.winner.name);
      winnerTeamId = winnerTeam.id;
    }
    // If no winner from API but match is finished, determine from score
    else if (['FT', 'AET', 'PEN', 'POST', 'AWD', 'WO'].includes(matchData.fixture.status.short)) {
     
      const homeGoals = matchData.goals.home || 0;
      const awayGoals = matchData.goals.away || 0;
     
      if (homeGoals > awayGoals) {
        winnerTeamId = homeTeam.id;
        console.log(`🏆 Winner determined from score: ${matchData.teams.home.name} (${homeGoals}-${awayGoals})`);
      } else if (awayGoals > homeGoals) {
        winnerTeamId = awayTeam.id;
        console.log(`🏆 Winner determined from score: ${matchData.teams.away.name} (${awayGoals}-${homeGoals})`);
      }
      // For draws (homeGoals === awayGoals), winner stays null
    }
    
    // SIMPLIFIED: Only actual extra time matches should be knockout
    const isKnockout = matchData.fixture.status.short === 'AET' || 
                       matchData.fixture.status.short === 'PEN';
    
    console.log(`   ✅ isKnockout determined as: ${isKnockout}`);
    
    const result = await query(`
      INSERT INTO matches (
        external_id, home_team_id, away_team_id, home_goals, away_goals,
        winner_team_id, match_date, status, is_knockout
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (external_id) DO UPDATE SET
        home_goals = EXCLUDED.home_goals,
        away_goals = EXCLUDED.away_goals,
        winner_team_id = EXCLUDED.winner_team_id,
        status = EXCLUDED.status,
        is_knockout = EXCLUDED.is_knockout,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      matchData.fixture.id,
      homeTeam.id,
      awayTeam.id,
      matchData.goals.home,
      matchData.goals.away,
      winnerTeamId,
      new Date(matchData.fixture.date),
      this.mapApiStatus(matchData.fixture.status.short),
      isKnockout
    ]);
    
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error saving match:', error);
    throw error;
  }
}

  // Find or create team by name
  static async findOrCreateTeam(teamName) {
    try {
      // First try to find existing team
      let result = await query(`
        SELECT * FROM teams WHERE name = $1
      `, [teamName]);

      if (result.rows.length > 0) {
        return result.rows[0];
      }

      // Create new team if not found
      result = await query(`
        INSERT INTO teams (name) VALUES ($1) RETURNING *
      `, [teamName]);

      console.log(`🆕 Created new team: ${teamName}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error finding/creating team:', error);
      throw error;
    }
  }

  // Map API status to our status
  static mapApiStatus(apiStatus) {
  switch (apiStatus) {
    // ✅ PARTITE FINITE
    case 'FT':    // Full Time
    case 'AET':   // After Extra Time  
    case 'PEN':   // Penalties
    case 'POST':  // Postponed
    case 'CANC':  // Cancelled
    case 'AWD':   // Awarded
    case 'WO':    // Walkover
      return 'finished';
      
    // ⚡ PARTITE LIVE
    case 'LIVE': case '1H': case '2H': case 'HT': 
    case 'ET': case 'BT': case 'P': case 'INT': case 'BREAK':
      return 'live';
      
    // 📅 PARTITE PROGRAMMATE
    case 'NS': case 'TBD': case 'SUSP':
      return 'scheduled';
      
    // ❓ STATUS SCONOSCIUTI
    default: 
      console.warn(`⚠️ Unknown API status: ${apiStatus} - mapping to scheduled`);
      return 'scheduled';
  }
}

// Get players' teams for easy lookup
static async getPlayersTeams() {
  try {
    const result = await query(`
      SELECT 
        p.name as player_name,
        t.name as team_name,
        COALESCE(t.eliminated, FALSE) as team_eliminated,
        t.elimination_reason
      FROM players p
      JOIN player_teams pt ON p.id = pt.player_id
      JOIN teams t ON pt.team_id = t.id
      ORDER BY p.name, t.name
    `);
    
    // Group by player nel formato corretto per il frontend
    const playersMap = new Map();
    
    result.rows.forEach(row => {
      if (!playersMap.has(row.player_name)) {
        playersMap.set(row.player_name, {
          name: row.player_name,
          teams: []
        });
      }
      
      playersMap.get(row.player_name).teams.push({
        name: row.team_name,
        eliminated: row.team_eliminated,
        elimination_reason: row.elimination_reason
      });
    });
    
    return Array.from(playersMap.values());
  } catch (error) {
    console.error('❌ Error getting players teams:', error);
    throw error;
  }
}

// 🆕 NUOVO METODO: Elimina squadre dopo la fase a gironi (UNA SOLA VOLTA)
static async eliminateGroupStageTeams(eliminatedTeamNames) {
  try {
    console.log('🏁 Starting group stage elimination process...');
    console.log(`📋 Teams to eliminate: ${eliminatedTeamNames.length}`);
    
    // Controlla se l'eliminazione è già stata fatta
    const alreadyEliminated = await query(`
      SELECT COUNT(*) as count 
      FROM teams 
      WHERE eliminated = true 
      AND elimination_reason = 'Group stage elimination'
    `);
    
    if (parseInt(alreadyEliminated.rows[0].count) > 0) {
      console.log('⚠️ Group stage elimination already completed');
      return {
        message: 'Group stage elimination already completed',
        eliminatedCount: parseInt(alreadyEliminated.rows[0].count),
        alreadyDone: true
      };
    }
    
    let eliminatedCount = 0;
    let notFoundTeams = [];
    
    for (const teamName of eliminatedTeamNames) {
      try {
        // Cerca la squadra nel database (matching esatto)
        const teamResult = await query(`
          SELECT id, name FROM teams 
          WHERE name = $1
        `, [teamName]);
        
        if (teamResult.rows.length > 0) {
          const team = teamResult.rows[0];
          
          // Elimina la squadra
          await query(`
            UPDATE teams 
            SET eliminated = true,
                elimination_date = NOW(),
                elimination_reason = 'Group stage elimination'
            WHERE id = $1
          `, [team.id]);
          
          console.log(`❌ Team eliminated: ${team.name} (ID: ${team.id})`);
          eliminatedCount++;
          
        } else {
          console.warn(`⚠️ Team not found in database: ${teamName}`);
          notFoundTeams.push(teamName);
        }
        
      } catch (error) {
        console.error(`❌ Error eliminating team ${teamName}:`, error.message);
        notFoundTeams.push(teamName);
      }
    }
    
    // Aggiungi timestamp dell'operazione in system_settings
    await query(`
      INSERT INTO system_settings (key, value) 
      VALUES ('group_stage_elimination_completed', $1)
      ON CONFLICT (key) DO UPDATE SET 
        value = EXCLUDED.value,
        updated_at = CURRENT_TIMESTAMP
    `, [new Date().toISOString()]);
    
    console.log(`✅ Group stage elimination completed:`);
    console.log(`   - Teams eliminated: ${eliminatedCount}`);
    console.log(`   - Teams not found: ${notFoundTeams.length}`);
    
    if (notFoundTeams.length > 0) {
      console.log(`   - Missing teams: ${notFoundTeams.join(', ')}`);
    }
    
    return {
      eliminatedCount,
      notFoundTeams,
      totalRequested: eliminatedTeamNames.length,
      completedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error in group stage elimination:', error);
    throw error;
  }
}

// 🔄 METODO MODIFICATO: checkEliminatedTeams
static async checkEliminatedTeams() {
  try {
    console.log('🔍 Starting team elimination check...');
    
    // Controlla se l'eliminazione post-gironi è già stata fatta
    const groupStageElimination = await query(`
      SELECT value FROM system_settings 
      WHERE key = 'group_stage_elimination_completed'
    `);
    
    const currentDate = new Date();
    const knockoutStartDate = new Date('2025-06-28');
    
    // FASE 1: Eliminazione post-gironi (solo se non già fatta)
    if (currentDate >= knockoutStartDate && !groupStageElimination.rows[0]) {
      console.log('⚠️ Group stage elimination not yet performed');
      console.log('💡 Use /api/admin/eliminate-group-stage-teams endpoint');
    } else if (groupStageElimination.rows[0]) {
      console.log(`✅ Group stage elimination already completed at: ${groupStageElimination.rows[0].value}`);
    }
    
    // FASE 2: Eliminazioni knockout (sempre attive)
    if (currentDate >= knockoutStartDate) {
      console.log('⚔️ Checking knockout stage eliminations...');
      await this.eliminateKnockoutLosers();
    }
    
    console.log('✅ Team elimination check completed');
    
  } catch (error) {
    console.error('❌ Error in elimination check:', error);
  }
}

// Eliminazione nella fase ad eliminazione diretta
static async eliminateKnockoutLosers() {
  console.log('⚔️ Checking knockout stage eliminations...');
  
  try {
    // 🆕 QUERY PIÙ PERMISSIVA - ultimi 5 giorni invece di 2
    const knockoutStartDate = new Date('2025-06-27'); // Inizia dal 27 per sicurezza
    
    const recentKnockoutMatches = await query(`
      SELECT 
        m.id,
        m.home_team_id,
        m.away_team_id,
        m.home_goals,
        m.away_goals,
        m.winner_team_id,
        m.match_date,
        ht.name as home_team_name,
        at.name as away_team_name,
        wt.name as winner_team_name
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN teams wt ON m.winner_team_id = wt.id
      WHERE m.match_date >= $1  -- Dal 27 giugno in poi
        AND m.status = 'finished'
        AND m.home_goals IS NOT NULL 
        AND m.away_goals IS NOT NULL
        -- 🆕 FINESTRA PIÙ AMPIA - ultimi 5 giorni
        AND m.match_date >= NOW() - INTERVAL '5 days'
    `, [knockoutStartDate]);
    
    console.log(`🔍 Found ${recentKnockoutMatches.rows.length} recent knockout matches to check`);
    
    // 🆕 DEBUG - Stampa tutte le partite trovate
    recentKnockoutMatches.rows.forEach(match => {
      console.log(`   🎯 ${match.home_team_name} ${match.home_goals}-${match.away_goals} ${match.away_team_name} (${match.match_date})`);
    });
    
    for (const match of recentKnockoutMatches.rows) {
      let eliminatedTeamId = null;
      let eliminatedTeamName = '';
      
      // Determina chi è stato eliminato
      if (match.home_goals > match.away_goals) {
        eliminatedTeamId = match.away_team_id;
        eliminatedTeamName = match.away_team_name;
      } else if (match.away_goals > match.home_goals) {
        eliminatedTeamId = match.home_team_id;
        eliminatedTeamName = match.home_team_name;
      } else if (match.winner_team_id) {
        // Pareggio ma c'è un vincitore (rigori/supplementari)
        eliminatedTeamId = match.winner_team_id === match.home_team_id 
          ? match.away_team_id 
          : match.home_team_id;
        eliminatedTeamName = match.winner_team_id === match.home_team_id 
          ? match.away_team_name 
          : match.home_team_name;
      }
      
      if (eliminatedTeamId) {
        // Controlla se la squadra è già stata eliminata
        const alreadyEliminated = await query(`
          SELECT eliminated FROM teams WHERE id = $1
        `, [eliminatedTeamId]);
        
        if (!alreadyEliminated.rows[0]?.eliminated) {
          // Elimina la squadra
          await query(`
            UPDATE teams 
            SET eliminated = TRUE, 
                elimination_date = NOW(),
                elimination_reason = 'Knockout stage defeat'
            WHERE id = $1
          `, [eliminatedTeamId]);
          
          console.log(`❌ Team eliminated (knockout): ${eliminatedTeamName} in match vs ${match.winner_team_name || 'opponent'}`);
        } else {
          console.log(`ℹ️ Team already eliminated: ${eliminatedTeamName}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error in knockout elimination check:', error);
  }
}

// Metodo di utilità per reset manuale (per testing)
static async resetAllEliminations() {
  try {
    await query(`
      UPDATE teams 
      SET eliminated = FALSE, 
          elimination_date = NULL,
          elimination_reason = NULL
    `);
    console.log('✅ All team eliminations reset');
  } catch (error) {
    console.error('❌ Error resetting eliminations:', error);
  }
}
}