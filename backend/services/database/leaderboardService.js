import { query } from '../../db/connection.js';

export class LeaderboardService {
  
  // Get current leaderboard from database
  static async getLeaderboard() {
    try {
      const result = await query(`
        SELECT 
          p.name,
          l.points,
          l.matches_played as partite,
          l.wins,
          l.draws as pareggi,
          l.losses as sconfitte,
          l.last_updated
        FROM leaderboard l
        JOIN players p ON p.id = l.player_id
        ORDER BY l.points DESC, l.wins DESC, l.matches_played ASC
      `);
      
      console.log(`📊 Retrieved leaderboard with ${result.rows.length} players`);
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting leaderboard:', error);
      throw error;
    }
  }

  // Recalculate leaderboard based on match results
  static async recalculateLeaderboard() {
    const client = await query.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Reset all leaderboard stats
      await client.query(`
        UPDATE leaderboard SET 
          points = 0, 
          matches_played = 0, 
          wins = 0, 
          draws = 0, 
          losses = 0,
          last_updated = CURRENT_TIMESTAMP
      `);

      // Calculate points for each player based on their teams' results
      const pointsCalculation = await client.query(`
        WITH player_match_results AS (
          SELECT 
            pt.player_id,
            m.id as match_id,
            m.home_team_id,
            m.away_team_id,
            m.home_goals,
            m.away_goals,
            m.winner_team_id,
            m.is_knockout,
            CASE 
              WHEN pt.team_id = m.home_team_id THEN 'home'
              WHEN pt.team_id = m.away_team_id THEN 'away'
            END as team_position,
            CASE
              -- Win in regular time (3 points)
              WHEN (pt.team_id = m.home_team_id AND m.home_goals > m.away_goals) OR 
                   (pt.team_id = m.away_team_id AND m.away_goals > m.home_goals) THEN 3
              -- Draw in regular time (1 point each)
              WHEN m.home_goals = m.away_goals THEN 1
              -- Loss in regular time (0 points)
              ELSE 0
            END as base_points,
            CASE
              -- Extra point for winning after penalties/extra time
              WHEN m.home_goals = m.away_goals AND m.is_knockout AND m.winner_team_id = pt.team_id THEN 1
              ELSE 0
            END as bonus_points
          FROM player_teams pt
          JOIN matches m ON (pt.team_id = m.home_team_id OR pt.team_id = m.away_team_id)
          WHERE m.status = 'finished'
        ),
        player_stats AS (
          SELECT 
            player_id,
            SUM(base_points + bonus_points) as total_points,
            COUNT(*) as matches_played,
            SUM(CASE WHEN base_points = 3 THEN 1 ELSE 0 END) as wins,
            SUM(CASE WHEN base_points = 1 THEN 1 ELSE 0 END) as draws,
            SUM(CASE WHEN base_points = 0 THEN 1 ELSE 0 END) as losses
          FROM player_match_results
          GROUP BY player_id
        )
        UPDATE leaderboard l SET
          points = COALESCE(ps.total_points, 0),
          matches_played = COALESCE(ps.matches_played, 0),
          wins = COALESCE(ps.wins, 0),
          draws = COALESCE(ps.draws, 0),
          losses = COALESCE(ps.losses, 0),
          last_updated = CURRENT_TIMESTAMP
        FROM player_stats ps
        WHERE l.player_id = ps.player_id
      `);

      await client.query('COMMIT');
      console.log('✅ Leaderboard recalculated successfully');
      
      return await this.getLeaderboard();
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error recalculating leaderboard:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get last update time
  static async getLastUpdateTime() {
    try {
      const result = await query(`
        SELECT last_updated 
        FROM leaderboard 
        ORDER BY last_updated DESC 
        LIMIT 1
      `);
      
      return result.rows[0]?.last_updated || null;
    } catch (error) {
      console.error('❌ Error getting last update time:', error);
      throw error;
    }
  }
}