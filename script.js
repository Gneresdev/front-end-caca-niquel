// Game Constants
const SPIN_COST = 10;
const INITIAL_CREDITS = 100;
const SPIN_DURATION_MS = 2500;
const WIN_ANIMATION_CASCADE_DELAY_MS = 200;
const REEL_STOP_DELAY_MS = 200; // Atraso entre as paradas dos rolos
const SYMBOLS = ["🍒", "🍋", "🍊", "🔔", "💰", "💎", "🍀"];
const API_URL = 'http://localhost:4567/girar';

// DOM Elements
const spinButton = document.getElementById('spinButton');
const reels = [
    document.getElementById('reel1'),
    document.getElementById('reel2'),
    document.getElementById('reel3')
];
const creditsSpan = document.getElementById('creditsSpan');
const statusDiv = document.getElementById('statusDiv');

// EFEITOS SONOROS ---
const spinSound = new Audio('sounds/spin.mp3');
const stopSound = new Audio('sounds/stop.mp3');
const winSound = new Audio('sounds/win.mp3');

// Game State
let credits = INITIAL_CREDITS;

// Helper function to create a pause
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function populateReelsForSpinning() {
    reels.forEach(reel => {
        const symbolContainer = reel.querySelector('.symbols');
        symbolContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 20; i++) {
            const shuffledSymbols = [...SYMBOLS].sort(() => Math.random() - 0.5);
            shuffledSymbols.forEach(symbol => {
                const div = document.createElement('div');
                div.textContent = symbol;
                fragment.appendChild(div);
            });
        }
        symbolContainer.appendChild(fragment);
    });
}

async function handleSpin() {
    if (credits < SPIN_COST) {
        statusDiv.textContent = "Créditos insuficientes!";
        return;
    }

    credits -= SPIN_COST;
    creditsSpan.textContent = credits;
    statusDiv.textContent = "";
    spinButton.disabled = true;

    document.querySelectorAll('.winning-symbol').forEach(el => el.classList.remove('winning-symbol'));

    // TOCA O SOM DE GIRO
    spinSound.currentTime = 0;
    spinSound.play();

    populateReelsForSpinning();
    reels.forEach(reel => reel.classList.add('spinning'));

    try {
        const response = await fetch(API_URL);
        const result = await response.json();

        await delay(SPIN_DURATION_MS);

        // PARA O SOM DE GIRO
        spinSound.pause();

        const resultSymbols = result.grid;

        // Para os rolos um por um, com som a cada parada
        for (let i = 0; i < reels.length; i++) {
            const reel = reels[i];
            const symbolContainer = reel.querySelector('.symbols');

            reel.classList.remove('spinning');

            symbolContainer.innerHTML = '';
            for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
                const symbol = resultSymbols[rowIndex][i];
                const div = document.createElement('div');
                div.textContent = symbol;
                symbolContainer.appendChild(div);
            }

            // TOCA O SOM DE PARADA
            stopSound.currentTime = 0;
            stopSound.play();

            await delay(REEL_STOP_DELAY_MS);
        }

        const prizeValue = result.totalPrize;
        if (prizeValue > 0) {
            statusDiv.textContent = `🎉 Você ganhou ${prizeValue} créditos! 🎉`;
            credits += prizeValue;
            creditsSpan.textContent = credits;

            // TOCA O SOM DE VITÓRIA
            winSound.currentTime = 0;
            winSound.play();

            animateWinningLines(result.winningLines);
        }

    } catch (error) {
        statusDiv.textContent = "Erro de conexão com o servidor!";
        console.error("Erro:", error);
    } finally {
        spinButton.disabled = false;
    }
}

async function animateWinningLines(winningLines) {
    for (const line of winningLines) {
        const rowIndex = line.rowIndex;
        const len = line.combinationLength;

        for (let colIndex = 0; colIndex < len; colIndex++) {
            const reel = reels[colIndex];
            const symbolElement = reel.querySelector('.symbols').children[rowIndex];
            if(symbolElement) {
                symbolElement.classList.add('winning-symbol');
                await delay(WIN_ANIMATION_CASCADE_DELAY_MS);
            }
        }
    }
}

// Initialize the game
spinButton.addEventListener('click', handleSpin);
reels.forEach(reel => {
    const symbolContainer = reel.querySelector('.symbols');
    for(let i = 0; i < 3; i++){
        const div = document.createElement('div');
        div.textContent = SYMBOLS[i];
        symbolContainer.appendChild(div);
    }
});