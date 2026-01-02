const pawns = document.querySelectorAll(".pawn");
const suspectBtns = document.querySelectorAll(".suspect-btn");
const weaponBtns = document.querySelectorAll(".weapon-btn");
const setupContainer = document.getElementById("setup-container");
const gameContainer = document.getElementById("game-container");
const currentTurnHeader = document.getElementById("current-turn-header");
const guessHUD = document.getElementById("guess-hud");
const accuseHUD = document.getElementById("accuse-hud");
const guessAccuseHUD = document.getElementById("guess-accuse-hud");
const envelopeHUD = document.getElementById("envelope-hud");
const gamePawnContainer = document.getElementById("game-pawn-container");
const difficultySelect = document.getElementById("difficulty-select");
const difficultyDesc = document.getElementById("difficulty-desc");

const suspectsArray = ["Miss Scarlet", "Professor Plum", "Mrs. Peacock",
    "Mr. Green", "Colonel Mustard", "Mrs. White"];

const weaponsArray = ["Candlestick", "Dagger", "Lead Pipe",
    "Pistol", "Rope", "Wrench"];

const roomsArray = ["Hall", "Lounge", "Dining Room", "Kitchen",
    "Ballroom", "Conservatory", "Billiard Room", "Library", "Study"];

const allCardsArray = [...suspectsArray, ...weaponsArray, ...roomsArray];

const startingMoves = {
  "Mrs. White": ["Kitchen", "Ballroom"],
  "Colonel Mustard": ["Lounge", "Dining Room"],
  "Mr. Green": ["Ballroom", "Conservatory"],
  "Mrs. Peacock": ["Conservatory", "Billiard Room"],
  "Professor Plum": ["Study", "Library"],
  "Miss Scarlet": ["Hall", "Lounge"],
};

const roomConnections = {
  "Hall": ["Lounge", "Study"],
  "Lounge": ["Hall", "Dining Room", "Conservatory"],
  "Dining Room": ["Lounge", "Kitchen"],
  "Kitchen": ["Dining Room", "Ballroom", "Study"],
  "Ballroom": ["Kitchen", "Conservatory", "Billiard Room"],
  "Conservatory": ["Ballroom", "Lounge", "Billiard Room"],
  "Billiard Room": ["Conservatory", "Ballroom", "Library"],
  "Library": ["Billiard Room", "Study"],
  "Study": ["Library", "Hall", "Kitchen"],
};

const roomIdToName = {
    "hall": "Hall",
    "lounge": "Lounge",
    "dining-room": "Dining Room",
    "kitchen": "Kitchen",
    "ballroom": "Ballroom",
    "conservatory": "Conservatory",
    "billiard-room": "Billiard Room",
    "library": "Library",
    "study": "Study",
};

const pawnColors = {
    "Miss Scarlet": "#970000",      
    "Professor Plum": "#610061",    
    "Mrs. Peacock": "#082e96",      
    "Mr. Green": "#1c961c",         
    "Colonel Mustard": "#dd9803",   
    "Mrs. White": "#e6e6e6"         
};

const pawnPositions = {
    "Miss Scarlet": { x: 64.45, y: 2 },
    "Colonel Mustard": { x: 92.5, y: 27.5 },
    "Mrs. White": { x: 57.9, y: 94.8 },
    "Mr. Green": { x: 38, y: 94.8 },
    "Mrs. Peacock": { x: 2.5, y: 70.5 },
    "Professor Plum": { x: 3.5, y: 20.5 },
};

const difficultyDescriptions = {
    easy: "CPUs play cautiously: low bluffing and accuse only when highly confident.",
    medium: "CPUs are smart but fair: moderate bluffing and confidence. A balanced challenge.",
    hard: "CPUs are ruthless: frequent bluffs and accuse aggressively."
};

const difficultyColors = { easy: "#4caf50", medium: "#ff9800", hard: "#f44336" };
let difficulty = "easy";

const roomOccupancy = {};

const debug = false;

let envelopeArray = [];

let playerPawn = null;
let playerAmt = 2;
let playerHands = {};

let turnOrder = [];
let currentTurnIndex = 0;
let pawnLocations = {};

let cpuNotebooks = {};
let cpuPersonalities = {};

let roomGuess = null;
let suspectGuess = null;
let weaponGuess = null;
let guessBtnHandler = null;
let accuseBtnHandler = null;

let playerSeenCards = new Set();

pawns.forEach(pawn => {
    pawn.addEventListener("click", () => {
        pawns.forEach(pawn => pawn.classList.remove("selected-pawn")); //remove class on each click
        pawn.classList.add("selected-pawn"); //add class
        playerPawn = pawn.id;
    });
});

