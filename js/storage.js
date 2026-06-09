/**
 * Local Storage and History Management
 * Handles saving and retrieving match history
 */

import { STORAGE_KEYS } from './config.js';

/**
 * Get complete match history from localStorage
 * @returns {Array} Array of match history objects
 */
function getMatchHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MATCH_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading match history:', error);
    return [];
  }
}

/**
 * Save match to history
 * @param {Object} matchData - Complete match data to save
 * @returns {boolean} Success status
 */
function saveMatchToHistory(matchData) {
  try {
    const history = getMatchHistory();
    const matchWithMetadata = {
      ...matchData,
      date: new Date().toLocaleString(),
      id: Date.now()
    };

    history.push(matchWithMetadata);
    localStorage.setItem(STORAGE_KEYS.MATCH_HISTORY, JSON.stringify(history));
    return true;
  } catch (error) {
    console.error('Error saving match to history:', error);
    return false;
  }
}

/**
 * Get single match from history by ID
 * @param {number} matchId - Match ID (timestamp)
 * @returns {Object|null} Match object or null if not found
 */
function getMatchById(matchId) {
  const history = getMatchHistory();
  return history.find(m => m.id === matchId) || null;
}

/**
 * Delete match from history
 * @param {number} matchId - Match ID to delete
 * @returns {boolean} Success status
 */
function deleteMatchFromHistory(matchId) {
  try {
    const history = getMatchHistory();
    const filtered = history.filter(m => m.id !== matchId);
    localStorage.setItem(STORAGE_KEYS.MATCH_HISTORY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting match from history:', error);
    return false;
  }
}

/**
 * Clear all match history
 * @returns {boolean} Success status
 */
function clearAllHistory() {
  try {
    localStorage.removeItem(STORAGE_KEYS.MATCH_HISTORY);
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
}

/**
 * Save app preferences
 * @param {Object} preferences - Preferences object
 * @returns {boolean} Success status
 */
function savePreferences(preferences) {
  try {
    localStorage.setItem(STORAGE_KEYS.APP_PREFERENCES, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error('Error saving preferences:', error);
    return false;
  }
}

/**
 * Get app preferences
 * @returns {Object} Preferences object
 */
function getPreferences() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.APP_PREFERENCES);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error reading preferences:', error);
    return {};
  }
}

/**
 * Save current session
 * @param {Object} sessionData - Current session data
 * @returns {boolean} Success status
 */
function saveCurrentSession(sessionData) {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(sessionData));
    return true;
  } catch (error) {
    console.error('Error saving session:', error);
    return false;
  }
}

/**
 * Get current session
 * @returns {Object|null} Session data or null
 */
function getCurrentSession() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading session:', error);
    return null;
  }
}

/**
 * Clear current session
 * @returns {boolean} Success status
 */
function clearCurrentSession() {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    return true;
  } catch (error) {
    console.error('Error clearing session:', error);
    return false;
  }
}

export {
  getMatchHistory,
  saveMatchToHistory,
  getMatchById,
  deleteMatchFromHistory,
  clearAllHistory,
  savePreferences,
  getPreferences,
  saveCurrentSession,
  getCurrentSession,
  clearCurrentSession
};
