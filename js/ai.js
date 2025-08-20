import { GAME_CONFIG } from './config.js';

/**
 * Enhanced AI strategy for computer player
 */
export class MancalaAI {
    constructor(config = GAME_CONFIG) {
        this.config = config;
    }
    /**
     * Determines the best move for the computer
     * @param {Array} boardState - Current state of the board
     * @param {number} depth - Search depth for minimax (future enhancement)
     * @returns {number} Index of the best pit to play
     */
    getBestMove(boardState, depth = 1) {
        const validMoves = this._getValidMoves(boardState);
        
        if (validMoves.length === 0) {
            return -1;
        }

        // Enhanced strategy: prioritize moves that give more advantage
        let bestMove = validMoves[0];
        let bestScore = -Infinity;

        for (const move of validMoves) {
            const score = this._evaluateMove(boardState, move);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    /**
     * Get all valid moves for computer
     * @param {Array} boardState - Current state of the board
     * @returns {Array} Array of valid pit indices
     */
    _getValidMoves(boardState) {
        return this.config.COMPUTER_PITS_INDICES.filter(pitIdx => boardState[pitIdx] > 0);
    }

    /**
     * Evaluate the quality of a move
     * @param {Array} boardState - Current state of the board
     * @param {number} moveIndex - Index of the move to evaluate
     * @returns {number} Score for the move (higher is better)
     */
    _evaluateMove(boardState, moveIndex) {
        let score = 0;
        const seeds = boardState[moveIndex];

        // Strategy 1: Prefer moves with more seeds (spreads more)
        score += seeds * 2;

        // Strategy 2: Check if move lands in computer's store (would get extra turn in full rules)
        const landingPosition = (moveIndex + seeds) % this.config.TOTAL_PIT_POSITIONS;
        if (landingPosition === this.config.COMPUTER_STORE_INDEX) {
            score += 10; // Bonus for landing in own store
        }

        // Strategy 3: Avoid moves that give opponent many seeds
        const simulatedBoard = [...boardState];
        const { finalPosition } = this._simulateMove(simulatedBoard, moveIndex);
        
        // Check if final position helps opponent
        if (this.config.PLAYER_PITS_INDICES.includes(finalPosition) && simulatedBoard[finalPosition] === 1) {
            score -= 5; // Penalty for setting up opponent's move
        }

        // Strategy 4: Prefer moves that empty a pit (defensive)
        if (seeds === boardState[moveIndex]) {
            score += 3;
        }

        return score;
    }

    /**
     * Simulate a move to see the outcome
     * @param {Array} boardState - Board state to modify
     * @param {number} startIndex - Starting pit index
     * @returns {Object} Simulation result
     */
    _simulateMove(boardState, startIndex) {
        let seeds = boardState[startIndex];
        boardState[startIndex] = 0;
        let currentIndex = startIndex;

        while (seeds > 0) {
            currentIndex = (currentIndex + 1) % this.config.TOTAL_PIT_POSITIONS;
            
            // Skip opponent's store
            if (currentIndex === this.config.PLAYER_STORE_INDEX) {
                currentIndex = (currentIndex + 1) % this.config.TOTAL_PIT_POSITIONS;
            }

            boardState[currentIndex]++;
            seeds--;
        }

        return {
            finalPosition: currentIndex,
            boardState: boardState
        };
    }
}