//start btn logic
//if a pawn is selected: assign pawns to CPUs and then call other setup functions
function startGame(){
    //return if user doesn't select a pawn
    if(!playerPawn){
        alert("No pawn selected");
        return;
    }

    playerAmt = document.getElementById("player-select-box").value; //get num of players
    difficulty = difficultySelect.value; //get difficulty
    let availableSuspects = [...suspectsArray].filter(name => name !== playerPawn); //remove player pawn from array
    let cpuPawns = []; //new array for randomly chosen cpu pawns

    //randomly select (playerAmt - 1) cpu pawns
    for (let i = 0; i < (playerAmt - 1); i++){
        let randomPawn = pickOne(availableSuspects);
        cpuPawns.push(randomPawn);
        availableSuspects = availableSuspects.filter(name => name !== randomPawn);
    }

    //initialize turn order, and pawn locations
    turnOrder = [playerPawn, ...cpuPawns];
    currentTurnIndex = 0;

    turnOrder.forEach(pawn => {
        pawnLocations[pawn] = null;
    });

    //initialize cpu personalities
    let bluffMin, bluffMax, threshMin, threshMax;
    //random ranges based on difficulty
    if (debug) console.log(`Selected ${difficulty} difficulty.`);
    switch(difficulty){
        case "easy":
            bluffMin = 0.05; bluffMax = 0.2;
            threshMin = 0.8; threshMax = 0.9
            break;
        case "medium":
            bluffMin = 0.1; bluffMax = 0.25;
            threshMin = 0.7; threshMax = 0.8;
            break;
        case "hard":
            bluffMin = 0.15; bluffMax = 0.3;
            threshMin = 0.6; threshMax = 0.7;
        break;
    }

    turnOrder.forEach(pawn => {
        if (pawn === playerPawn) return; //skip player

        const bluffChance = Math.random() * (bluffMax - bluffMin) + bluffMin;
        const accuseThreshold = Math.random() * (threshMax-threshMin) + threshMin;

        cpuPersonalities[pawn] = {
            bluffChance,
            accuseThreshold
        };

        if (debug) console.log(`${pawn} personality: bluff ${(bluffChance*100).toFixed(0)}%, accuse at ${(accuseThreshold*100).toFixed(0)}%`);
    });

    //setup functions
    generateCrime();
    const playerHand = generatePlayerHands();
    renderHands(playerHand);
    renderTurnOrder(turnOrder);
    highlightCurrentTurnPawn();
    initCPUNotebooks();
    createBoardPawns();
    renderPlayerNotebook();

    setupContainer.style.display = "none"; //hide setup container
    gameContainer.style.display = "flex"; //display game container

    nextTurn(); //begin gameplay loop
}

//resets variables for new game
function resetGame(){
    //reset game state
    pawnLocations = {};
    playerHands = {};
    currentTurnIndex = 0;
    turnOrder = [];
    cpuNotebooks = {};
    cpuPersonalities = {};
    envelopeArray = [];
    playerSeenCards = new Set();

    //player guesses
    suspectGuess = null;
    weaponGuess = null;
    roomGuess = null;
    playerPawn = null;

    //pawn rendering
    const boardContainer = document.getElementById("game-board-container");
    const existingPawns = boardContainer.querySelectorAll(".board-pawn");
    existingPawns.forEach(pawn => pawn.remove());

    Object.keys(pawnPositions).forEach(pawn => {
        if (pawnPositions[pawn].pos) {
            delete pawnPositions[pawn].pos;
        }
    });

    Object.keys(roomOccupancy).forEach(room => delete roomOccupancy[room]);

    //change visuals
    gameContainer.style.display = "none";
    setupContainer.style.display = "block";
    pawns.forEach(pawn => pawn.classList.remove("selected-pawn"));
}

//helper function to pick a random entry from an array
function pickOne(array){
    let randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

//generates a random trio of suspect, weapon, and room for the envelope
function generateCrime(){
    const suspect = pickOne(suspectsArray);
    const weapon = pickOne(weaponsArray);
    const room = pickOne(roomsArray);
    envelopeArray = [suspect, weapon, room];
    if (debug) console.log(`Envelope: ${envelopeArray}`); //debug
}

//deals cards to each player's hand until the deck is empty
function generatePlayerHands(){
    playerAmt = Number(document.getElementById("player-select-box").value); //get num of players
    let deck = allCardsArray.filter(card => !envelopeArray.includes(card));

    //create playerHands object with each player
    turnOrder.forEach(pawn => {
        playerHands[pawn] = [];
    });

    //deal cards randomly until deck is empty
    let currentIndex = 0;
    while(deck.length > 0){
        let cardIndex = Math.floor(Math.random() * deck.length);
        let card = deck.splice(cardIndex, 1)[0];

        const currentPawn = turnOrder[currentIndex];
        playerHands[currentPawn].push(card);

        //deal to next player
        currentIndex = (currentIndex + 1) % turnOrder.length;
    }

    if (debug) console.log(playerHands);
    return playerHands;
}

//render cards from array to divs
function renderHands(playerHand){
    const handContainer = document.getElementById("player-hand");
    handContainer.innerHTML = "";

    //get player1's hand
    const hand = playerHand[playerPawn];

    hand.forEach(cardName => {
        const cardDiv = document.createElement("div");
        cardDiv.classList.add("card");

        const cardHeader = document.createElement("h3");
        cardHeader.classList.add("card-header");
        cardHeader.textContent = cardName;

        cardDiv.appendChild(cardHeader);
        handContainer.appendChild(cardDiv);
    });
}

//hide hand btn logic
const handDiv = document.getElementById("player-hand");
const hideBtn = document.getElementById("hide-hand-btn");

hideBtn.addEventListener("click", () => {
    //hide hand if displayed
    if(handDiv.style.display !== "none"){
        handDiv.style.display = "none";
        hideBtn.textContent = "Show (H)";
        
    //show hand if hidden
    } else {
        handDiv.style.display = "flex";
        hideBtn.textContent = "Hide (H)";
    }
})

//keybind for hide hand btn
document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "h" && 
        !event.ctrlKey && !event.altKey && !event.metaKey && 
        document.activeElement === document.body) {
        
        //toggle visibility
        if (handDiv.style.display === "none") {
            handDiv.style.display = "flex";
            hideBtn.textContent = "Hide (H)";
        } else {
            handDiv.style.display = "none";
            hideBtn.textContent = "Show (H)";
        }

        event.preventDefault(); //prevent n from typing
    }
});

//difficulty desc logic
difficultySelect.addEventListener("change", () => {
    const selected = difficultySelect.value;
    difficultyDesc.textContent = difficultyDescriptions[selected];
    difficultyDesc.style.color = difficultyColors[selected];
});

