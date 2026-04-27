const canva = document.getElementById("canvas");
const ctx = canva.getContext("2d");

// ========== DRAWING FUNCTIONS ==========

function drawRoundRect(ctx, x, y, width, height, radius, mainColor, borderColor) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fillStyle = mainColor || "white";
    ctx.fill();
    ctx.strokeStyle = borderColor || "black";
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawCheckboard(width, height, firstColor, secondColor, tileSize) {
    tileSize = Math.max(tileSize, 10);
    for (let i = 0; i < width; i += tileSize) {
        for (let g = 0; g < height; g += tileSize) {
            ctx.fillStyle = (i / tileSize + g / tileSize) % 2 === 0 ? firstColor : secondColor;
            ctx.fillRect(i, g, tileSize, tileSize);
        }
    }
}

function drawCard(x, y, id, rotation = 0) {
    const width = 100;
    const height = 140;
    let suit = ["♥", "♦", "♠", "♣"][Math.floor(id / 13)];
    let color = Math.floor(id / 13) < 2 ? "red" : "black";
    let value = (id % 13) + 1;
    let rank = { 1: "A", 11: "J", 12: "Q", 13: "K" }[value] || value.toString();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    drawRoundRect(ctx, -width / 2, -height / 2, width, height, 10, "white", "black");
    
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.font = "bold 20px Arial";
    ctx.fillText(rank, -width / 2 + 18, -height / 2 + 25);
    ctx.fillText(suit, -width / 2 + 18, -height / 2 + 45);
    
    ctx.font = "bold 50px Arial";
    ctx.fillText(suit, 0, 15);

    ctx.rotate(Math.PI);
    ctx.font = "bold 20px Arial";
    ctx.fillText(rank, -width / 2 + 18, -height / 2 + 25);
    ctx.fillText(suit, -width / 2 + 18, -height / 2 + 45);
    ctx.restore();
}

function drawCardBack(x, y) {
    ctx.save();
    ctx.translate(x, y);
    drawRoundRect(ctx, -50, -70, 100, 140, 10, "#000080", "#0000ff");
    ctx.fillStyle = "#0000ff";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("?", 0, 10);
    ctx.restore();
}

// ========== CARD RING CLASS ==========

class CardRing {
    constructor(centerX, centerY, distance, cardCount, speed) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.distance = distance;
        this.cardCount = cardCount;
        this.speed = speed;
        this.angle = 0;
        this.cardIds = [];
        for (let i = 0; i < cardCount; i++) {
            this.cardIds.push(Math.floor(Math.random() * 52));
        }
    }

    updateAndDraw() {
        this.angle += this.speed;
        for (let i = 0; i < this.cardCount; i++) {
            let offsetAngle = this.angle + (i / this.cardCount) * (Math.PI * 2);
            let x = this.centerX + Math.cos(offsetAngle) * this.distance;
            let y = this.centerY + Math.sin(offsetAngle) * this.distance;
            let cardRotation = offsetAngle + Math.PI / 2;
            drawCard(x, y, this.cardIds[i], cardRotation);
        }
    }
}

// ========== CARD CLASS ==========

class Card {
    constructor(id) {
        this.id = id;
    }

    getValue() {
        const rank = this.id % 13 + 1;
        if (rank === 1) return 11; // Ace
        if (rank > 10) return 10;  // Face cards
        return rank;
    }
}

// ========== DECK CLASS ==========

