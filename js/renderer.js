import { GAME_CONFIG } from './config.js';

/**
 * Handles DOM manipulation and rendering for the Mancala game
 */
export class GameRenderer {
    constructor() {
        this.mancalaBoardElement = document.getElementById('mancalaBoard');
        this.turnIndicatorElement = document.getElementById('turnIndicator');
        this.statusMessageElement = document.getElementById('statusMessage');
        this.newGameButtonElement = document.getElementById('newGameButton');
        this.cachedElements = new Map(); // Cache DOM elements for better performance
    }

    /**
     * Render the complete board
     * @param {Array} boardState - Current state of the board
     * @param {boolean} isPlayerTurn - Whether it's currently the player's turn
     * @param {boolean} isGameActive - Whether the game is currently active
     */
    renderFullBoard(boardState, isPlayerTurn, isGameActive) {
        // Clear the board
        this.mancalaBoardElement.innerHTML = '';
        this.cachedElements.clear();

        // Create computer store
        const computerStoreEl = this._createStoreElement(
            GAME_CONFIG.COMPUTER_STORE_INDEX, 
            'computer-store', 
            boardState
        );
        this.mancalaBoardElement.appendChild(computerStoreEl);

        // Create pits area container
        const pitsAreaContainer = document.createElement('div');
        pitsAreaContainer.className = 'pits-area';

        // Add computer pits (top row, right to left)
        for (let i = GAME_CONFIG.COMPUTER_PITS_INDICES.length - 1; i >= 0; i--) {
            const pitIdx = GAME_CONFIG.COMPUTER_PITS_INDICES[i];
            const pitElement = this._createPitElement(pitIdx, 'computer-pit', boardState, false, false);
            pitsAreaContainer.appendChild(pitElement);
        }

        // Add player pits (bottom row, left to right)
        GAME_CONFIG.PLAYER_PITS_INDICES.forEach(pitIdx => {
            const pitElement = this._createPitElement(
                pitIdx, 
                'player-pit', 
                boardState, 
                isPlayerTurn && isGameActive, 
                isGameActive
            );
            pitsAreaContainer.appendChild(pitElement);
        });

        this.mancalaBoardElement.appendChild(pitsAreaContainer);

        // Create player store
        const playerStoreEl = this._createStoreElement(
            GAME_CONFIG.PLAYER_STORE_INDEX, 
            'player-store', 
            boardState
        );
        this.mancalaBoardElement.appendChild(playerStoreEl);
    }

    /**
     * Update only specific elements (performance optimization)
     * @param {Array} boardState - Current state of the board
     * @param {Array} changedIndices - Indices that have changed
     */
    updateElements(boardState, changedIndices) {
        changedIndices.forEach(index => {
            const element = this.cachedElements.get(index);
            if (element) {
                element.textContent = boardState[index];
            }
        });
    }

    /**
     * Create a pit element
     * @param {number} pitIndex - Index of the pit
     * @param {string} typeClass - CSS class for the pit type
     * @param {Array} boardState - Current board state
     * @param {boolean} isClickable - Whether the pit should be clickable
     * @param {boolean} isGameActive - Whether the game is active
     * @returns {HTMLElement} The pit element
     */
    _createPitElement(pitIndex, typeClass, boardState, isClickable, isGameActive) {
        const pitElement = document.createElement('div');
        pitElement.classList.add('pit', typeClass);
        pitElement.id = `pit-${pitIndex}`;
        pitElement.textContent = boardState[pitIndex];
        
        // Add ARIA attributes for accessibility
        pitElement.setAttribute('role', 'button');
        pitElement.setAttribute('aria-label', 
            `${typeClass === 'player-pit' ? 'Your' : 'Computer'} pit ${
                typeClass === 'player-pit' ? pitIndex + 1 : 
                GAME_CONFIG.COMPUTER_PITS_INDICES.indexOf(pitIndex) + 1
            } with ${boardState[pitIndex]} seeds`
        );

        if (typeClass === 'player-pit' && isGameActive) {
            if (boardState[pitIndex] > 0 && isClickable) {
                pitElement.setAttribute('tabindex', '0');
                pitElement.setAttribute('aria-disabled', 'false');
            } else {
                pitElement.classList.add('disabled-pit');
                pitElement.setAttribute('aria-disabled', 'true');
                pitElement.setAttribute('tabindex', '-1');
            }
        } else {
            pitElement.classList.add('disabled-pit');
            pitElement.setAttribute('aria-disabled', 'true');
            pitElement.setAttribute('tabindex', '-1');
        }

        this.cachedElements.set(pitIndex, pitElement);
        return pitElement;
    }

    /**
     * Create a store element
     * @param {number} storeIndex - Index of the store
     * @param {string} typeClass - CSS class for the store type
     * @param {Array} boardState - Current board state
     * @returns {HTMLElement} The store element
     */
    _createStoreElement(storeIndex, typeClass, boardState) {
        const storeElement = document.createElement('div');
        storeElement.classList.add('store', typeClass);
        storeElement.id = `store-${storeIndex}`;
        storeElement.textContent = boardState[storeIndex];
        
        // Add ARIA attributes for accessibility
        storeElement.setAttribute('role', 'status');
        storeElement.setAttribute('aria-label', 
            `${typeClass === 'player-store' ? 'Your' : 'Computer'} store with ${boardState[storeIndex]} seeds`
        );

        this.cachedElements.set(storeIndex, storeElement);
        return storeElement;
    }

    /**
     * Update the turn display
     * @param {boolean} isPlayerTurn - Whether it's the player's turn
     */
    updateTurnDisplay(isPlayerTurn) {
        this.turnIndicatorElement.textContent = isPlayerTurn ? "Your Turn" : "Computer's Turn";
        
        // Update visual indicators
        const playerLabel = document.querySelector('.player-label');
        const computerLabel = document.querySelector('.computer-label');
        
        if (playerLabel && computerLabel) {
            playerLabel.style.boxShadow = isPlayerTurn ? '0 0 10px 2px #3B82F6' : 'none';
            computerLabel.style.boxShadow = !isPlayerTurn ? '0 0 10px 2px #8B5CF6' : 'none';
        }
    }

    /**
     * Update status message
     * @param {string} message - Message to display
     */
    updateStatusMessage(message) {
        this.statusMessageElement.textContent = message;
    }

    /**
     * Add highlight effect to an element
     * @param {number} elementIndex - Index of the element to highlight
     */
    addHighlight(elementIndex) {
        const element = this.cachedElements.get(elementIndex);
        if (element) {
            element.classList.add('highlight-pit');
        }
    }

    /**
     * Remove highlight effect from an element
     * @param {number} elementIndex - Index of the element to remove highlight from
     */
    removeHighlight(elementIndex) {
        const element = this.cachedElements.get(elementIndex);
        if (element) {
            element.classList.remove('highlight-pit');
        }
    }

    /**
     * Focus the new game button (for accessibility)
     */
    focusNewGameButton() {
        this.newGameButtonElement.focus();
    }

    /**
     * Get a cached element by index
     * @param {number} index - Element index
     * @returns {HTMLElement|null} The cached element or null
     */
    getElement(index) {
        return this.cachedElements.get(index) || null;
    }
}