//renders the turn order pawns above the game board
function renderTurnOrder(turnOrder){
    gamePawnContainer.innerHTML = ""; //clear previous pawns

    turnOrder.forEach(pawn => {
        const pawnDiv = document.createElement("div");
        const color = pawnColors[pawn];
        pawnDiv.style.backgroundColor = color;
        pawnDiv.classList.add("game-pawn");

        gamePawnContainer.appendChild(pawnDiv);
    });
}

//adds the highlight class to the current pawn in the turn order header
function highlightCurrentTurnPawn(){
    //remove class from all pawns
    document.querySelectorAll(".game-pawn").forEach(pawn => {
        pawn.classList.remove("current-turn-pawn");
    });

    //add to current player's pawn
    const currentTurnPawn = gamePawnContainer.children[currentTurnIndex];
    if(currentTurnPawn){
        currentTurnPawn.classList.add("current-turn-pawn");
    }
}

function getAvailableMoves(pawn, currentRoom){
    if(!currentRoom){
        return startingMoves[pawn];
    }
    return roomConnections[currentRoom];
}

function getCurrentPawn(){
    return turnOrder[currentTurnIndex];
}

function nextTurn(){
    const currentPawn = getCurrentPawn();

    if (debug) console.log(`It's ${currentPawn}'s turn`); //debug
    currentTurnHeader.textContent = `It's ${currentPawn}'s turn`
    highlightCurrentTurnPawn();

    if (currentPawn === playerPawn){
        playerMove();
    } else {
        cpuMove(currentPawn);
    }

    if (debug) console.log(cpuNotebooks);
}

function endTurn(){
    currentTurnIndex = (currentTurnIndex + 1) % turnOrder.length;
    nextTurn();
}

//checks valid player moves based on current location
//adds clickdetectors for each valid room 
function playerMove(){
    const currentRoom = pawnLocations[playerPawn];
    const availableMoves = getAvailableMoves(playerPawn, currentRoom);

    if (debug) console.log(`${playerPawn} can move to: ${availableMoves.join(", ")}`);

    document.querySelectorAll(".room").forEach(room => {
        const roomName = roomIdToName[room.id];
        if (availableMoves.includes(roomName)) {
            room.classList.add("highlight-room");
            room.removeEventListener("click", handleRoomClick);
            room.addEventListener("click", handleRoomClick);
        } else {
            room.classList.remove("highlight-room");
            room.removeEventListener("click", handleRoomClick);
        }
    });
}

//main CPU logic; handles moves, guesses, and accusations
async function cpuMove(currentPawn){
    //cpu is thinking
    showRevealedCardBox(currentPawn, `is thinking...`, null, false);
    await dialogueWait({ ms: 1500 });
    hideRevealedCardBox();
    await dialogueWait({ ms: 1500 });

    const chosenRoom = findSmartPath(currentPawn);

    //update location
    pawnLocations[currentPawn] = chosenRoom;
    renderPawnPosition(currentPawn); //render pawn to room

    //show cpu move
    showRevealedCardBox(currentPawn, `moved to the ${chosenRoom}`, null, false)
    await dialogueWait({ ms: 1500 });
    hideRevealedCardBox();
    await dialogueWait({ ms: 1500 });

    //check if cpu can accuse
    const accusation = cpuCanAccuse(currentPawn);

    //final accusation!
    if (accusation){
        showRevealedCardBox(currentPawn, "I know who did it!", null, true);
        await dialogueWait({ requireClick: true });
        showRevealedCardBox(currentPawn, `It was ${accusation.suspect} with the ${accusation.weapon} in the ${accusation.room}!`, null, true);
        await dialogueWait({ requireClick: true });
        hideRevealedCardBox();

        //check if correct
        const cpuCorrect = accusation.suspect === envelopeArray[0] &&
                        accusation.weapon  === envelopeArray[1] &&
                        accusation.room    === envelopeArray[2];
        //CPU wins!
        if (cpuCorrect) {    
            //set winLoseText
            const winLoseText = document.getElementById("win-lose-text");
            winLoseText.textContent = "You lose";
            winLoseText.style.color = "maroon";
            //show result
            showRevealedCardBox(null, cpuCorrect ? `The accusation is correct! ${currentPawn} wins!` : `Wrong! ${currentPawn} loses.`, null, true);
            await dialogueWait({ requireClick: true });
            hideRevealedCardBox();
            //show envelope
            await openEnvelope(envelopeArray, false);
            //game over!
            return;
        } else {
            //CPU loses!

            //show elimination dialogue
            showRevealedCardBox(null, `${currentPawn} is eliminated! Wrong accusation.`, null, true);
            await dialogueWait({ requireClick: true });
            hideRevealedCardBox();

            //hide board pawn
            const boardPawn = document.querySelector(`.board-pawn[data-pawn="${currentPawn}"]`);
            if (boardPawn) boardPawn.style.display = "none";

            //remove from turnOrder
            const cpuIndex = turnOrder.indexOf(currentPawn);
            if (cpuIndex > -1){
                turnOrder.splice(cpuIndex, 1);
            }

            //adjust currentTurnIndex
            if (cpuIndex !== -1) {
                currentTurnIndex = cpuIndex - 1;
            }

            //refresh turn order header
            renderTurnOrder(turnOrder);
            highlightCurrentTurnPawn();

            //check if player is last one standing
            if (turnOrder.length === 1 && turnOrder[0] === playerPawn) {
                //set winLoseText
                const winLoseText = document.getElementById("win-lose-text");
                winLoseText.textContent = "You win!";
                winLoseText.style.color = "lime";
                //show dialogue box and open envelope
                showRevealedCardBox(null, "You win!", null, true);
                await dialogueWait({ requireClick: true });
                hideRevealedCardBox();
                await openEnvelope(envelopeArray, false);
                return;
            }
            //continue game
            endTurn();
            return;
        }
    }

    const guess = generateCPUGuess(currentPawn, chosenRoom);

    //show guess
    showRevealedCardBox(currentPawn, `I think it was ${guess.suspect} with the ${guess.weapon} in the ${chosenRoom}`, null, true);
    await dialogueWait( {requireClick: true} );
    hideRevealedCardBox();

    //run disprove logic
    const guessArray = [guess.suspect, guess.weapon, chosenRoom];
    const revealedInfo = await findMatchingCard(guessArray, false);

    //update CPU notebook
    updateCPUNotebook(currentPawn, guessArray, revealedInfo);
    endTurn();
}

