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