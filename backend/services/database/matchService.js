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

// backend/services/database/matchService.js - VERSIONE CORRETTA
// Aggiungi questa funzione alla tua classe MatchService esistente

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
        COALESCE(
          (SELECT p.name FROM player_teams pt JOIN players p ON pt.player_id = p.id WHERE pt.team_id = ht.id LIMIT 1), 
          'N/A'
        ) as homeowner,
        COALESCE(
          (SELECT p.name FROM player_teams pt JOIN players p ON pt.player_id = p.id WHERE pt.team_id = at.id LIMIT 1), 
          'N/A'
        ) as awayowner,
        m.home_goals,
        m.away_goals,
        m.status,
        m.is_knockout,
        wt.name as winner_team,
        COALESCE(
          (SELECT p.name FROM player_teams pt JOIN players p ON pt.player_id = p.id WHERE pt.team_id = wt.id LIMIT 1), 
          'N/A'
        ) as winner_owner,
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
      LEFT JOIN teams wt ON m.winner_team_id = wt.id
      WHERE m.status = 'finished'
        AND m.home_goals IS NOT NULL 
        AND m.away_goals IS NOT NULL
      ORDER BY m.match_date DESC
      LIMIT 50
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
      // First, find or create teams
      const homeTeam = await this.findOrCreateTeam(matchData.teams.home.name);
      const awayTeam = await this.findOrCreateTeam(matchData.teams.away.name);
      
      let winnerTeamId = null;
      if (matchData.teams.winner) {
        const winnerTeam = await this.findOrCreateTeam(matchData.teams.winner.name);
        winnerTeamId = winnerTeam.id;
      }

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
        !!matchData.score.penalty // true if penalties occurred
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
      case 'FT': return 'finished';
      case 'LIVE': case '1H': case '2H': case 'HT': return 'live';
      case 'NS': case 'TBD': return 'scheduled';
      default: return 'scheduled';
    }
  }

  // Get players' teams for easy lookup
  static async getPlayersTeams() {
    try {
      const result = await query(`
        SELECT 
          p.name as player_name,
          t.name as team_name
        FROM players p
        JOIN player_teams pt ON p.id = pt.player_id
        JOIN teams t ON pt.team_id = t.id
        ORDER BY p.name, t.name
      `);
      
      // Group by player
      const playersTeams = {};
      result.rows.forEach(row => {
        if (!playersTeams[row.player_name]) {
          playersTeams[row.player_name] = {
            name: row.player_name,
            teams: []
          };
        }
        playersTeams[row.player_name].teams.push(row.team_name);
      });
      
      return Object.values(playersTeams);
    } catch (error) {
      console.error('❌ Error getting players teams:', error);
      throw error;
    }
  }
}