//generates a smart CPU guess based on their notebook
function generateCPUGuess(pawn, currentRoom){
    const notebook = cpuNotebooks[pawn];
    const cards = notebook.cards;
    const probs = notebook.envelopeProb;
    const dontHave = notebook.playersWhoDontHaveIt;

    //safe: in cpu hand or seen & eliminated
    const safeSuspects = suspectsArray.filter(s => cards[s].eliminated);
    const safeWeapons = weaponsArray.filter(w => cards[w].eliminated);

    //unknown: never seen
    const unknownSuspects = suspectsArray.filter(s => !cards[s].eliminated);
    const unknownWeapons = weaponsArray.filter(w => !cards[w].eliminated);

    //bluffs if rng is < bluffChance
    const bluffChance = Math.random() < cpuPersonalities[pawn].bluffChance;
    if (debug && bluffChance) console.log(`${pawn} is bluffing!`);

    //cpu picks highest prob from unknowns
    let suspect;
    if (bluffChance && safeSuspects.length > 0) {
        suspect = safeSuspects.reduce((best, s) => probs[s] > probs[best] ? s : best, safeSuspects[0]);
    } else {
        suspect = unknownSuspects.reduce((best, s) => probs[s] > probs[best] ? s : best, unknownSuspects[0] || suspectsArray[0]);
    }

    let weapon;
    if (bluffChance && safeWeapons.length > 0) {
        weapon = safeWeapons.reduce((best, w) => probs[w] > probs[best] ? w : best, safeWeapons[0]);
    } else {
        weapon = unknownWeapons.reduce((best, w) => probs[w] > probs[best] ? w : best, unknownWeapons[0] || weaponsArray[0]);
    }

    //cpu prefers cards not in others' hands
    const goodSuspect = suspectsArray.find(s => !cards[s].eliminated && dontHave[s].size > 0 && probs[s] > 0.1);
    if (goodSuspect) suspect = goodSuspect;

    const goodWeapon = weaponsArray.find(w => !cards[w].eliminated && dontHave[w].size > 0 && probs[w] > 0.1);
    if (goodWeapon) weapon = goodWeapon;

    return { suspect, weapon, room: currentRoom };
}

//checks if CPU can accuse based on their personality
function cpuCanAccuse(pawn){
    const notebook = cpuNotebooks[pawn];
    const cards = notebook.cards;
    const probs = notebook.envelopeProb;
    
    //count how many of each category are still possible
    const possibleSuspects = suspectsArray.filter(s => !cards[s].eliminated);
    const possibleWeapons  = weaponsArray.filter(w => !cards[w].eliminated);
    const possibleRooms    = roomsArray.filter(r => !cards[r].eliminated);

    //cpu has exactly one possibility in each category
    const topSuspectProb = Math.max(...possibleSuspects.map(s => probs[s]));
    const topWeaponProb  = Math.max(...possibleWeapons.map(w => probs[w]));
    const topRoomProb    = Math.max(...possibleRooms.map(r => probs[r]));

    //accuses if the probabilities are high enough
    const threshold = cpuPersonalities[pawn].accuseThreshold;
    if (topSuspectProb > threshold && topWeaponProb > threshold && topRoomProb > threshold) {
        return {
            suspect: possibleSuspects.reduce((best, s) => probs[s] > probs[best] ? s : best, possibleSuspects[0]),
            weapon:  possibleWeapons.reduce((best, w) => probs[w] > probs[best] ? w : best, possibleWeapons[0]),
            room:    possibleRooms.reduce((best, r) => probs[r] > probs[best] ? r : best, possibleRooms[0])
        };
    }

    return null; //not ready to accuse
}

//updates CPU notebooks after a guess 
function updateCPUNotebook(guesser, guessArray, revealedInfo){
    const notebook = cpuNotebooks[guesser];
    if (!notebook) return;

    if(revealedInfo){
        const card = revealedInfo.card;
        const entry = notebook.cards[card];
        entry.seen = true;
        entry.holder = revealedInfo.player;
        entry.eliminated = true;
        //remove from dontHave if it was there
        notebook.playersWhoDontHaveIt[card].delete(revealedInfo.player);

        //revealed cards have 0 envelopeProb
        notebook.envelopeProb[card] = 0.0;
        renormalizeProbs(notebook, [suspectsArray, weaponsArray, roomsArray]);
    } else {
        //no one showed a card!
        const guessingIndex = turnOrder.indexOf(guesser);

        for (let i = 1; i < turnOrder.length; i++){
            const playerIndex = (guessingIndex + i) % turnOrder.length;
            const player = turnOrder[playerIndex];
            //dont mark the guesser
            if (player === guesser) continue;
            //add each player as not having the cards
            guessArray.forEach(card => {
                notebook.playersWhoDontHaveIt[card].add(player);
                notebook.cards[card].possibleEnvelope = true;
            });
        }

        //0.25 boost for not being shown
        guessArray.forEach(card => {
            notebook.envelopeProb[card] = Math.min(1.0, notebook.envelopeProb[card] + 0.25);
        });
        renormalizeProbs(notebook, [suspectsArray, weaponsArray, roomsArray]);
    }
}

