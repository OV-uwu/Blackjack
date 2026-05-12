// Statistik-array
let blackjackStats = JSON.parse(
    localStorage.getItem("blackjackStats")
) || [];

// Totals
let totalWins = 0;
let totalLosses = 0;
let totalPushes = 0;
let totalRounds = 0;

// Läs gammal statistik
if (blackjackStats.length > 0) {

    let lastGame =
        blackjackStats[blackjackStats.length - 1];

    totalWins = lastGame.wins;
    totalLosses = lastGame.losses;
    totalPushes = lastGame.pushes;
    totalRounds = lastGame.round;
}

// Lyssna på spelresultat
window.addEventListener(
    "blackjackResult",
    (event) => {

        let result = event.detail;

        totalRounds++;

        if (
            result === "You Win!" ||
            result === "Dealer Busted! You Win!" ||
            result === "You have Blackjack! You Win!"
        ) {
            totalWins++;
        }

        else if (
            result === "Dealer Wins!" ||
            result === "Dealer has Blackjack! Dealer Wins!" ||
            result === "You Busted! Dealer Wins!"
        ) {
            totalLosses++;
        }

        else {
            totalPushes++;
        }

        let winChance =
            (totalWins / totalRounds) * 100;

        blackjackStats.push({
            round: totalRounds,
            wins: totalWins,
            losses: totalLosses,
            pushes: totalPushes,
            winChance: winChance
        });

        localStorage.setItem(
            "blackjackStats",
            JSON.stringify(blackjackStats)
        );
    }
);

const statsCanvas =
    document.getElementById("statsChart");

if (statsCanvas) {

    new Chart(statsCanvas, {

        type: "line",

        data: {

            labels: blackjackStats.map(
                game => game.round
            ),

            datasets: [{
                label: "Vinstchans (%)",

                data: blackjackStats.map(
                    game => game.winChance
                ),

                borderWidth: 3,
                tension: 0.2
            }]
        },

        options: {

            responsive: true,

            scales: {

                y: {
                    min: 0,
                    max: 100
                }
            }
        }
    });
}