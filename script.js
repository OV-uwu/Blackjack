const canva = document.getElementById("canvas");
const ctx = canva.getContext("2d");

//Drawing functions
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
    
    drawRoundRect(ctx, -width / 2, -height / 2, width, height, 10);
    
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

function drawCardBack(x, y, rotation = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    drawRoundRect(ctx, -50, -70, 100, 140, 10, "#000080", "#0000ff");
    ctx.fillStyle = "blue";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("?", 0, 10);
    ctx.restore();
}

//Classes 

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

class Card {
    constructor(id) {
            this.id = id;
    }

    getValue(){
        const rank = this.id % 13 + 1;
        if (rank === 1) return 11;
        if (rank > 10) return 10;
        return rank;
    }

    getCardID(){return this.id};
    
}

class Deck {
    constructor(numberOfDecks = 1) {
        this.isEmpty = false; //Kanske ta bort men senare
        this.cards = [];
        for (let i = 0; i < numberOfDecks; i++) {
            for (let i = 0; i < 52; i++) {
                this.cards.push(new Card(i));
            }
        }
    }

    checkIfEmpty(){
        this.isEmpty = this.cards.length === 0;
        return this.isEmpty;
    }

    notEnoughCardsForRound(players){
        let needed = players * 2 + 2;
        return this.cards.length < needed;
    }

    getRemainingCards(){
        return this.cards.length;
    }

    shuffle(){
        let n = this.cards.length;

        while(n > 1 ){
            n--;
            let k = Math.floor(Math.random() * (n + 1));
            [this.cards[k], this.cards[n]] = [this.cards[n], this.cards[k]];
        }
    }

    drawCard(){
        if(this.checkIfEmpty()){
            alert("Deck is empty! Cannot draw more cards.");
            return null;
        }
        return this.cards.pop();
    }
    
    restoreDeck(){
        this.isEmpty = false;
        this.cards = [];
        for (let i = 0; i < 52; i++) {
            this.cards.push(new Card(i));
        }
    }

    printDeck(){
        console.log("Deck contains:");
        this.cards.forEach(card => {
            console.log(`Card ID: ${card.getCardID()}, Value: ${card.getValue()}`);
        });
    }

}

class Player {
    constructor(numberOfDecks = 1) {
        this.hand = []; //Array med kortobjekt som spelaren har på handen
        this.resulst = new Array(); //Array med karaktärer som visar resultatet av handen, t.ex. "win", "lose", "blackjack", "busted"
    }

    getResults(){
        return this.resulst;
    }

    addWin(){this.resulst.push("w")}
    addLoss(){this.resulst.push("l")}
    addPush(){this.resulst.push("p")}
    addBlackjack(){this.resulst.push("b")}

    takeCard(card){
        if (card === null) {return;}
        this.hand.push(card);
    }

    clearHand(){
        this.hand = [];
    }

    getHandValue(){
        let totalValue = 0;
        let aceCount = 0;
        
        this.hand.forEach(function(cardInHand){
        let value = cardInHand.getValue();
        totalValue += value;
        if (value === 11) { aceCount++; }
    });
        while (totalValue > 21 && aceCount > 0) {
            totalValue -= 10;
            aceCount--;
        }
        return totalValue;
    }

    isBursted(){
        if (this.getHandValue() > 21) {return true;}
        return false;
    }

    isBlackjack(){
        if (this.hand.length === 2 && this.getHandValue() === 21) {return true;}
        return false;
    }

    isSoftHand(){
        let aces = 0;
        let totalValue = 0;

        this.hand.forEach(function(cardInHand){
            let v = cardInHand.getValue();
            totalValue += v;
            if (v === 11) { aces++; }
    });
        return aces > 0 && totalValue <= 21;
    }

    takeACardChoice(){
        let basic = this.BasicStrategy();

        if (this.cardCounting()) { return !basic; }
        return basic;
    }

