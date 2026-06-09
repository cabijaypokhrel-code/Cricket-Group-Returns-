/**
 * Configuration and Constants
 * Centralized settings for the Cricket Scoring App
 */

// ============================================
// TEAM LOGO (Base64 PNG)
// ============================================
const TEAM_LOGO = "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

// ============================================
// APP CONFIGURATION
// ============================================
const CONFIG = {
  maxSnapshots: 50,           // Maximum undo snapshots to keep
  maxOvers: 100,              // Maximum overs allowed
  minOvers: 1,                // Minimum overs allowed
  defaultOvers: 20,           // Default overs for a match
  maxPlayers: 11,             // Maximum players per team
  defaultTeamName: 'Team',    // Default team name prefix
  defaultPlayerName: 'Player' // Default player name prefix
};

// ============================================
// UI CONSTANTS
// ============================================
const UI = {
  scoreboardDelay: 250,       // Delay for score animations (ms)
  toastDuration: 3000,        // Toast notification duration (ms)
  animationDuration: 300      // General animation duration (ms)
};

// ============================================
// PHASES
// ============================================
const PHASES = {
  SETUP: 'setup',
  CHOOSE_PLAYERS: 'choose-players',
  SCORING: 'scoring',
  INN1_COMPLETE: 'inn1-complete',
  INN2_STARTED: 'inn2-started',
  RESULT: 'result'
};

// ============================================
// INNINGS
// ============================================
const INNINGS = {
  FIRST: 1,
  SECOND: 2
};

// ============================================
// DISMISSAL TYPES
// ============================================
const DISMISSAL_TYPES = {
  BOWLED: 'bowled',
  CAUGHT: 'caught',
  LBW: 'lbw',
  STUMPED: 'stumped',
  RUN_OUT: 'runout',
  HIT_WICKET: 'hitwicket',
  OBSTRUCTING: 'obstructing',
  RETIRED_HURT: 'retiredhurt',
  RETIRED_OUT: 'retiredout'
};

// ============================================
// BALL TYPES
// ============================================
const BALL_TYPES = {
  DOT: '0',
  SINGLE: '1',
  DOUBLE: '2',
  TRIPLE: '3',
  FOUR: '4',
  SIX: '6',
  WIDE: 'WD',
  NO_BALL: 'NB',
  BYE: 'B',
  LEG_BYE: 'LB',
  WICKET: 'W'
};

// ============================================
// LOCALSTORAGE KEYS
// ============================================
const STORAGE_KEYS = {
  MATCH_HISTORY: 'cricket_match_history',
  APP_PREFERENCES: 'cricket_app_preferences',
  CURRENT_SESSION: 'cricket_current_session'
};

// ============================================
// VALIDATION RULES
// ============================================
const VALIDATION = {
  minTeamNameLength: 1,
  maxTeamNameLength: 50,
  minPlayerNameLength: 1,
  maxPlayerNameLength: 30,
  teamNameRegex: /^[a-zA-Z0-9\s\-]+$/,
  playerNameRegex: /^[a-zA-Z0-9\s\-\.]+$/
};

export {
  TEAM_LOGO,
  CONFIG,
  UI,
  PHASES,
  INNINGS,
  DISMISSAL_TYPES,
  BALL_TYPES,
  STORAGE_KEYS,
  VALIDATION
};
