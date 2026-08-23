import { supabase } from './supabaseClient';
import bcrypt from 'bcryptjs';

// ============ USER AUTHENTICATION ============

export async function verifyPin(username, pin) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return { success: false, error: 'User not found' };
    }

    const isValid = await bcrypt.compare(pin, user.pin_hash);
    if (!isValid) {
      return { success: false, error: 'Invalid PIN' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name
      }
    };
  } catch (error) {
    console.error('PIN verification error:', error);
    return { success: false, error: error.message };
  }
}

export async function createUser(username, displayName, pin) {
  try {
    const pinHash = await bcrypt.hash(pin, 10);
    const { data, error } = await supabase
      .from('users')
      .insert([
        { username, display_name: displayName, pin_hash: pinHash }
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, user: data };
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, error: error.message };
  }
}

export async function getUserByUsername(username) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name')
      .eq('username', username)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

// ============ CAPTAIN SELECTIONS ============

export async function setCaptain(userId, gameweek, playerId, season) {
  try {
    const { data, error } = await supabase
      .from('captain_selections')
      .upsert(
        {
          user_id: userId,
          gameweek,
          season,
          player_id: playerId,
          selected_at: new Date().toISOString()
        },
        { onConflict: 'user_id,gameweek,season' }
      )
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Set captain error:', error);
    return { success: false, error: error.message };
  }
}

export async function getCaptain(userId, gameweek) {
  try {
    const { data, error } = await supabase
      .from('captain_selections')
      .select('player_id')
      .eq('user_id', userId)
      .eq('gameweek', gameweek)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data?.player_id || null;
  } catch (error) {
    console.error('Get captain error:', error);
    return null;
  }
}

export async function getAllCaptains(userId, season) {
  try {
    const { data, error } = await supabase
      .from('captain_selections')
      .select('gameweek, player_id')
      .eq('user_id', userId)
      .eq('season', season);

    if (error) throw error;

    // Convert to object format: { gw22: playerId, gw23: playerId, ... }
    const captains = {};
    data?.forEach(({ gameweek, player_id }) => {
      captains[`gw${gameweek}`] = player_id;
    });

    return captains;
  } catch (error) {
    console.error('Get all captains error:', error);
    return {};
  }
}

// ============ MULTIPLIER OVERRIDES ============

export async function setMultiplierOverride(gameweek, multiplier, season) {
  try {
    const { data, error } = await supabase
      .from('multiplier_overrides')
      .upsert(
        {
          gameweek,
          season,
          multiplier,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'gameweek,season' }
      )
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Set multiplier error:', error);
    return { success: false, error: error.message };
  }
}

export async function getMultiplierOverride(gameweek) {
  try {
    const { data, error } = await supabase
      .from('multiplier_overrides')
      .select('multiplier')
      .eq('gameweek', gameweek)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.multiplier || null;
  } catch (error) {
    console.error('Get multiplier error:', error);
    return null;
  }
}

export async function clearMultiplierOverride(gameweek, season) {
  try {
    const { error } = await supabase
      .from('multiplier_overrides')
      .delete()
      .eq('gameweek', gameweek)
      .eq('season', season);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Clear multiplier error:', error);
    return { success: false, error: error.message };
  }
}

export async function getAllMultiplierOverrides(season) {
  try {
    const { data, error } = await supabase
      .from('multiplier_overrides')
      .select('gameweek, multiplier')
      .eq('season', season);

    if (error) throw error;

    const overrides = {};
    data?.forEach(({ gameweek, multiplier }) => {
      overrides[`gw${gameweek}`] = multiplier;
    });

    return overrides;
  } catch (error) {
    console.error('Get all multipliers error:', error);
    return {};
  }
}

// ============ QUALIFYING GAMES ============

export async function setQualifyingGame(gameweek, isQualifying, season) {
  try {
    const { data, error } = await supabase
      .from('qualifying_games')
      .upsert(
        {
          gameweek,
          season,
          is_qualifying: isQualifying,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'gameweek,season' }
      )
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Set qualifying game error:', error);
    return { success: false, error: error.message };
  }
}