    BasicStrategy(){
        if (!gameDealer || gameDealer.hand.length === 0) return false;
        let handValue = this.getHandValue();
        let dealerUpCardValue = gameDealer.hand[0] ? gameDealer.hand[0].getValue() : 0;

        if (dealerUpCardValue === 11){dealerUpCardValue = 11;};
        if (dealerUpCardValue > 10){dealerUpCardValue = 10;};

        let soft = this.isSoftHand();

        if (soft) {
            if (handValue >= 19) {return false;}
            if (handValue === 18) {
                if (dealerUpCardValue >= 9 || dealerUpCardValue === 11) {return true;}
                return false;
            }
            if (handValue === 17) {
                if (dealerUpCardValue >= 7) {return true;}
                return false;
            }
            if (handValue <= 16) {
                return true;
            }
        }
        else{
            if (handValue >= 17) {return false;}
            if (handValue >= 13 && handValue <= 16) {
                if (dealerUpCardValue >= 7) {return true;}
                return false;
            }
            if (handValue === 12) {
                if (dealerUpCardValue >= 4 && dealerUpCardValue <= 6) {return false;}
                return true;
            }
            if (handValue <= 11) {
                return true;
            }
        }
        return true;
    }

    cardCounting(){
        return false;
    }
}

class Dealer extends Player {
    constructor(numberOfDecks = 1) {
        super(numberOfDecks);
    }

    basicStrategy(){
        let handValue = this.getHandValue();
        if (handValue <= 16) {return true;}
        if (handValue === 17 /*&& this.isSoftHand()*/) {return true;}
        return false;
    }

    takeACardChoice(){
        return this.basicStrategy();
    }
}

// Main game 

let gameState = "menu";

const innerinnerRing = new CardRing(500, 300, 210, 6, -0.0075);
const outerRing = new CardRing(500, 300, 420, 16, 0.0035);

let gamePlayer = null;
let gameDealer = null;
let gameDeck = new Deck(1);
let gamePhase = "menu";
let gameResult = null;
let dealerHasPlayed = false;

// Money system
let playerBalance = 1000;
let currentBet = 0;
const betAmounts = [50, 100, 250, 500];
let selectedBetIndex = 0;

function startBetting() {
    gamePhase = "betting";
    selectedBetIndex = 0;
    currentBet = betAmounts[selectedBetIndex];

}

function placeBet(betAmount) {
    if (betAmount <= playerBalance) {
        currentBet = betAmount;
        playerBalance -= betAmount;
        if (gameDeck.getRemainingCards() < 52) {
            gameDeck = new Deck(2);
            gameDeck.shuffle();
            console.log("Deck reshuffled!");
        }
        gamePlayer = new Player();
        gameDealer = new Dealer();
        
        gamePlayer.takeCard(gameDeck.drawCard());
        gameDealer.takeCard(gameDeck.drawCard());
        gamePlayer.takeCard(gameDeck.drawCard());
        gameDealer.takeCard(gameDeck.drawCard());
        
        gamePhase = "playerTurn";
        gameResult = null;
        dealerHasPlayed = false;
    }
}

function updateBalance(result) {
    let payout = 0;
    if (result === "You have Blackjack! You Win!") {
        payout = currentBet * 2.5; // 3:2 blackjack payout
    } else if (result === "You Win!" || result === "Dealer Busted! You Win!") {
        payout = currentBet * 2; // 1:1 win
    } else if (result === "Push - Both Blackjack!" || result === "Push!") {
        payout = currentBet; // Return original bet
    }
    playerBalance += payout;
}

function dealerPlay() {
    while (gameDealer.takeACardChoice()) {
        let drawCard = gameDeck.drawCard();
        if (drawCard) gameDealer.takeCard(drawCard);
        if (gameDealer.isBursted()) break;
    }
    determineWinner();
}

function determineWinner() {
    if (gamePlayer.isBlackjack() && gameDealer.isBlackjack()) {
        gameResult = "Push - Both Blackjack!";
    } else if (gamePlayer.isBlackjack()) {
        gameResult = "You have Blackjack! You Win!";
    } else if (gameDealer.isBlackjack()) {
        gameResult = "Dealer has Blackjack! Dealer Wins!";
    } else if (gamePlayer.isBursted()) {
        gameResult = "You Busted! Dealer Wins!";
    } else if (gameDealer.isBursted()) {
        gameResult = "Dealer Busted! You Win!";
    } else {
        const playerVal = gamePlayer.getHandValue();
        const dealerVal = gameDealer.getHandValue();
        if (playerVal > dealerVal) gameResult = "You Win!";
        else if (playerVal < dealerVal) gameResult = "Dealer Wins!";
        else gameResult = "Push!";
    }
    updateBalance(gameResult);
    gamePhase = "showdown";
}

