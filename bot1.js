function randomBot(game, maxTime) {
    console.log("random bot thinking...")
    const moves = game.moves();
    const randomIndex = Math.floor(Math.random() * moves.length);
    const startTime = Date.now();
    while (Date.now() - startTime < maxTime) {}
    return moves[randomIndex];
}

const botList = { 
    "random bot": randomBot,
}

export { botList };