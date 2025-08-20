/**
 * Game configuration object that can be customized
 */
export class GameConfig {
    constructor(customConfig = {}) {
        // Default configuration
        const defaultConfig = {
            PLAYER_PITS_INDICES: [0, 1, 2, 3, 4, 5],
            PLAYER_STORE_INDEX: 6,
            COMPUTER_PITS_INDICES: [7, 8, 9, 10, 11, 12],
            COMPUTER_STORE_INDEX: 13,
            TOTAL_PIT_POSITIONS: 14,
            INITIAL_SEEDS_PER_PIT: 4,
            SOWING_SPEED: 250, // milliseconds
            HIGHLIGHT_DURATION: 180, // milliseconds
            COMPUTER_THINK_TIME: 1500, // milliseconds
            AI_DIFFICULTY: 'normal' // 'easy', 'normal', 'hard'
        };

        // Merge with custom configuration
        Object.assign(this, defaultConfig, customConfig);
        
        // Validate configuration
        this._validateConfig();
    }

    /**
     * Validate the configuration for consistency
     */
    _validateConfig() {
        if (this.INITIAL_SEEDS_PER_PIT < 1) {
            console.warn('Initial seeds per pit must be at least 1. Setting to 1.');
            this.INITIAL_SEEDS_PER_PIT = 1;
        }

        if (this.SOWING_SPEED < 50) {
            console.warn('Sowing speed too fast. Setting to minimum 50ms.');
            this.SOWING_SPEED = 50;
        }

        if (this.COMPUTER_THINK_TIME < 500) {
            console.warn('Computer think time too short. Setting to minimum 500ms.');
            this.COMPUTER_THINK_TIME = 500;
        }
    }

    /**
     * Create a preset configuration
     * @param {string} preset - Preset name ('classic', 'quick', 'challenge')
     * @returns {GameConfig} New configuration instance
     */
    static createPreset(preset) {
        const presets = {
            classic: {
                INITIAL_SEEDS_PER_PIT: 4,
                SOWING_SPEED: 250,
                COMPUTER_THINK_TIME: 1500,
                AI_DIFFICULTY: 'normal'
            },
            quick: {
                INITIAL_SEEDS_PER_PIT: 3,
                SOWING_SPEED: 150,
                COMPUTER_THINK_TIME: 800,
                AI_DIFFICULTY: 'easy'
            },
            challenge: {
                INITIAL_SEEDS_PER_PIT: 6,
                SOWING_SPEED: 200,
                COMPUTER_THINK_TIME: 2000,
                AI_DIFFICULTY: 'hard'
            }
        };

        if (!presets[preset]) {
            console.warn(`Unknown preset '${preset}'. Using 'classic'.`);
            preset = 'classic';
        }

        return new GameConfig(presets[preset]);
    }
}