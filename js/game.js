import { GAME_CONFIG, GAME_STATE, PLAYER_TYPE } from './config.js';
import { MancalaAI } from './ai.js';
import { GameRenderer } from './renderer.js';
import { GameConfig } from './gameConfig.js';

/**
 * Main Mancala game engine
 */
export class MancalaGame {
    constructor(customConfig = {}) {
        this.config = new GameConfig(customConfig);
        this.boardState = [];
        this.isPlayerTurn = true;
        this.gameState = GAME_STATE.PLAYER_TURN;
        this.ai = new MancalaAI(this.config);
        this.renderer = new GameRenderer();
        this.currentSowingInterval = null;
        
        this._initializeEventListeners();
    }

    /**
     * Initialize the game
     */
    initializeGame() {
        try {
            // Reset board state
            this.boardState = new Array(this.config.TOTAL_PIT_POSITIONS).fill(0);
            this.config.PLAYER_PITS_INDICES.forEach(pitIdx => {
                this.boardState[pitIdx] = this.config.INITIAL_SEEDS_PER_PIT;
            });
            this.config.COMPUTER_PITS_INDICES.forEach(pitIdx => {
                this.boardState[pitIdx] = this.config.INITIAL_SEEDS_PER_PIT;
            });

            // Reset game state
            this.isPlayerTurn = true;
            this.gameState = GAME_STATE.PLAYER_TURN;

            // Update UI
            this.renderer.renderFullBoard(this.boardState, this.isPlayerTurn, true);
            this.renderer.updateTurnDisplay(this.isPlayerTurn);
            this.renderer.updateStatusMessage("Player's turn. Click one of your pits.");

            // Add click listeners to player pits
            this._enablePlayerPits();
        } catch (error) {
            console.error('Error initializing game:', error);
            this.renderer.updateStatusMessage('Error starting game. Please refresh the page.');
        }
    }

    /**
     * Handle player move
     * @param {number} pitIndex - Index of the selected pit
     */
    handlePlayerMove(pitIndex) {
        try {
            // Validate move
            if (!this._isValidPlayerMove(pitIndex)) {
                const message = this.boardState[pitIndex] === 0 ? 
                    "Cannot select an empty pit." : 
                    "Invalid move or not your turn.";
                this.renderer.updateStatusMessage(message);
                return;
            }

            this.gameState = GAME_STATE.SOWING;
            this.renderer.updateStatusMessage("Sowing seeds...");
            this._disablePlayerPits();
            this._processSow(pitIndex);
        } catch (error) {
            console.error('Error handling player move:', error);
            this.renderer.updateStatusMessage('Error processing move. Please try again.');
            this._enablePlayerPits();
        }
    }

    /**
     * Process the sowing of seeds with animation
     * @param {number} startIndex - Starting pit index
     */
    _processSow(startIndex) {
        const seedsToDistribute = this.boardState[startIndex];
        this.boardState[startIndex] = 0;
        let currentPitIndex = startIndex;
        let seedsSownCount = 0;

        // Highlight starting pit
        this.renderer.addHighlight(startIndex);

        this.currentSowingInterval = setInterval(() => {
            try {
                if (seedsSownCount === seedsToDistribute) {
                    clearInterval(this.currentSowingInterval);
                    this.currentSowingInterval = null;
                    this.renderer.removeHighlight(startIndex);
                    this._finalizeMove(currentPitIndex);
                    return;
                }

                // Move to next position
                currentPitIndex = (currentPitIndex + 1) % this.config.TOTAL_PIT_POSITIONS;

                // Skip opponent's store
                if (this.isPlayerTurn && currentPitIndex === this.config.COMPUTER_STORE_INDEX) {
                    currentPitIndex = (currentPitIndex + 1) % this.config.TOTAL_PIT_POSITIONS;
                } else if (!this.isPlayerTurn && currentPitIndex === this.config.PLAYER_STORE_INDEX) {
                    currentPitIndex = (currentPitIndex + 1) % this.config.TOTAL_PIT_POSITIONS;
                }

                // Add seed to current position
                this.boardState[currentPitIndex]++;
                seedsSownCount++;

                // Update display with animation
                this.renderer.updateElements(this.boardState, [currentPitIndex]);
                this.renderer.addHighlight(currentPitIndex);
                
                setTimeout(() => {
                    this.renderer.removeHighlight(currentPitIndex);
                }, this.config.HIGHLIGHT_DURATION);

            } catch (error) {
                console.error('Error during sowing:', error);
                if (this.currentSowingInterval) {
                    clearInterval(this.currentSowingInterval);
                    this.currentSowingInterval = null;
                }
                this._handleSowingError();
            }
        }, this.config.SOWING_SPEED);
    }

