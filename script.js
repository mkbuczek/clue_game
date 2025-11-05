const pawns = document.querySelectorAll(".pawn");

const suspectsArray = ["Miss Scarlet", "Professor Plum", "Mrs. Peacock",
    "Mr. Green", "Colonel Mustard", "Mrs. White"];

const weaponsArray = ["Candlestick", "Dagger", "Lead Pipe",
    "Pistol", "Rope", "Wrench"];

const roomsArray = ["Hall", "Lounge", "Dining Room", "Kitchen",
    "Ballroom", "Conservatory", "Billiard Room", "Library", "Study"];

pawns.forEach(pawn => {
    pawn.addEventListener("click", () => {
        pawns.forEach(pawn => pawn.classList.remove("selected-pawn"));
        console.log(`You clicked ${pawn.id}`);
        pawn.classList.add("selected-pawn");
    });
});

function pickOne(array){
    let randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

function generateCrime(){
    const suspect = pickOne(suspectsArray);
    const weapon = pickOne(weaponsArray);
    const room = pickOne(roomsArray);
    console.log(`${suspect} did it with the ${weapon} in the ${room}!`);
}

function generatePlayerHand(){
    
}