//initialize CPU learning (notebooks)
function initCPUNotebooks(){
    cpuNotebooks = {};

    turnOrder.forEach(pawn => {
        if (pawn === playerPawn) return; //skip human player

        //init each cpu notebook
        cpuNotebooks[pawn] = {
            cards: {},
            guesses: [],
            hand: new Set(playerHands[pawn]),
            playersWhoDontHaveIt: {},
            envelopeProb: {}
        };

        //init all cards as unknown
        allCardsArray.forEach(card => {
            const inHand = cpuNotebooks[pawn].hand.has(card);

            cpuNotebooks[pawn].cards[card] = {
                eliminated: inHand,
                holder: inHand ? pawn : null,
                possibleEnvelope: false,
            };

            cpuNotebooks[pawn].playersWhoDontHaveIt[card] = new Set();

            //set uniform probability by category size
            let categorySize;
            if (suspectsArray.includes(card)) categorySize = suspectsArray.length;
            else if (weaponsArray.includes(card)) categorySize = weaponsArray.length;
            else categorySize = roomsArray.length;
            //0 prob if card is in hand
            cpuNotebooks[pawn].envelopeProb[card] = inHand ? 0.0 : 1.0 / categorySize;
        });
    });
}

//normalize probabilities after a deduction
function renormalizeProbs(notebook, categories){
    //keep probs summing to 1.0 per category
    categories.forEach(category => {
        let total = 0;
        const activeCards = [];

        //only count cards with non-zero probability
        category.forEach(card => {
            const prob = notebook.envelopeProb[card] || 0;
            if (prob > 0) {
                total += prob;
                activeCards.push(card);
            }
        });

        //normalize; scale to 1.0
        if (total > 0 && activeCards.length > 0){
            activeCards.forEach(card => {
                notebook.envelopeProb[card] /= total;
            });
        }

        //explicitly zero out eliminated cards
        category.forEach(card => {
            if (notebook.cards[card].eliminated){
                notebook.envelopeProb[card] = 0.0;
            }
        });
    });
}

//removes highlight styles and displays guess HUD when a room is clicked
function handleRoomClick(e){
    const roomId = e.currentTarget.id;
    const clickedRoom = roomIdToName[roomId];
    pawnLocations[playerPawn] = clickedRoom; //set location to room
    renderPawnPosition(playerPawn); //render pawn to room

    //remove highlights
    document.querySelectorAll(".room").forEach(room => {
        room.classList.remove("highlight-room");
        room.removeEventListener("click", handleRoomClick);
    });

    showGuessAccuseHUD(clickedRoom);
}

//show the hud that gives the player guess/accuse options, called when player clicks a room
function showGuessAccuseHUD(clickedRoom){
    guessAccuseHUD.style.display = "flex";

    const guessBtn = document.getElementById("choose-guess-btn");
    const accuseBtn = document.getElementById("choose-accuse-btn");

    guessBtn.onclick = () => {
        showGuessHUD(clickedRoom);
        guessAccuseHUD.style.display = "none";
    };

    accuseBtn.onclick = () => {
        showAccuseHUD();
        guessAccuseHUD.style.display = "none";
    };
}

//displays guess HUD, called when player chooses to guess after clicking a room
function showGuessHUD(room){
    const roomLabel = document.getElementById("room-label");
    const guessBtn = document.getElementById("guess-btn");
    roomLabel.textContent = `Room: ${room}`;
    roomGuess = room;

    //show the guess HUD
    guessHUD.style.display = "flex";

    //remove previous listener
    if (guessBtnHandler) {
        guessBtn.removeEventListener("click", guessBtnHandler);
        guessBtnHandler = null;
    }

    //add listener
    guessBtnHandler = () => {
        submitGuess(true);
    };
    guessBtn.addEventListener("click", guessBtnHandler);
}

//displays accuse HUD, called when player chooses to accuse after clicking a room
function showAccuseHUD(){
    //set labels
    document.getElementById("accuse-room-label").textContent = "Room: ???";
    document.getElementById("accuse-suspect-label").textContent = "Suspect: ???";
    document.getElementById("accuse-weapon-label").textContent = "Weapon: ???";

    //clear stored guesses
    suspectGuess = null;
    weaponGuess = null;
    roomGuess = null;

    //show the accuse HUD
    accuseHUD.style.display = "flex";

    //remove old listener if it exists
    const accuseBtn = document.getElementById("accuse-btn");
    if (accuseBtnHandler) {
        accuseBtn.removeEventListener("click", accuseBtnHandler);
        accuseBtnHandler = null;
    }

    //add new submit handler
    accuseBtnHandler = () => submitGuess(false); //false = accusation
    accuseBtn.addEventListener("click", accuseBtnHandler);
}

//guess suspect btns
suspectBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        suspectBtns.forEach(btn => btn.classList.remove("selected-guess-hud-btn")); //remove class on each click
        btn.classList.add("selected-guess-hud-btn"); //add class

        const suspectLabel = document.getElementById("suspect-label");
        suspectLabel.textContent = `Suspect: ${btn.textContent}`;
        suspectGuess = btn.textContent;
    });
});

//guess weapon btns
weaponBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        weaponBtns.forEach(btn => btn.classList.remove("selected-guess-hud-btn")); //remove class on each click
        btn.classList.add("selected-guess-hud-btn"); //add class
        
        const weaponLabel = document.getElementById("weapon-label");
        weaponLabel.textContent = `Weapon: ${btn.textContent}`;
        weaponGuess = btn.textContent;
    });
});

//accuse suspect btns
document.querySelectorAll("#accuse-suspect-container .suspect-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#accuse-suspect-container .suspect-btn")
            .forEach(b => b.classList.remove("selected-accuse-suspect-btn"));
        btn.classList.add("selected-accuse-suspect-btn");
        
        document.getElementById("accuse-suspect-label").textContent = `Suspect: ${btn.textContent}`;
        suspectGuess = btn.textContent;
    });
});

