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

export async function setCaptain(userId, gameweek, playerId) {
  try {
    const { data, error } = await supabase
      .from('captain_selections')
      .upsert(
        {
          user_id: userId,
          gameweek,
          player_id: playerId,
          selected_at: new Date().toISOString()
        },
        { onConflict: 'user_id,gameweek' }
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

export async function getAllCaptains(userId) {
  try {
    const { data, error } = await supabase
      .from('captain_selections')
      .select('gameweek, player_id')
      .eq('user_id', userId);

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

export async function setMultiplierOverride(gameweek, multiplier) {
  try {
    const { data, error } = await supabase
      .from('multiplier_overrides')
      .upsert(
        {
          gameweek,
          multiplier,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'gameweek' }
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

export async function clearMultiplierOverride(gameweek) {
  try {
    const { error } = await supabase
      .from('multiplier_overrides')
      .delete()
      .eq('gameweek', gameweek);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Clear multiplier error:', error);
    return { success: false, error: error.message };
  }
}

export async function getAllMultiplierOverrides() {
  try {
    const { data, error } = await supabase
      .from('multiplier_overrides')
      .select('gameweek, multiplier');

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

export async function setQualifyingGame(gameweek, isQualifying) {
  try {
    const { data, error } = await supabase
      .from('qualifying_games')
      .upsert(
        {
          gameweek,
          is_qualifying: isQualifying,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'gameweek' }
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

export async function getAllQualifyingGames() {
  try {
    const { data, error } = await supabase
      .from('qualifying_games')
      .select('gameweek, is_qualifying');

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

// ============ GAMEWEEK RESULTS ============

export async function saveGameweekResult(gameweek, jamesPoints, lauriePoints, multiplier) {
  try {
    const difference = Math.abs(jamesPoints - lauriePoints) * multiplier;
    const jamesPaid = jamesPoints < lauriePoints ? difference : 0;
    const lauriePaid = lauriePoints < jamesPoints ? difference : 0;

    const { data, error } = await supabase
      .from('gameweek_results')
      .upsert(
        {
          gameweek,
          james_points: jamesPoints,
          laurie_points: lauriePoints,
          multiplier,
          difference,
          james_paid: jamesPaid,
          laurie_paid: lauriePaid,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'gameweek' }
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

export async function getAllGameweekResults() {
  try {
    const { data, error } = await supabase
      .from('gameweek_results')
      .select('*');

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