class Deck {
    constructor(numberOfDecks = 1) {
        this.cards = [];
        for (let i = 0; i < 52 * numberOfDecks; i++) {
            this.cards.push(new Card(i % 52));
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    drawCard() {
        if (this.cards.length === 0) {
            return null;
        }
        return this.cards.pop();
    }

    getRemainingCards() {
        return this.cards.length;
    }
}

// ========== PLAYER CLASS ==========

class Player {
    constructor() {
        this.hand = [];
    }

    getHandValue() {
        let totalValue = 0;
        let aces = 0;

        for (let card of this.hand) {
            let value = card.getValue();
            totalValue += value;
            if (value === 11) aces++;
        }

        while (totalValue > 21 && aces > 0) {
            totalValue -= 10;
            aces--;
        }

        return totalValue;
    }

    addCard(card) {
        if (card) {
            this.hand.push(card);
        }
    }

    clearHand() {
        this.hand = [];
    }

    isBusted() {
        return this.getHandValue() > 21;
    }

    isBlackjack() {
        return this.hand.length === 2 && this.getHandValue() === 21;
    }

    isSoftHand() {
        let aces = 0;
        let total = 0;
        for (let card of this.hand) {
            let val = card.getValue();
            total += val;
            if (val === 11) aces++;
        }
        return aces > 0 && total <= 21;
    }
}

// ========== DEALER CLASS ==========

class Dealer extends Player {
    constructor() {
        super();
    }

    shouldHit() {
        let value = this.getHandValue();
        if (value < 17) return true;
        if (value === 17 && this.isSoftHand()) return true;
        return false;
    }
}

// ========== GAME STATE ==========

let gameState = "menu"; // "menu" or "game"
let gamePhase = "menu"; // "menu", "playerTurn", "dealerTurn", "showdown"

let player = null;
let dealer = null;
let deck = null;
let gameResult = null;

const innerinnerRing = new CardRing(500, 300, 210, 6, -0.0075);
const outerRing = new CardRing(500, 300, 420, 16, 0.0035);

// ========== GAME FUNCTIONS ==========

function initGame() {
    deck = new Deck(1);
    deck.shuffle();
    
    player = new Player();
    dealer = new Dealer();
    
    // Deal 2 cards each
    player.addCard(deck.drawCard());
    dealer.addCard(deck.drawCard());
    player.addCard(deck.drawCard());
    dealer.addCard(deck.drawCard());
    
    gamePhase = "playerTurn";
    gameResult = null;
}

function dealerTurn() {
    while (dealer.shouldHit()) {
        let card = deck.drawCard();
        if (card) {
            dealer.addCard(card);
        }
    }
    determineWinner();
}

function determineWinner() {
    gamePhase = "showdown";

    // Check for blackjacks
    const playerBJ = player.isBlackjack();
    const dealerBJ = dealer.isBlackjack();

    if (playerBJ && dealerBJ) {
        gameResult = "Push - Both have Blackjack!";
    } else if (playerBJ) {
        gameResult = "Player Blackjack! You Win!";
    } else if (dealerBJ) {
        gameResult = "Dealer Blackjack! Dealer Wins!";
    } else if (player.isBusted()) {
        gameResult = "You Busted! Dealer Wins!";
    } else if (dealer.isBusted()) {
        gameResult = "Dealer Busted! You Win!";
    } else {
        const pValue = player.getHandValue();
        const dValue = dealer.getHandValue();
        if (pValue > dValue) {
            gameResult = "You Win!";
        } else if (pValue < dValue) {
            gameResult = "Dealer Wins!";
        } else {
            gameResult = "Push!";
        }
    }
}

function drawMenu() {
    const buttons = [
        { y: 125, label: "Play" },
        { y: 250, label: "Settings" },
        { y: 375, label: "Quit" }
    ];

    buttons.forEach(btn => {
        drawRoundRect(ctx, canva.width / 2 - 200, btn.y, 400, 80, 20, "#007700", "#00ff00");
        ctx.fillStyle = "white";
        ctx.font = "bold 50px Arial";
        ctx.textAlign = "center";
        ctx.fillText(btn.label, 500, btn.y + 58);
    });
}

function drawGameUI() {
    if (!player || !dealer) return;

    // Draw dealer cards
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Dealer", 50, 60);
    
    for (let i = 0; i < dealer.hand.length; i++) {
        if (gamePhase !== "showdown" && i === 1) {
            drawCardBack(150 + i * 120, 120);
        } else {
            drawCard(150 + i * 120, 120, dealer.hand[i].id);
        }
    }
    
    let dealerValue = gamePhase === "showdown" ? dealer.getHandValue() : "?";
    ctx.fillText("Value: " + dealerValue, 50, 280);

    // Draw player cards
    ctx.fillText("You", 50, 380);
    for (let i = 0; i < player.hand.length; i++) {
        drawCard(150 + i * 120, 440, player.hand[i].id);
    }
    ctx.fillText("Value: " + player.getHandValue(), 50, 550);

    // Draw buttons during player turn
    if (gamePhase === "playerTurn") {
        // Hit button
        drawRoundRect(ctx, 700, 450, 120, 60, 10, "#007700", "#00ff00");
        ctx.fillStyle = "white";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Hit (H)", 760, 490);

        // Stand button
        drawRoundRect(ctx, 850, 450, 120, 60, 10, "#770000", "#ff0000");
        ctx.fillText("Stand (S)", 910, 490);
    }

    // Draw result and instructions
    if (gameResult) {
        ctx.font = "bold 32px Arial";
        ctx.fillStyle = "yellow";
        ctx.textAlign = "center";
        ctx.fillText(gameResult, 500, 300);
        ctx.font = "20px Arial";
        ctx.fillStyle = "white";
        ctx.fillText("Press N for New Game", 500, 350);
    } else if (gamePhase === "playerTurn") {
        ctx.font = "20px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("H = Hit  |  S = Stand", 500, 300);
    }
}

// ========== INPUT HANDLING ==========

document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();

    if (gameState === "menu") {
        if (key === "p") {
            gameState = "game";
            initGame();
        }
        if (key === "q") window.close();
    } else if (gameState === "game") {
        if (key === "m") {
            gameState = "menu";
            gamePhase = "menu";
        }
        if (key === "h" && gamePhase === "playerTurn") {
            let card = deck.drawCard();
            if (card) {
                player.addCard(card);
                if (player.isBusted()) {
                    gamePhase = "showdown";
                    determineWinner();
                }
            }
        }
        if (key === "s" && gamePhase === "playerTurn") {
            gamePhase = "dealerTurn";
        }
        if (key === "n" && gamePhase === "showdown") {
            initGame();
        }
    }
});

