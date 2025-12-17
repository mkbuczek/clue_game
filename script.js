const pawns = document.querySelectorAll(".pawn");
const suspectBtns = document.querySelectorAll(".suspect-btn");
const weaponBtns = document.querySelectorAll(".weapon-btn");
const setupContainer = document.getElementById("setup-container");
const gameContainer = document.getElementById("game-container");
const currentTurnHeader = document.getElementById("current-turn-header");
const guessHUD = document.getElementById("guess-hud");
const guessAccuseHUD = document.getElementById("guess-accuse-hud");
const envelopeHUD = document.getElementById("envelope-hud");
const gamePawnContainer = document.getElementById("game-pawn-container");

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

const roomOccupancy = {};

const debug = true;

let envelopeArray = [];

let playerPawn = null;
let playerAmt = 2;
let playerHands = {};

let turnOrder = [];
let currentTurnIndex = 0;
let pawnLocations = {};

let cpuNotebooks = {};

let roomGuess = null;
let suspectGuess = null;
let weaponGuess = null;
let guessBtnHandler = null;

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
        console.error("No pawn selected");
        return;
    }

    playerAmt = document.getElementById("player-select-box").value; //get num of players
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

    //setup functions
    generateCrime();
    const playerHand = generatePlayerHands();
    renderHands(playerHand);
    renderTurnOrder(turnOrder);
    highlightCurrentTurnPawn();
    initCPUNotebooks();
    createBoardPawns();

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
    envelopeArray = [];

    //player guesses
    suspectGuess = null;
    weaponGuess = null;
    roomGuess = null;
    playerPawn = null;

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
    if(debug) console.log(`Envelope: ${envelopeArray}`); //debug
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
        hideBtn.textContent = "Show";
        
    //show hand if hidden
    } else {
        handDiv.style.display = "flex";
        hideBtn.textContent = "Hide";
    }
})

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

    if(debug) console.log(`It's ${currentPawn}'s turn`); //debug
    currentTurnHeader.textContent = `It's ${currentPawn}'s turn`
    highlightCurrentTurnPawn();

    if (currentPawn === playerPawn){
        playerMove();
    } else {
        cpuMove(currentPawn);
    }

    if(debug) console.log(cpuNotebooks);
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

    if(debug) console.log(`${playerPawn} can move to: ${availableMoves.join(", ")}`);

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

async function cpuMove(currentPawn){
    //cpu is thinking
    showRevealedCardBox(currentPawn, `is thinking...`, null, false);
    await dialogueWait({ ms: 1500 });
    hideRevealedCardBox();
    await dialogueWait({ ms: 1500 });

    //move to a room
    const currentRoom = pawnLocations[currentPawn];
    const availableRooms = getAvailableMoves(currentPawn, currentRoom);
    const chosenRoom = pickOne(availableRooms);

    //update location
    pawnLocations[currentPawn] = chosenRoom;
    renderPawnPosition(currentPawn); //render pawn to room

    //show cpu move
    showRevealedCardBox(currentPawn, `moved to the ${chosenRoom}`, null, false)
    await dialogueWait({ ms: 1500 });
    hideRevealedCardBox();
    await dialogueWait({ ms: 1500 });

    //cpu guesses
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

function generateCPUGuess(pawn, currentRoom){
    const notebook = cpuNotebooks[pawn].cards;

    //safe: in cpu hand or seen & eliminated
    const safeSuspects = suspectsArray.filter(s => notebook[s].eliminated);
    const safeWeapons = weaponsArray.filter(w => notebook[w].eliminated);

    //unknown: never seen
    const unknownSuspects = suspectsArray.filter(s => !notebook[s].eliminated);
    const unknownWeapons = weaponsArray.filter(w => !notebook[w].eliminated);

    //20% chance to bluff and guess cards in hand
    const bluffChance = Math.random() < 0.2;

    if(bluffChance) console.log(`${pawn} is bluffing!`);

    //cpu prefers safe => then unknown => then falls back to any
    const suspect = bluffChance && safeSuspects.length > 0
        ? pickOne(safeSuspects)
        : pickOne(unknownSuspects.length > 0 ? unknownSuspects : suspectsArray);

    const weapon = bluffChance && safeWeapons.length > 0
        ? pickOne(safeWeapons)
        : pickOne(unknownWeapons.length > 0 ? unknownWeapons : weaponsArray);

    return { suspect, weapon, room: currentRoom };
}

function updateCPUNotebook(guesser, guessArray, revealedInfo){
    const notebook = cpuNotebooks[guesser];
    if (!notebook) return;

    if(revealedInfo){
        const card = revealedInfo.card;
        const entry = notebook.cards[card];
        entry.seen = true;
        entry.holder = revealedInfo.player;
        entry.eliminated = true;
    } else {
        guessArray.forEach(card => {
            notebook.cards[card].possibleEnvelope = true;
        });
    }
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

function showGuessAccuseHUD(clickedRoom){
    guessAccuseHUD.style.display = "flex";

    const guessBtn = document.getElementById("choose-guess-btn");
    const accuseBtn = document.getElementById("choose-accuse-btn");

    guessBtn.addEventListener("click", () => {
        showGuessHUD(clickedRoom, true);
        guessAccuseHUD.style.display = "none";
    });

    accuseBtn.addEventListener("click", () => {
        showGuessHUD(clickedRoom, false);
        guessAccuseHUD.style.display = "none";
    });
}

//displays guess HUD, called when player chooses to guess after clicking a room
function showGuessHUD(room, guess = true){
    const roomLabel = document.getElementById("room-label");
    const guessHeader = document.getElementById("guess-hud-header");
    const guessBtn = document.getElementById("guess-btn");
    roomLabel.textContent = `Room: ${room}`;
    roomGuess = room;

    guessHUD.style.display = "flex";

    //remove previous listener
    if (guessBtnHandler) {
        guessBtn.removeEventListener("click", guessBtnHandler);
        guessBtnHandler = null;
    }

    //add listener
    guessBtnHandler = () => {
        submitGuess(guess);
    };
    guessBtn.addEventListener("click", guessBtnHandler);

    //update HUD text
    if(!guess) {
        guessHeader.textContent = "Accuse!";
        guessBtn.textContent = "Submit Accusation";
    } else {
        guessHeader.textContent = "Guess!";
        guessBtn.textContent = "Submit Guess";
    }
}

suspectBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        suspectBtns.forEach(btn => btn.classList.remove("selected-guess-hud-btn")); //remove class on each click
        btn.classList.add("selected-guess-hud-btn"); //add class

        const suspectLabel = document.getElementById("suspect-label");
        suspectLabel.textContent = `Suspect: ${btn.textContent}`;
        suspectGuess = btn.textContent;
    });
});

weaponBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        weaponBtns.forEach(btn => btn.classList.remove("selected-guess-hud-btn")); //remove class on each click
        btn.classList.add("selected-guess-hud-btn"); //add class
        
        const weaponLabel = document.getElementById("weapon-label");
        weaponLabel.textContent = `Weapon: ${btn.textContent}`;
        weaponGuess = btn.textContent;
    });
});

//puts each guess into an array to compare to the envelopeArray
async function submitGuess(guess = true){
    //check if weapon and suspect are selected
    if (!suspectGuess || !weaponGuess || !roomGuess){
        console.error("Please select a suspect, weapon, and room.")
        return;
    }

    //reset labels
    const suspectLabel = document.getElementById("suspect-label");
    suspectLabel.textContent = `Suspect: ???`;
    const weaponLabel = document.getElementById("weapon-label");
    weaponLabel.textContent = `Weapon: ???`;

    let guessArray = [suspectGuess, weaponGuess, roomGuess];
    console.log(guessArray);

    //reset HUD
    guessHUD.style.display = "none";
    suspectGuess = weaponGuess = roomGuess = null;
    suspectBtns.forEach(btn => btn.classList.remove("selected-guess-hud-btn"));
    weaponBtns.forEach(btn => btn.classList.remove("selected-guess-hud-btn"));

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
                    hideBtn.textContent = "Hide";
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
        // Clean up any previous click handler
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
        openEnvelope(guessArray);
        envelopeHUD.style.display = "none";
    });
}

async function openEnvelope(guessArray){
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

    //envelope is the same as accusation; player wins!
    if (JSON.stringify(guessArray) === JSON.stringify(envelopeArray)) {
        winLoseText.textContent = "You win!";
        winLoseText.style.color = "lime";
    } else {
        //player loses
        winLoseText.textContent = "You lose";
        winLoseText.style.color = "maroon";
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

function initCPUNotebooks(){
    cpuNotebooks = {};

    turnOrder.forEach(pawn => {
        if (pawn === playerPawn) return; //skip human player

        //init each cpu notebook
        cpuNotebooks[pawn] = {
            cards: {},
            guesses: [],
            hand: new Set(playerHands[pawn])
        };

        //init all cards as unknown
        allCardsArray.forEach(card => {
            const inHand = cpuNotebooks[pawn].hand.has(card);

            cpuNotebooks[pawn].cards[card] = {
                eliminated: inHand,
                holder: inHand ? pawn : null,
                possibleEnvelope: false,
            };
        });
    });
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
        if (debug) console.warn("Pawn has no room yet:", pawn);
        return;
    }

    const roomId = Object.keys(roomIdToName)
        .find(id => roomIdToName[id] === roomName);

    if (!roomId) {
        if (debug) console.warn("No roomId found for room:", roomName);
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

window.addEventListener("resize", () => {
    turnOrder.forEach(renderPawnPosition);
});