//accuse weapon btns
document.querySelectorAll("#accuse-weapon-container .weapon-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#accuse-weapon-container .weapon-btn")
            .forEach(b => b.classList.remove("selected-accuse-weapon-btn"));
        btn.classList.add("selected-accuse-weapon-btn");
        
        document.getElementById("accuse-weapon-label").textContent = `Weapon: ${btn.textContent}`;
        weaponGuess = btn.textContent;
    });
});

//accuse room btns
document.querySelectorAll("#accuse-room-container .room-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#accuse-room-container .room-btn")
            .forEach(b => b.classList.remove("selected-accuse-room-btn"));
        btn.classList.add("selected-accuse-room-btn");
        
        document.getElementById("accuse-room-label").textContent = `Room: ${btn.textContent}`;
        roomGuess = btn.textContent;
    });
});

//puts each guess into an array to compare to the envelopeArray
async function submitGuess(guess = true){
    //check if weapon and suspect are selected
    if (!suspectGuess || !weaponGuess || !roomGuess){
        alert("Please select a suspect, weapon, and room.")
        return;
    }

    //reset labels
    const suspectLabel = document.getElementById("suspect-label");
    suspectLabel.textContent = `Suspect: ???`;
    const weaponLabel = document.getElementById("weapon-label");
    weaponLabel.textContent = `Weapon: ???`;
    const roomLabel = document.querySelectorAll("#accuse-room-container .room-btn")
    roomLabel.textContent = `Room: ???`;

    let guessArray = [suspectGuess, weaponGuess, roomGuess];
    if (debug) console.log(guessArray);

    //reset HUD
    guessHUD.style.display = "none";
    accuseHUD.style.display = "none";
    suspectGuess = weaponGuess = roomGuess = null;
    suspectBtns.forEach(btn => btn.classList.remove("selected-guess-hud-btn"));
    weaponBtns.forEach(btn => btn.classList.remove("selected-guess-hud-btn"));
    document.querySelectorAll("#accuse-room-container .room-btn").forEach(btn => {
        btn.classList.remove("selected-accuse-room-btn");
    });

    if(guess){
        //guess
        const revealedInfo = await findMatchingCard(guessArray, true); //try to find matching card
        endTurn(); //turn ends after guessing
    } else {
        //accusation
        showEnvelopeHUD(guessArray);
    }
}

//finds matching cards from players hands and displays dialogue boxes
async function findMatchingCard(guessArray, isPlayerGuess = false){
    const guessingPlayerIndex = currentTurnIndex;
    const totalPlayers = turnOrder.length;

    //start from next player
    for (let i = 1; i < totalPlayers; i++) {
        const playerIndex = (guessingPlayerIndex + i) % totalPlayers;
        const player = turnOrder[playerIndex];

        //skip the player if they made the guess
        if (playerIndex === guessingPlayerIndex) continue;

        const hand = playerHands[player];
        const matchingCards = hand.filter(card => guessArray.includes(card)); //find matching cards in hand

        //player is checking cards
        if (player === playerPawn){
            //card matches, player selects card to show
            if (matchingCards.length > 0){
                //display hand if hidden
                if (handDiv.style.display === "none"){
                    handDiv.style.display = "flex";
                    hideBtn.textContent = "Hide (H)";
                }

                const chosenCard = await playerRevealCard(matchingCards);
                return { player, card: chosenCard};
            } else {
                //no card matches
                showRevealedCardBox(player, "I don't have those cards!", null, true);
                await dialogueWait({ requireClick: true });
                hideRevealedCardBox();
            }
        }

        //cpu is checking cards
        else {
            showRevealedCardBox(player, "is checking their cards...", null, false);
            await dialogueWait({ ms: 1500 }); //wait before disappearing
            hideRevealedCardBox();
            await dialogueWait({ ms: 1000 }); //wait before showing

            //if they have a card, check if player should see or not
            if(matchingCards.length > 0){
                const chosenCard = matchingCards[Math.floor(Math.random() * matchingCards.length)];
                
                //reveal card to player if it is a player guess
                if (isPlayerGuess){
                    showRevealedCardBox(player, `showed you: `, chosenCard, true); //display chosen card
                    //render the revealed card
                    playerSeenCards.add(chosenCard);
                    renderPlayerNotebook();
                    await dialogueWait({ requireClick: true }); //wait for player click
                    hideRevealedCardBox();
                } else {
                    //reveal card only to cpu if not a player guess
                    await dialogueWait({ ms: 1000 });
                    showRevealedCardBox(player, `showed a card`, null, true);
                    await dialogueWait({ requireClick: true }); //wait for player click
                    hideRevealedCardBox();
                }

                return { player, card: chosenCard }; //return the revealed card
            } else {
                //if they don't have a card, show refute text
                showRevealedCardBox(player, "I don't have those cards!", null, true);
                await dialogueWait({ requireClick: true });
                hideRevealedCardBox();
            }
        }
    }

    //no one can disprove
    showRevealedCardBox(null, "No one could disprove!", null, true);
    await dialogueWait({ requireClick: true });
    hideRevealedCardBox();
    return null;
}

//shows dialogue box with elements depending on context
function showRevealedCardBox(player, message, card = null, showClickText = true){
    const box = document.getElementById("revealed-card-box");
    const pawn = document.getElementById("revealed-card-pawn");
    const text = document.getElementById("revealed-card-text");
    const clickText = document.getElementById("revealed-card-click-text");

    box.style.display = "flex";
    pawn.style.backgroundColor = pawnColors[player];

    if (card) {
        text.innerHTML = `${message} <span style="color:#075c07; font-size:1.1em;"> ${card}</span>`;
    } else {
        text.textContent = `${message}`;
    }

    pawn.style.display = (player) ? "flex" : "none";
    clickText.style.display = showClickText ? "flex" : "none";
}