function drawMenu() {
    [125, 250, 375].forEach((y, i) => {
        const labels = ["Play", "Settings", "Quit"];
        drawRoundRect(ctx, canva.width / 2 - 200, y, 400, 80, 20, "#007700", "#00ff00");
        ctx.fillStyle = "white";
        ctx.font = "bold 50px Arial";
        ctx.textAlign = "center";
        ctx.fillText(labels[i], 500, y + 58);
    });
}

function displayGameState() {
    // Draw balance and bet
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Balance: $" + playerBalance, 50, 30);
    if (currentBet > 0) {
        ctx.fillText("Bet: $" + currentBet, 50, 55);
    }

    if (gamePhase === "betting") {
        // Draw betting screen
        ctx.fillStyle = "white";
        ctx.font = "bold 32px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Place Your Bet", 500, 200);
        
        ctx.font = "24px Arial";
        ctx.fillText("Use arrow keys to select, Enter to bet", 500, 240);
        
        for (let i = 0; i < betAmounts.length; i++) {
            const x = 150 + i * 200;
            const y = 350;
            const isSelected = i === selectedBetIndex;
            const color = isSelected ? "#ffff00" : "#007700";
            const borderColor = isSelected ? "#ffffff" : "#00ff00";
            
            drawRoundRect(ctx, x - 50, y - 40, 100, 80, 15, color === "#ffff00" ? "#777700" : color, borderColor);
            ctx.fillStyle = "white";
            ctx.font = "bold 24px Arial";
            ctx.textAlign = "center";
            ctx.fillText("$" + betAmounts[i], x, y + 20);
        }
        return;
    }

    if (!gamePlayer || !gameDealer) return;

    // Draw player hand
    gamePlayer.hand.forEach((card, index) => {
        drawCard(250 + index * 120, 500, card.id, 0);
    });

    // Draw dealer hand
    gameDealer.hand.forEach((card, index) => {
        if (gamePhase !== "showdown" && index === 1) {
            drawCardBack(250 + index * 120, 100, 0);
        } else {
            drawCard(250 + index * 120, 100, card.id, 0);
        }
    });

    // Draw scores and status
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Player: " + gamePlayer.getHandValue(), 50, 560);
    ctx.fillText("Dealer: " + (gamePhase === "showdown" ? gameDealer.getHandValue() : "?"), 50, 80);

    // Instructions
    ctx.textAlign = "right";
    ctx.fillText("H = Hit     S = Stand", 920, 560);

    // Game result
    if (gameResult) {
        ctx.textAlign = "center";
        ctx.font = "bold 32px Arial";
        ctx.fillText(gameResult, 500, 300);
        if (playerBalance <= 0) {
            ctx.font = "bold 28px Arial";
            ctx.fillText("Game Over!", 500, 350);
            ctx.font = "20px Arial";
            ctx.fillText("Press M to return to menu", 500, 380);
        } else {
            ctx.font = "24px Arial";
            ctx.fillText("Press N for New Game", 500, 350);
        }
    }

    // Draw buttons
    if (gamePhase === "playerTurn") {
        drawRoundRect(ctx, 700, 450, 100, 50, 10, "#007700", "#00ff00");
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Hit", 750, 480);

        drawRoundRect(ctx, 820, 450, 100, 50, 10, "#770000", "#ff0000");
        ctx.fillStyle = "white";
        ctx.fillText("Stand", 870, 480);
    }
}

window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    
    if (key === "p" && gameState === "menu") {
        gameState = "game";
        startBetting();
    }
    if (key === "q" && gameState === "menu") window.close();
    if (key === "m" && gameState === "game") {
        gameState = "menu";
        gamePhase = "menu";
        currentBet = 0;
    }
    
    if (gamePhase === "betting") {
        if (key === "arrowleft") {
            selectedBetIndex = (selectedBetIndex - 1 + betAmounts.length) % betAmounts.length;
        }
        if (key === "arrowright") {
            selectedBetIndex = (selectedBetIndex + 1) % betAmounts.length;
        }
        if (key === "enter") {
            placeBet(betAmounts[selectedBetIndex]);
        }
    }
    
    if (key === "h" && gamePhase === "playerTurn" && gamePlayer && gameDeck) {
        let newCard = gameDeck.drawCard();
        if (newCard) {
            gamePlayer.takeCard(newCard);
            if (gamePlayer.isBursted()) {
                gamePhase = "showdown";
                determineWinner();
            }
        }
    }
    if (key === "s" && gamePhase === "playerTurn") {
        gamePhase = "dealerTurn";
    }
    if (key === "n" && gamePhase === "showdown" && gameResult && playerBalance > 0) {
        startBetting();
    }
});