canva.addEventListener("click", (e) => {
    const rect = canva.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (gameState === "menu") {
        // Play button
        if (x >= 300 && x <= 700 && y >= 125 && y <= 205) {
            gameState = "game";
            initGame();
        }
        // Settings button
        else if (x >= 300 && x <= 700 && y >= 250 && y <= 330) {
            alert("No settings yet!");
        }
        // Quit button
        else if (x >= 300 && x <= 700 && y >= 375 && y <= 455) {
            alert("Goodbye!");
        }
    } else if (gameState === "game") {
        if (gamePhase === "playerTurn") {
            // Hit button: 700-820, 450-510
            if (x >= 700 && x <= 820 && y >= 450 && y <= 510) {
                let card = deck.drawCard();
                if (card) {
                    player.addCard(card);
                    if (player.isBusted()) {
                        gamePhase = "showdown";
                        determineWinner();
                    }
                }
            }
            // Stand button: 850-970, 450-510
            else if (x >= 850 && x <= 970 && y >= 450 && y <= 510) {
                gamePhase = "dealerTurn";
            }
        }
    }
});

canva.addEventListener("mousemove", (e) => {
    const rect = canva.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let isHovering = false;

    if (gameState === "menu") {
        if ((x >= 300 && x <= 700) && 
            ((y >= 125 && y <= 205) || (y >= 250 && y <= 330) || (y >= 375 && y <= 455))) {
            isHovering = true;
        }
    } else if (gameState === "game" && gamePhase === "playerTurn") {
        if ((x >= 700 && x <= 820 && y >= 450 && y <= 510) ||
            (x >= 850 && x <= 970 && y >= 450 && y <= 510)) {
            isHovering = true;
        }
    }

    canva.style.cursor = isHovering ? "pointer" : "default";
});

// ========== MAIN LOOP ==========

function mainLoop() {
    ctx.clearRect(0, 0, canva.width, canva.height);
    drawCheckboard(1000, 600, "#005500", "#006000", 25);

    if (gameState === "menu") {
        innerinnerRing.updateAndDraw();
        outerRing.updateAndDraw();
        drawMenu();
    } else if (gameState === "game") {
        // Handle dealer turn
        if (gamePhase === "dealerTurn") {
            dealerTurn();
        }

        drawGameUI();
    }

    requestAnimationFrame(mainLoop);
}

mainLoop();