//hides dialogue box
function hideRevealedCardBox(){
    const box = document.getElementById("revealed-card-box");
    box.style.display = "none";
}

//waits for a click on the doc or timeout
let currentDialogueClickHandler = null;

function dialogueWait({ ms = null, requireClick = false } = {}) {
    return new Promise(resolve => {
        //clean up any previous click handler
        if (currentDialogueClickHandler) {
            document.removeEventListener("click", currentDialogueClickHandler);
            currentDialogueClickHandler = null;
        }

        let timeoutId = null;
        let resolved = false;

        const finish = () => {
            if (resolved) return;
            resolved = true;

            if (timeoutId) clearTimeout(timeoutId);
            if (currentDialogueClickHandler) {
                document.removeEventListener("click", currentDialogueClickHandler);
                currentDialogueClickHandler = null;
            }

            resolve();
        };

        //always allow clicking to skip optional waits
        const clickHandler = () => finish();

        //add click listener after a tiny delay to prevent triggering from the click that opened the box
        setTimeout(() => {
            if (!resolved) {
                currentDialogueClickHandler = clickHandler;
                document.addEventListener("click", clickHandler);
            }
        }, 100);

        //auto-advance only for optional dialogues with a delay
        if (!requireClick && ms !== null) {
            timeoutId = setTimeout(finish, ms);
        }
        //if requireClick is true, no timeout, must click to proceed
    });
}

function playerRevealCard(matchingCards){
    return new Promise(resolve => {
        const handContainer = document.getElementById("player-hand");
        const cards = handContainer.querySelectorAll(".card");

        //prompt to click a card
        showRevealedCardBox(null, "Choose a card to reveal", null, false);

        cards.forEach(cardDiv => {
            const cardName = cardDiv.querySelector(".card-header").textContent;
            if (matchingCards.includes(cardName)) {
                cardDiv.classList.add("highlighted-card")
                cardDiv.querySelector(".card-header").classList.add("highlighted-card-header");

                const clickHandler = async () => {
                    cards.forEach(c => {
                        c.classList.remove("highlighted-card");
                        c.querySelector(".card-header")?.classList.remove("highlighted-card-header");
                        c.onclick = null;
                    });
                    hideRevealedCardBox();
                    await dialogueWait({ ms: 200 }); //wait before showing
                    showRevealedCardBox(playerPawn, `You showed `, cardName, true); //display chosen card
                    await dialogueWait({ requireClick: true }); //wait for player click
                    hideRevealedCardBox();
                    resolve(cardName);
                };

                cardDiv.onclick = clickHandler;
            }
        })
    })
}

function showEnvelopeHUD(guessArray){
    const accuseText = document.getElementById("player-accusation-text");
    const envelope = document.getElementById("envelope");
    envelopeHUD.style.display = "flex";

    const suspect = guessArray[0];
    const weapon = guessArray[1];
    const room = guessArray[2];

    accuseText.textContent = `${suspect} with the ${weapon} in the ${room}`;

    envelope.addEventListener("click", () => {
        openEnvelope(guessArray, true);
        envelopeHUD.style.display = "none";
    });
}

async function openEnvelope(guessArray, isPlayerAccusation = true){
    const sCard = document.getElementById("env-s-card");
    const wCard = document.getElementById("env-w-card");
    const rCard = document.getElementById("env-r-card");
    const winLoseText = document.getElementById("win-lose-text");
    const envelopeHUD = document.getElementById("open-envelope-hud");

    envelopeHUD.style.display = "flex";

    //set card text to each envelope card
    sCard.textContent = envelopeArray[0];
    wCard.textContent = envelopeArray[1];
    rCard.textContent = envelopeArray[2];

    //only auto-set text if player accusation
    if (isPlayerAccusation) {
        if (JSON.stringify(guessArray) === JSON.stringify(envelopeArray)) {
            winLoseText.textContent = "You win!";
            winLoseText.style.color = "lime";
        } else {
            winLoseText.textContent = "You lose";
            winLoseText.style.color = "maroon";
        }
    }

    //close HUD when user clicks
    await new Promise(resolve => {
        const handler = (e) => {
            document.removeEventListener("click", handler);
            resolve();
        };
        setTimeout(() => document.addEventListener("click", handler), 0);
    });

    envelopeHUD.style.display = "none";
    //reset the game!
    resetGame();
}

//create board pawn divs to render into room locations
function createBoardPawns(){
    turnOrder.forEach(pawn => {
        const pawnDiv = document.createElement("div");
        pawnDiv.classList.add("board-pawn");
        pawnDiv.dataset.pawn = pawn;
        pawnDiv.style.backgroundColor = pawnColors[pawn];

        //init locations to their corresponding start positions
        const pos = pawnPositions[pawn];
        pawnDiv.style.left = `${pos.x}%`;
        pawnDiv.style.top = `${pos.y}%`;
        document.getElementById("game-board-container").appendChild(pawnDiv);
    })
}

