const pawns = document.querySelectorAll(".pawn");
const suspectBtns = document.querySelectorAll(".suspect-btn");
const weaponBtns = document.querySelectorAll(".weapon-btn");
const setupContainer = document.getElementById("setup-container");
const gameContainer = document.getElementById("game-container");
const currentTurnHeader = document.getElementById("current-turn-header");
const guessHUD = document.getElementById("guess-hud");

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

const debug = true;

let envelopeArray = [];

let playerPawn = null;
let playerAmt = 2;

let turnOrder = [];
let currentTurnIndex = 0;
let pawnLocations = {};

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

    let playerAmt = document.getElementById("player-select-box").value; //get num of players
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
    renderHands(playerHand)

    setupContainer.style.display = "none"; //hide setup container
    gameContainer.style.display = "flex"; //hide setup container

    nextTurn();
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
    if(debug) console.log(envelopeArray); //debug
}

//deals cards to each player's hand until the deck is empty
function generatePlayerHands(){
    let playerAmt = document.getElementById("player-select-box").value; //get num of players
    let deck = allCardsArray.filter(card => !envelopeArray.includes(card));
    let playerHands = {};

    //create playerHands object with each player
    for (let i = 1; i <= playerAmt; i++){
        playerHands[`player${i}`] = [];
    }

    //deal cards randomly until deck is empty
    let currentPlayer = 1;
    while(deck.length > 0){
        let randomIndex = Math.floor(Math.random() * deck.length);
        let card = deck.splice(randomIndex, 1)[0];

        playerHands[`player${currentPlayer}`].push(card);

        //deal to next player
        currentPlayer++;
        if (currentPlayer > playerAmt) currentPlayer = 1; //loop back
    }

    if(debug) console.log(playerHands);
    return playerHands;
}

//render cards from array to divs
function renderHands(playerHand){
    const handContainer = document.getElementById("player-hand");
    handContainer.innerHTML = "";

    //get player1's hand
    const hand = playerHand["player1"];

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

    if (currentPawn === playerPawn){
        playerMove();
    } else {
        //cpuMove(currentPawn);
    }

    //increment at the end of the turn
    currentTurnIndex++;
    if(currentTurnIndex >= turnOrder.length){
        currentTurnIndex = 0;
    }
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
    let guessArray = [suspectGuess, weaponGuess, roomGuess];
    console.log(guessArray);

    guessHUD.style.display = "none";

    checkGuess(guessArray);
}

//check if guessArray matches envelopeArray, else, call findMatchingCard
function checkGuess(guessArray){
    if (envelopeArray.every((val, index) => val === guessArray[index])){
        console.log("You win!");
    } else {
        findMatchingCard();
        console.log("Nope");
    }
}

function findMatchingCard(){
    
}