    /**
     * Finalize the move after sowing
     * @param {number} lastPitIndex - Index where the last seed was placed
     */
    _finalizeMove(lastPitIndex) {
        try {
            // Re-render the full board to ensure consistency
            this.renderer.renderFullBoard(this.boardState, this.isPlayerTurn, true);

            // Switch turns (simplified rules - always switch)
            this.isPlayerTurn = !this.isPlayerTurn;
            this.gameState = this.isPlayerTurn ? GAME_STATE.PLAYER_TURN : GAME_STATE.COMPUTER_TURN;
            this.renderer.updateTurnDisplay(this.isPlayerTurn);

            // Check for game over
            if (this._checkIfGameOver()) {
                this._triggerEndGame();
            } else {
                if (!this.isPlayerTurn) {
                    this.renderer.updateStatusMessage("Computer is thinking...");
                    setTimeout(() => this._initiateComputerMove(), this.config.COMPUTER_THINK_TIME);
                } else {
                    this.renderer.updateStatusMessage("Your turn.");
                    this._enablePlayerPits();
                }
            }
        } catch (error) {
            console.error('Error finalizing move:', error);
            this.renderer.updateStatusMessage('Error completing move. Please start a new game.');
        }
    }

    /**
     * Initiate computer move
     */
    _initiateComputerMove() {
        try {
            if (this.gameState === GAME_STATE.GAME_OVER) return;

            this.renderer.updateStatusMessage("Computer is making a move...");
            this._disablePlayerPits();

            const bestMoveIndex = this.ai.getBestMove(this.boardState);

            if (bestMoveIndex !== -1) {
                const computerPitDisplayNumber = this.config.COMPUTER_PITS_INDICES
                    .slice()
                    .reverse()
                    .indexOf(bestMoveIndex) + 1;
                
                this.renderer.updateStatusMessage(`Computer chose pit ${computerPitDisplayNumber}. Sowing...`);
                this._processSow(bestMoveIndex);
            } else {
                // Fallback if no move found (should not happen if game over is handled)
                this.isPlayerTurn = true;
                this.gameState = GAME_STATE.PLAYER_TURN;
                this.renderer.updateTurnDisplay(this.isPlayerTurn);
                this._enablePlayerPits();
                this.renderer.updateStatusMessage("Computer pass. Your turn.");
            }
        } catch (error) {
            console.error('Error during computer move:', error);
            this.renderer.updateStatusMessage('Computer move failed. Your turn.');
            this.isPlayerTurn = true;
            this.gameState = GAME_STATE.PLAYER_TURN;
            this._enablePlayerPits();
        }
    }

    /**
     * Check if the game is over
     * @returns {boolean} True if game is over
     */
    _checkIfGameOver() {
        const playerPitsSum = this.config.PLAYER_PITS_INDICES
            .reduce((sum, idx) => sum + this.boardState[idx], 0);
        const computerPitsSum = this.config.COMPUTER_PITS_INDICES
            .reduce((sum, idx) => sum + this.boardState[idx], 0);
        
        return playerPitsSum === 0 || computerPitsSum === 0;
    }