//render pawn moves on the game board
function renderPawnPosition(pawn){
    const pawnDiv = document.querySelector(`.board-pawn[data-pawn="${pawn}"]`);
    const pawnData = pawnPositions[pawn];
    if (!pawnData) return;

    const roomName = pawnLocations[pawn];
    if (!roomName) {
        return;
    }

    const roomId = Object.keys(roomIdToName)
        .find(id => roomIdToName[id] === roomName);

    if (!roomId) {
        return;
    }

    const roomDiv = document.getElementById(roomId);
    const boardDiv = document.getElementById("game-board-container");

    //get bounding boxes
    const roomRect = roomDiv.getBoundingClientRect();
    const boardRect = boardDiv.getBoundingClientRect();

    //random offset so pawns dont stack
    const {xPct , yPct} = pawnData.pos ?? getFreePosition(pawnData.room, roomRect);

    pawnData.pos = {xPct , yPct};

    const pawnSize = pawnDiv.offsetWidth;

    const x = xPct * (roomRect.width - pawnSize);
    const y = yPct * (roomRect.height - pawnSize);

    const left = roomRect.left - boardRect.left + x;
    const top = roomRect.top - boardRect.top + y;

    pawnDiv.style.left = `${left}px`;
    pawnDiv.style.top = `${top}px`;

    //render pawn inside room
    boardDiv.appendChild(pawnDiv);
}

//helper function for pawn collision detection in room position rendering
function getFreePosition(roomName, roomRect){
    if (!roomOccupancy[roomName]){
        roomOccupancy[roomName] = [];
    }

    //max attempts to detect free pos.
    const attempts = 20;

    for (let i = 0; i < attempts; i++){
        const xPct = Math.random() * 0.9;
        const yPct = Math.random() * 0.9;

        const tooClose = roomOccupancy[roomName].some(pos => {
            const dx = pos.xPct - xPct;
            const dy = pos.yPct - yPct;
            return Math.sqrt(dx * dx + dy * dy) < 0.1;
        });

        if (!tooClose){
            roomOccupancy[roomName].push({ xPct , yPct});
            return {xPct , yPct};
        }
    }

    //fallback if room is too cluttered
    return {xPct: 0.05, yPct: 0.05};
}

function findSmartPath(pawn){
    const notebook = cpuNotebooks[pawn];
    const probs = notebook.envelopeProb || {};
    const dontHave = notebook.playersWhoDontHaveIt || {};
    let depth;

    //depth search based on difficulty
    switch (difficulty) {
        case "easy":
            depth = 1;
            break;
        case "medium":
            depth = 2;
            break;
        case "hard":
            depth = 4;
            break;
        default:
            depth = 2;
    }

    //score each room
    function pathfind(room){
        let score = 1; //base score
        const card = notebook.cards[room];
        if (!card?.eliminated) score += 10; //unknown rooms are top priority
        score += (dontHave[room]?.size || 0) * 5; //dontHave bonus
        score += (probs[room] || 0) * 20; //highest weight goes to high prob rooms
        return score;
    }

    //BFS with priority score queue
    const currentRoom = pawnLocations[pawn] || null;
    const startRooms = getAvailableMoves(pawn, currentRoom);

    let bestFirstMove = startRooms[0];
    let bestPathScore = 0;

    for (const firstRoom of startRooms){
        const queue = [{ room: firstRoom, depth: 1, pathScore: pathfind(firstRoom), visited: new Set([firstRoom]) }];
        let localBest = pathfind(firstRoom); //best score starting in this room

        while (queue.length > 0 && queue[0].depth <= depth){
            const { room, depth, pathScore, visited } = queue.shift();

            const nextRooms = getAvailableMoves(pawn, room).filter(r => !visited.has(r)); //avoid cycles by filtering
            
            for (const next of nextRooms){
                const newScore = pathScore + pathfind(next) * Math.pow(0.9, depth); //further rooms = less score
                if (newScore > localBest) localBest = newScore;

                const newVisited = new Set(visited);
                newVisited.add(next);
                queue.push({ room: next, depth: depth + 1, pathScore: newScore, visited: newVisited });
            }
        }

        //if this first move leads to better future move, update
        if (localBest > bestPathScore){
            bestPathScore = localBest;
            bestFirstMove = firstRoom;
        }
    }

    if (debug) console.log(`${pawn} pathfinds to ${bestFirstMove} (best path score: ${bestPathScore.toFixed(1)})`);
    
    return bestFirstMove;
}

//player notebook logic
const notebookToggleBtn = document.getElementById("notebook-toggle-btn");
const notebookContent = document.getElementById("notebook-content");

notebookToggleBtn.addEventListener("click", () => {
    //hide notebook if displayed
    if(notebookContent.style.display !== "none"){
        notebookContent.style.display = "none";
    //show hand if hidden
    } else {
        notebookContent.style.display = "flex";
    }
});

//keybind for notebook
document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "n" && 
        !event.ctrlKey && !event.altKey && !event.metaKey && 
        document.activeElement === document.body) {
        
        //toggle visibility
        if (notebookContent.style.display === "none" || notebookContent.style.display === "") {
            notebookContent.style.display = "flex";
        } else {
            notebookContent.style.display = "none";
        }

        event.preventDefault(); //prevent n from typing
    }
});

function renderPlayerNotebook(){
    const playerHandSet = new Set(playerHands[playerPawn] || []);
    const allEliminated = new Set([...playerHandSet, ...playerSeenCards]);

    const categories = [
        { id: "suspects-table", list: suspectsArray },
        { id: "weapons-table", list: weaponsArray },
        { id: "rooms-table", list: roomsArray }
    ];

    categories.forEach(cat => {
        const table = document.getElementById(cat.id);
        if (!table) return;

        table.innerHTML = "";

        cat.list.forEach(card => {
            const isEliminated = allEliminated.has(card);

            const row = document.createElement("tr");

            row.innerHTML = `
                <td class="card-name ${isEliminated ? 'eliminated' : ''}">${card}</td>
                <td class="card-status ${isEliminated ? 'eliminated' : 'unknown'}">
                    ${isEliminated ? '✗' : '?'}
                </td>
            `;

            table.appendChild(row);
        });
    });
}

//pawns remain on the board when window is resized
window.addEventListener("resize", () => {
    turnOrder.forEach(renderPawnPosition);
});