window.addEventListener('keyup', () => isKeyPressed = false);

canva.addEventListener('click', (event) => {
    const rect = canva.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (gameState === "menu") {
        const btnX = canva.width / 2 - 200;
        const btnWidth = 400;
        const btnHeight = 80;

        if (mouseX >= btnX && mouseX <= btnX + btnWidth) {
            if (mouseY >= 125 && mouseY <= 125 + btnHeight) {
                gameState = "game";
                startBetting();
            }
            else if (mouseY >= 250 && mouseY <= 250 + btnHeight) {
                alert("What do you even want to change?");
            }
            else if (mouseY >= 375 && mouseY <= 375 + btnHeight) {
                alert("HAHAHA, not letting you leave!!!! Keep gambling!!!");
            }
        }
    } else if (gameState === "game" && gamePhase === "betting") {
        // Bet buttons at y=310
        const betButtonY = 350;
        for (let i = 0; i < betAmounts.length; i++) {
            const x = 150 + i * 200;
            if (mouseX >= x - 50 && mouseX <= x + 50 && mouseY >= betButtonY - 40 && mouseY <= betButtonY + 40) {
                placeBet(betAmounts[i]);
                return;
            }
        }
    } else if (gameState === "game" && gamePhase === "playerTurn" && gamePlayer && gameDeck) {
        // Hit button: 700-800, 450-500
        if (mouseX >= 700 && mouseX <= 800 && mouseY >= 450 && mouseY <= 500) {
            let newCard = gameDeck.drawCard();
            if (newCard) {
                gamePlayer.takeCard(newCard);
                if (gamePlayer.isBursted()) {
                    gamePhase = "showdown";
                    determineWinner();
                }
            }
        }
        // Stand button: 820-920, 450-500
        else if (mouseX >= 820 && mouseX <= 920 && mouseY >= 450 && mouseY <= 500) {
            gamePhase = "dealerTurn";
        }
    }
});

canva.addEventListener('mousemove', (event) => {
    const rect = canva.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let hovering = false;

    if (gameState === "menu") {
        const btnX = canva.width / 2 - 200;
        const btnWidth = 400;

        if (mouseX >= btnX && mouseX <= btnX + btnWidth) {
            if ((mouseY >= 125 && mouseY <= 205) || 
                (mouseY >= 250 && mouseY <= 330) || 
                (mouseY >= 375 && mouseY <= 455)) {
                hovering = true;
            }
        }
    } 
    else if (gameState === "game" && gamePhase === "playerTurn") {
        // Hit button: 700-800, 450-500
        if (mouseX >= 700 && mouseX <= 800 && mouseY >= 450 && mouseY <= 500) {
            hovering = true;
        }
        // Stand button: 820-920, 450-500
        else if (mouseX >= 820 && mouseX <= 920 && mouseY >= 450 && mouseY <= 500) {
            hovering = true;
        }   
    }
    else if (gameState === "game" && gamePhase === "betting") {
        const betButtonY = 350;
        for (let i = 0; i < betAmounts.length; i++) {
            const x = 150 + i * 200;
            if (mouseX >= x - 50 && mouseX <= x + 50 && mouseY >= betButtonY - 40 && mouseY <= betButtonY + 40) {
                hovering = true;
            }
        }
    }

    canva.style.cursor = hovering ? "pointer" : "default";
});


// Main loop
function mainLoop() {
    ctx.clearRect(0, 0, canva.width, canva.height);
    drawCheckboard(1000, 600, "#005500", "#006000", 25);

    if (gameState === "menu") {
        innerinnerRing.updateAndDraw();
        outerRing.updateAndDraw();
        drawMenu();
    } 
    else if (gameState === "game") {
        if (gamePhase === "playerTurn") {
            // Wait for player input
        } 
        else if (gamePhase === "dealerTurn" && !dealerHasPlayed) {
            dealerHasPlayed = true;
            dealerPlay();
        }
        displayGameState();
    }
    
    requestAnimationFrame(mainLoop);
}

mainLoop();