export async function isQualifyingGame(gameweek) {
  try {
    const { data, error } = await supabase
      .from('qualifying_games')
      .select('is_qualifying')
      .eq('gameweek', gameweek)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.is_qualifying || false;
  } catch (error) {
    console.error('Get qualifying game error:', error);
    return false;
  }
}

export async function getAllQualifyingGames(season) {
  try {
    const { data, error } = await supabase
      .from('qualifying_games')
      .select('gameweek, is_qualifying')
      .eq('season', season);

    if (error) throw error;

    const qualifying = {};
    data?.forEach(({ gameweek, is_qualifying }) => {
      qualifying[`gw${gameweek}`] = is_qualifying;
    });

    return qualifying;
  } catch (error) {
    console.error('Get all qualifying games error:', error);
    return {};
  }
}

// ============ PLAYER ASSIGNMENTS ============

export async function getAllPlayerAssignments(userId, season) {
  try {
    const { data, error } = await supabase
      .from('player_assignments')
      .select('player_name, starting_gameweek, ending_gameweek')
      .eq('user_id', userId)
      .eq('season', season);

    if (error) throw error;

    return (data || []).map(({ player_name, starting_gameweek, ending_gameweek }) => ({
      name: player_name,
      startingGameweek: starting_gameweek,
      endingGameweek: ending_gameweek
    }));
  } catch (error) {
    console.error('Get all player assignments error:', error);
    return [];
  }
}

export async function addPlayerAssignment(userId, playerName, startingGameweek, season) {
  try {
    const { data, error } = await supabase
      .from('player_assignments')
      .insert([{
        user_id: userId,
        player_name: playerName,
        starting_gameweek: startingGameweek,
        ending_gameweek: 99,
        season
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Add player assignment error:', error);
    return { success: false, error: error.message };
  }
}

export async function removePlayerAssignment(userId, playerName, activeGameweek, season) {
  try {
    const { data, error } = await supabase
      .from('player_assignments')
      .update({ ending_gameweek: activeGameweek, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('player_name', playerName)
      .eq('ending_gameweek', 99)
      .eq('season', season)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Remove player assignment error:', error);
    return { success: false, error: error.message };
  }
}

// ============ GAMEWEEK RESULTS ============

export async function saveGameweekResult(gameweek, jamesPoints, lauriePoints, multiplier, season) {
  try {
    const difference = Math.abs(jamesPoints - lauriePoints) * multiplier;
    const jamesPaid = jamesPoints < lauriePoints ? difference : 0;
    const lauriePaid = lauriePoints < jamesPoints ? difference : 0;

    const { data, error } = await supabase
      .from('gameweek_results')
      .upsert(
        {
          gameweek,
          season,
          james_points: jamesPoints,
          laurie_points: lauriePoints,
          multiplier,
          difference,
          james_paid: jamesPaid,
          laurie_paid: lauriePaid,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'gameweek,season' }
      )
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Save gameweek result error:', error);
    return { success: false, error: error.message };
  }
}

export async function getGameweekResult(gameweek) {
  try {
    const { data, error } = await supabase
      .from('gameweek_results')
      .select('*')
      .eq('gameweek', gameweek)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Get gameweek result error:', error);
    return null;
  }
}

export async function getAllGameweekResults(season) {
  try {
    const { data, error } = await supabase
      .from('gameweek_results')
      .select('*')
      .eq('season', season);

    if (error) throw error;

    const results = {};
    data?.forEach((result) => {
      results[`gw${result.gameweek}`] = {
        jamesPoints: result.james_points,
        lauriePoints: result.laurie_points,
        multiplier: result.multiplier,
        difference: result.difference,
        jamesPaid: result.james_paid,
        lauriePaid: result.laurie_paid
      };
    });

    return results;
  } catch (error) {
    console.error('Get all gameweek results error:', error);
    return {};
  }
}