    /**
     * Trigger the end of the game
     */
    _triggerEndGame() {
        this.gameState = GAME_STATE.GAME_OVER;
        this.renderer.updateStatusMessage("Game Over! Collecting remaining seeds...");
        this._disablePlayerPits();

        // Collect remaining seeds
        this.config.PLAYER_PITS_INDICES.forEach(pitIdx => {
            this.boardState[this.config.PLAYER_STORE_INDEX] += this.boardState[pitIdx];
            this.boardState[pitIdx] = 0;
        });
        
        this.config.COMPUTER_PITS_INDICES.forEach(pitIdx => {
            this.boardState[this.config.COMPUTER_STORE_INDEX] += this.boardState[pitIdx];
            this.boardState[pitIdx] = 0;
        });

        this.renderer.renderFullBoard(this.boardState, false, false);

        // Determine winner
        const playerScore = this.boardState[this.config.PLAYER_STORE_INDEX];
        const computerScore = this.boardState[this.config.COMPUTER_STORE_INDEX];
        
        let finalMessage = "Game Over! ";
        if (playerScore > computerScore) {
            finalMessage += `You win! ${playerScore} - ${computerScore}`;
        } else if (computerScore > playerScore) {
            finalMessage += `Computer wins! ${computerScore} - ${playerScore}`;
        } else {
            finalMessage += `It's a tie! ${playerScore} - ${computerScore}`;
        }

        this.renderer.updateStatusMessage(finalMessage);
        this.renderer.turnIndicatorElement.textContent = "Game Finished";
        this.renderer.focusNewGameButton();
    }

    /**
     * Validate if a player move is legal
     * @param {number} pitIndex - Index of the pit to validate
     * @returns {boolean} True if move is valid
     */
    _isValidPlayerMove(pitIndex) {
        return this.gameState === GAME_STATE.PLAYER_TURN &&
               this.isPlayerTurn &&
               this.config.PLAYER_PITS_INDICES.includes(pitIndex) &&
               this.boardState[pitIndex] > 0;
    }

    /**
     * Enable player pit interactions
     */
    _enablePlayerPits() {
        this.config.PLAYER_PITS_INDICES.forEach(idx => {
            const pitEl = this.renderer.getElement(idx);
            if (pitEl && this.boardState[idx] > 0 && this.gameState === GAME_STATE.PLAYER_TURN) {
                pitEl.classList.remove('disabled-pit');
                pitEl.setAttribute('aria-disabled', 'false');
                pitEl.setAttribute('tabindex', '0');
                
                // Remove existing listeners and add new one
                const newPitEl = pitEl.cloneNode(true);
                newPitEl.addEventListener('click', () => this.handlePlayerMove(idx));
                newPitEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.handlePlayerMove(idx);
                    }
                });
                pitEl.parentNode.replaceChild(newPitEl, pitEl);
                this.renderer.cachedElements.set(idx, newPitEl);
            }
        });
    }

    /**
     * Disable player pit interactions
     */
    _disablePlayerPits() {
        this.config.PLAYER_PITS_INDICES.forEach(idx => {
            const pitEl = this.renderer.getElement(idx);
            if (pitEl) {
                pitEl.classList.add('disabled-pit');
                pitEl.setAttribute('aria-disabled', 'true');
                pitEl.setAttribute('tabindex', '-1');
                // Remove event listeners by cloning
                const newPitEl = pitEl.cloneNode(true);
                pitEl.parentNode.replaceChild(newPitEl, pitEl);
                this.renderer.cachedElements.set(idx, newPitEl);
            }
        });
    }

    /**
     * Handle errors during sowing
     */
    _handleSowingError() {
        this.renderer.updateStatusMessage('Error during move. Please start a new game.');
        this.gameState = GAME_STATE.GAME_OVER;
    }

    /**
     * Initialize event listeners
     */
    _initializeEventListeners() {
        // New game button
        this.renderer.newGameButtonElement.addEventListener('click', () => this.initializeGame());
        
        // Keyboard accessibility for new game button
        this.renderer.newGameButtonElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.initializeGame();
            }
        });

        // Initialize game when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => this.initializeGame());
    }
}