document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const dealerCardsEl = document.getElementById('dealer-cards');
    const playerCardsEl = document.getElementById('player-cards');
    const dealerScoreEl = document.getElementById('dealer-score');
    const playerScoreEl = document.getElementById('player-score');
    const dealBtn = document.getElementById('deal-btn');
    const hitBtn = document.getElementById('hit-btn');
    const standBtn = document.getElementById('stand-btn');
    const totalChipsEl = document.getElementById('total-chips');
    const currentBetEl = document.getElementById('current-bet');
    const bettingControlsEl = document.getElementById('betting-controls');
    const gameMessageEl = document.getElementById('game-message');
    const playAgainBtn = document.getElementById('play-again-btn');

    // Name change elements
    const nameModal = document.getElementById('name-modal');
    const editNameBtn = document.getElementById('edit-name-btn');
    const saveNameBtn = document.getElementById('save-name-btn');
    const cancelNameBtn = document.getElementById('cancel-name-btn');
    const playerNameInput = document.getElementById('player-name-input');
    const playerNameDisplay = document.getElementById('player-name-display');
    const playerNameDisplayControls = document.getElementById('player-name-display-controls');
    
    // Start modal elements
    const startModal = document.getElementById('start-modal');
    const startGameBtn = document.getElementById('start-game-btn');
    const startingChipsInput = document.getElementById('starting-chips-input');

    // --- Game State Variables ---
    let deck = [];
    let playerHand = [];
    let dealerHand = [];
    let playerScore = 0;
    let dealerScore = 0;
    let totalChips = 0;
    let currentBet = 0;
    let gameInProgress = false;

    // --- Game Logic ---
    const suits = ['♥', '♦', '♣', '♠'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    /**
     * Creates a new deck of 52 cards and shuffles it.
     */
    function createDeck() {
        deck = [];
        for (let suit of suits) {
            for (let value of values) {
                deck.push({ suit, value });
            }
        }
        shuffleDeck();
    }
    
    /**
     * Shuffles the deck using Fisher-Yates algorithm.
     */
    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    /**
     * Calculates the score of a given hand.
     * @param {Array} hand - The hand to calculate the score for.
     * @returns {number} The calculated score.
     */
    function getHandScore(hand) {
        let score = 0;
        let numAces = 0;
        for (let card of hand) {
            if (card.value === 'A') {
                numAces++;
                score += 11;
            } else if (['K', 'Q', 'J'].includes(card.value)) {
                score += 10;
            } else {
                score += parseInt(card.value);
            }
        }
        while (score > 21 && numAces > 0) {
            score -= 10;
            numAces--;
        }
        return score;
    }

    /**
     * Creates a card element for the UI.
     * @param {Object} card - The card object {suit, value}.
     * @param {boolean} isHidden - Whether the card should be face down.
     * @returns {HTMLElement} The card element.
     */
    function createCardElement(card, isHidden = false) {
        const cardEl = document.createElement('div');
        cardEl.classList.add('card');

        const cardInner = document.createElement('div');
        cardInner.classList.add('card-inner');

        // Front of the card
        const cardFront = document.createElement('div');
        cardFront.classList.add('card-front');
        
        const valueEl = document.createElement('span');
        valueEl.textContent = card.value;
        valueEl.style.textAlign = 'center';
        valueEl.style.fontSize = '2rem';
        valueEl.style.lineHeight = '1';
        valueEl.style.alignSelf = 'center';
        valueEl.style.flexGrow = '1';
        valueEl.style.display = 'flex';
        valueEl.style.alignItems = 'center';

        const suitTop = document.createElement('span');
        suitTop.textContent = card.suit;
        suitTop.style.alignSelf = 'flex-start';

        const suitBottom = document.createElement('span');
        suitBottom.textContent = card.suit;
        suitBottom.style.alignSelf = 'flex-end';
        suitBottom.style.transform = 'rotate(180deg)';

        if (['♥', '♦'].includes(card.suit)) {
            cardFront.style.color = '#EF4444'; // red-500
        } else {
            cardFront.style.color = '#111827'; // gray-900
        }
        
        cardFront.appendChild(suitTop);
        cardFront.appendChild(valueEl);
        cardFront.appendChild(suitBottom);
        
        // Back of the card
        const cardBack = document.createElement('div');
        cardBack.classList.add('card-back');

        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        cardEl.appendChild(cardInner);
        
        if (isHidden) {
             cardEl.dataset.hiddenCard = JSON.stringify(card);
             cardInner.style.transform = 'rotateY(180deg)';
        }
        
        return cardEl;
    }
    
    /**
     * Flips the dealer's hidden card.
     */
    function flipDealerCard() {
        const hiddenCardEl = dealerCardsEl.querySelector('[data-hidden-card]');
        if (hiddenCardEl) {
            const cardInner = hiddenCardEl.querySelector('.card-inner');
            cardInner.style.transform = ''; // Remove rotation to flip face-up
            hiddenCardEl.removeAttribute('data-hidden-card');
        }
    }


    /**
     * Renders the hands and scores on the UI.
     */
    function renderGame() {
        // Render cards
        if(!gameInProgress && playerHand.length === 0) {
            dealerCardsEl.innerHTML = '';
            playerCardsEl.innerHTML = '';
        }
        
        // Render scores
        playerScore = getHandScore(playerHand);
        dealerScore = getHandScore(dealerHand);
        
        playerScoreEl.textContent = playerHand.length > 0 ? `(${playerScore})` : '';
        if(gameInProgress) {
           const visibleCardScore = getHandScore(dealerHand.slice(1));
           dealerScoreEl.textContent = `(${visibleCardScore})`;
        } else {
           dealerScoreEl.textContent = dealerHand.length > 0 ? `(${dealerScore})` : '';
        }

        // Render chips and bet
        totalChipsEl.textContent = `$${totalChips}`;
        currentBetEl.textContent = `$${currentBet}`;

        // Update button states
        dealBtn.disabled = gameInProgress || currentBet === 0;
        hitBtn.disabled = !gameInProgress;
        standBtn.disabled = !gameInProgress;
        
        // Disable bet chips if game is in progress
        bettingControlsEl.querySelectorAll('.chip').forEach(chip => {
            chip.disabled = gameInProgress;
            chip.classList.toggle('opacity-50', gameInProgress);
        });
    }

    /**
     * Starts a new round of the game.
     */
    function deal() {
        if (currentBet === 0) {
            showMessage("Place a bet to start!", "yellow");
            return;
        }
        if (currentBet > totalChips) {
            showMessage("Not enough chips!", "red");
            return;
        }

        gameInProgress = true;
        totalChips -= currentBet;
        
        createDeck();
        playerHand = [deck.pop(), deck.pop()];
        dealerHand = [deck.pop(), deck.pop()];
        
        // Clear previous cards before rendering new ones
        dealerCardsEl.innerHTML = '';
        playerCardsEl.innerHTML = '';
        dealerHand.forEach((card, index) => {
            dealerCardsEl.appendChild(createCardElement(card, index === 0 && gameInProgress));
        });
        playerHand.forEach(card => {
            playerCardsEl.appendChild(createCardElement(card));
        });

        showMessage("");
        renderGame();

        const playerScore = getHandScore(playerHand);
        if (playerScore === 21) {
            setTimeout(stand, 500);
        }
    }
    
    /**
     * Player action: hit (take another card).
     */
    function hit() {
        if (!gameInProgress) return;
        playerHand.push(deck.pop());
        playerCardsEl.appendChild(createCardElement(playerHand[playerHand.length - 1]));
        renderGame();
        if (playerScore > 21) {
            showMessage("Bust!", "red");
            setTimeout(stand, 1000);
        }
    }

    /**
     * Player action: stand (end turn).
     */
    function stand() {
        if (!gameInProgress && playerScore <= 21) return;
        hitBtn.disabled = true;
        standBtn.disabled = true;
        
        flipDealerCard();
        dealerScore = getHandScore(dealerHand);
        dealerScoreEl.textContent = `(${dealerScore})`;
        
        function dealerTurn() {
            dealerScore = getHandScore(dealerHand);

            if (dealerScore < 17) {
                dealerHand.push(deck.pop());
                const newCard = createCardElement(dealerHand[dealerHand.length - 1]);
                dealerCardsEl.appendChild(newCard);
                newCard.style.transform = 'translateX(20px)';
                setTimeout(() => { newCard.style.transform = ''; }, 50);

                dealerScoreEl.textContent = `(${getHandScore(dealerHand)})`;
                setTimeout(dealerTurn, 800);
            } else {
                endRound();
            }
        }
        setTimeout(dealerTurn, 800);
    }
    
    /**
     * Ends the current round and determines the winner.
     */
    function endRound() {
        gameInProgress = false;
        
        playerScore = getHandScore(playerHand);
        dealerScore = getHandScore(dealerHand);
        playerScoreEl.textContent = `(${playerScore})`;
        dealerScoreEl.textContent = `(${dealerScore})`;
        
        let playerBlackjack = playerScore === 21 && playerHand.length === 2;

        if (playerScore > 21) {
            showMessage("You Busted! Dealer Wins.", "red");
        } else if (dealerScore > 21) {
            showMessage("Dealer Busts! You Win!", "green");
            totalChips += currentBet * 2;
        } else if (playerBlackjack && dealerScore !== 21) {
            showMessage("Blackjack! You Win!", "green");
            totalChips += currentBet + (currentBet * 1.5);
        } else if (playerScore > dealerScore) {
            showMessage("You Win!", "green");
            totalChips += currentBet * 2;
        } else if (playerScore < dealerScore) {
            showMessage("Dealer Wins.", "red");
        } else {
            showMessage("Push (Tie).", "gray");
            totalChips += currentBet;
        }

        currentBet = 0;
        resetForNewRound();

        if(totalChips <= 0) {
            showMessage("Game Over! No more chips.", "red");
            playAgainBtn.classList.remove('hidden');
            dealBtn.disabled = true;
            bettingControlsEl.querySelectorAll('.chip').forEach(c => c.disabled = true);
        }
    }

    /**
     * Resets the UI for a new round.
     */
    function resetForNewRound() {
        gameInProgress = false;
        playerHand = [];
        dealerHand = [];
        renderGame();
        showMessage("Place your bet to begin!", "yellow");
    }
    
    /**
     * Shows a message on the UI.
     * @param {string} msg - The message to display.
     * @param {string} color - The color of the message (e.g., 'green', 'red', 'yellow').
     */
    function showMessage(msg, color = 'yellow') {
        gameMessageEl.textContent = msg;
        gameMessageEl.className = 'text-4xl font-bold drop-shadow-lg';
        switch (color) {
            case 'green': gameMessageEl.classList.add('text-green-400'); break;
            case 'red': gameMessageEl.classList.add('text-red-500'); break;
            case 'gray': gameMessageEl.classList.add('text-gray-400'); break;
            default: gameMessageEl.classList.add('text-yellow-400');
        }
    }

    // --- Event Listeners ---
    dealBtn.addEventListener('click', deal);
    hitBtn.addEventListener('click', hit);
    standBtn.addEventListener('click', stand);

    bettingControlsEl.addEventListener('click', e => {
        if (gameInProgress || totalChips <= 0) return;
        const target = e.target.closest('.chip');
        if (target) {
            const betAmount = parseInt(target.dataset.bet);
            if(totalChips >= betAmount){
                currentBet = betAmount;
                renderGame();
            } else {
                showMessage("Not enough chips for this bet!", "red");
            }
        }
    });

    // Name change modal listeners
    editNameBtn.addEventListener('click', () => {
        playerNameInput.value = playerNameDisplay.textContent;
        nameModal.classList.remove('hidden');
        setTimeout(() => nameModal.classList.remove('opacity-0'), 10);
    });

    cancelNameBtn.addEventListener('click', () => {
        nameModal.classList.add('opacity-0');
        setTimeout(() => nameModal.classList.add('hidden'), 300);
    });

    saveNameBtn.addEventListener('click', () => {
        const newName = playerNameInput.value.trim();
        if (newName) {
            playerNameDisplay.textContent = newName;
            playerNameDisplayControls.textContent = newName;
            nameModal.classList.add('opacity-0');
            setTimeout(() => nameModal.classList.add('hidden'), 300);
        }
    });

    // Starting modal listener
    startGameBtn.addEventListener('click', () => {
        const startingAmount = parseInt(startingChipsInput.value);
        if(startingAmount && startingAmount > 0){
            totalChips = startingAmount;
            
            startModal.classList.add('opacity-0');
            setTimeout(() => startModal.classList.add('hidden'), 300);
            
            playAgainBtn.classList.add('hidden');
            bettingControlsEl.querySelectorAll('.chip').forEach(c => c.disabled = false);
            resetForNewRound();
        }
    });
    
    playAgainBtn.addEventListener('click', () => {
        startModal.classList.remove('hidden');
        setTimeout(() => startModal.classList.remove('opacity-0'), 10);
    });

});