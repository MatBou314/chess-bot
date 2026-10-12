function randomBot(board, maxTime) {
    const moves = board.moves();
    const randomIndex = Math.floor(Math.random() * moves.length);
    const startTime = Date.now();
    while (Date.now() - startTime < maxTime) {}
    return moves[randomIndex];
}

const botList = { 
    randomBot: randomBot,
}

export { botList };