/**
 * Game configuration constants
 */
export const GAME_CONFIG = {
    PLAYER_PITS_INDICES: [0, 1, 2, 3, 4, 5],
    PLAYER_STORE_INDEX: 6,
    COMPUTER_PITS_INDICES: [7, 8, 9, 10, 11, 12],
    COMPUTER_STORE_INDEX: 13,
    TOTAL_PIT_POSITIONS: 14,
    INITIAL_SEEDS_PER_PIT: 4,
    SOWING_SPEED: 250, // milliseconds
    HIGHLIGHT_DURATION: 180, // milliseconds
    COMPUTER_THINK_TIME: 1500 // milliseconds
};

/**
 * Game state enumeration
 */
export const GAME_STATE = {
    PLAYER_TURN: 'player_turn',
    COMPUTER_TURN: 'computer_turn',
    GAME_OVER: 'game_over',
    SOWING: 'sowing'
};

/**
 * Player types
 */
export const PLAYER_TYPE = {
    HUMAN: 'human',
    COMPUTER: 'computer'
};