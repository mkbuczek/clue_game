const pawns = document.querySelectorAll(".pawn");
const suspectBtns = document.querySelectorAll(".suspect-btn");
const weaponBtns = document.querySelectorAll(".weapon-btn");
const setupContainer = document.getElementById("setup-container");
const gameContainer = document.getElementById("game-container");
const currentTurnHeader = document.getElementById("current-turn-header");
const guessHUD = document.getElementById("guess-hud");
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

    setupContainer.style.display = "none"; //hide setup container
    gameContainer.style.display = "flex"; //display game container

    nextTurn(); //begin gameplay loop
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
    await new Promise(response => setTimeout(response, 1500));
    hideRevealedCardBox();
    await new Promise(response => setTimeout(response, 1500));

    //move to a room
    const currentRoom = pawnLocations[currentPawn];
    const availableRooms = getAvailableMoves(currentPawn, currentRoom);
    const chosenRoom = pickOne(availableRooms);

    //update location
    pawnLocations[currentPawn] = chosenRoom;

    //show cpu move
    showRevealedCardBox(currentPawn, `moved to the ${chosenRoom}`, null, false)
    await new Promise(response => setTimeout(response, 1500));
    hideRevealedCardBox();
    await new Promise(response => setTimeout(response, 1500));

    //cpu guesses
    const guess = generateCPUGuess(currentPawn, chosenRoom);

    //show guess
    showRevealedCardBox(currentPawn, `I think it was ${guess.suspect} with the ${guess.weapon} in the ${chosenRoom}`, null, true);
    await waitForClick();
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
    pawnLocations[playerPawn] = clickedRoom;

    //remove highlights
    document.querySelectorAll(".room").forEach(room => {
        room.classList.remove("highlight-room");
        room.removeEventListener("click", handleRoomClick);
    });

    showGuessHUD(clickedRoom);
}

//displays guess HUD, called when a room is clicked on a player's turn
function showGuessHUD(room){
    const roomLabel = document.getElementById("room-label");
    roomLabel.textContent = `Room: ${room}`;
    roomGuess = room;

    guessHUD.style.display = "flex";
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
function submitGuess(){
    if (!suspectGuess || !weaponGuess || !roomGuess){
        console.error("Please select a suspect, weapon, and room.")
        return;
    }

    let guessArray = [suspectGuess, weaponGuess, roomGuess];
    console.log(guessArray);

    //reset HUD
    guessHUD.style.display = "none";
    suspectGuess = weaponGuess = roomGuess = null;
    suspectBtns.forEach(btn => btn.classList.remove("selected-guess-hud-btn"));
    weaponBtns.forEach(btn => btn.classList.remove("selected-guess-hud-btn"));

    checkGuess(guessArray);
}

//check if guessArray matches envelopeArray, else, call findMatchingCard
async function checkGuess(guessArray){
    if (envelopeArray.every((val, index) => val === guessArray[index])){
        console.log("You win!");
        return;
    }

    const revealedInfo = await findMatchingCard(guessArray, true); //try to find matching card

    if (revealedInfo){
        console.log(`${revealedInfo.card} was revealed by ${revealedInfo.player}!`);
    } else {
        console.error("No one could disprove");
    }

    endTurn(); //turn ends after guessing
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
                const chosenCard = await playerRevealCard(matchingCards);
                return { player, card: chosenCard};
            } else {
                //no card matches
                showRevealedCardBox(player, "I don't have those cards!", null, true);
                await waitForClick();
                hideRevealedCardBox();
            }
        }

        //cpu is checking cards
        else {
            showRevealedCardBox(player, "is checking their cards...", null, false);
            await new Promise(resolve => setTimeout(resolve, 1500)); //wait before disappearing
            hideRevealedCardBox();
            await new Promise(resolve => setTimeout(resolve, 1000)); //wait before showing

            //if they have a card, check if player should see or not
            if(matchingCards.length > 0){
                const chosenCard = matchingCards[Math.floor(Math.random() * matchingCards.length)];
                
                //reveal card to player if it is a player guess
                if (isPlayerGuess){
                    showRevealedCardBox(player, `showed you: `, chosenCard, true); //display chosen card
                    await waitForClick(); //wait for player click
                    hideRevealedCardBox();
                } else {
                    //reveal card only to cpu if not a player guess
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    showRevealedCardBox(player, `showed a card`, null, true);
                    await waitForClick(); //wait for player click
                    hideRevealedCardBox();
                }

                return { player, card: chosenCard }; //return the revealed card
            } else {
                //if they don't have a card, show refute text
                showRevealedCardBox(player, "I don't have those cards!", null, true);
                await waitForClick();
                hideRevealedCardBox();
            }
        }
    }

    //no one can disprove
    showRevealedCardBox(null, "No one could disprove!", null, true);
    await waitForClick();
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

//waits for a click on the doc
function waitForClick() {
    return new Promise(resolve => {
        const handler = () => {
            document.removeEventListener("click", handler);
            resolve();
        };
        document.addEventListener("click", handler);
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

                const clickHandler = () => {
                    cards.forEach(c => {
                        c.classList.remove("highlighted-card");
                        c.querySelector(".card-header")?.classList.remove("highlighted-card-header");
                        c.onclick = null;
                    });
                    hideRevealedCardBox();
                    resolve(cardName);
                };

                cardDiv.onclick = clickHandler;
            }
        })
    })
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