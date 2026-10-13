import { Chess } from "https://esm.sh/chess.js";
import { botList } from "./allBots.js";
const {body} = document;

const piecesImg = { 
    p: "♙",
    r: "♖",
    n: "♘",
    b: "♗",
    q: "♕",
    k: "♔",
    K: "♚",
    Q: "♛",
    B: "♝",
    N: "♞",
    R: "♜",
    P: "♟",
}

const letters = ["a", "b", "c", "d", "e", "f", "g", "h"];

function squareName(square) {
    const row = Math.floor(square / 8);
    const col = square % 8;
    return letters[col] + (8 - row);
}

function newElem(...classNames) {
    const el =  document.createElement("div");
    el.classList.add(...classNames);
    return el;
}

function createText(str, size="2vw", ) {
    const el = newElem("text");
    el.textContent = str;
    el.style.fontSize = size;
    return el;
}


// ======= BOARD ======= //

function createBoardElem(affBoard) {
    const boardElem = newElem("board");
    for (let i = 0; i < 64; i++) {
        const color = (Math.floor(i/8) + i) % 2 === 0 ? "var(--white-color)" : "var(--black-color)";
        const cell = newElem("cell");
        const piece = newElem("piece");
        cell.appendChild(piece);
        cell.style.backgroundColor = color;
        boardElem.appendChild(cell);
        cell.addEventListener("mousedown", () => handleClick(affBoard, i));
    }
    return boardElem;
}

function updateBoard(affBoard) {
    const {orientation} = affBoard;
    let legalMoves = [];
    if (affBoard.squareSelect !== null) {
        const square = orientation ? affBoard.squareSelect : 63 - affBoard.squareSelect;
        legalMoves = affBoard.game.moves({square: squareName(square), verbose: true});
    }
    for (let square = 0; square < 64; square++) {
        const idx = orientation ? square : 63-square;
        const cell = affBoard.boardElem.children[square];
        // pieces
        const pieceElem = cell.children[0];
        const piece = affBoard.game.get(squareName(idx));
        if (piece) {
            const {type, color} = piece;
            const char = color === "w" ? type.toLowerCase() : type.toUpperCase();
            pieceElem.textContent = piecesImg[char];
        }
        else pieceElem.textContent = "";

        // select
        if (affBoard.squareSelect === idx) cell.classList.add("select");
        else cell.classList.remove("select");

        // legal moves
        if (legalMoves.some(move => move.to === squareName(idx))) cell.appendChild(newElem("legal-move"));
        else cell.replaceChildren(pieceElem);
    }
}

// ======= PANEL ======= //

function addControls(panelElem, affBoard) {
    const container = newElem("control-container");
    const leftArrow = newElem("control-button");
    const rightArrow = newElem("control-button");
    leftArrow.textContent = "←";
    rightArrow.textContent = "→";
    leftArrow.addEventListener("mousedown", () => undoMove(affBoard));
    rightArrow.addEventListener("mousedown", () => redoMove(affBoard));
    container.appendChild(leftArrow);
    container.appendChild(rightArrow);
    const orientationButton = newElem("control-button");
    orientationButton.textContent = "↻";
    orientationButton.addEventListener("mousedown", () => changeOrientation(affBoard));
    container.appendChild(orientationButton);
    panelElem.appendChild(container);
}

function switchBots(affBoard) {
    const {bots} = affBoard;
    const temp = bots.w;
    bots.w = bots.b;
    bots.b = temp;
}

function addBotControls(panelElem, affBoard) {
    const {bots} = affBoard;
    const bot = affBoard.bots.w.controlled ? bots.b : bots.w;
    const botPanel = newElem("bot-controls");
    panelElem.appendChild(botPanel);

    botPanel.appendChild(createText("Bot choice: ", "1.5vw"));
    const botChoice = document.createElement("select");
    for (const name in botList) {
        const option = document.createElement("option");
        option.textContent = name;
        option.value = name;
        botChoice.appendChild(option);
    }
    botPanel.appendChild(botChoice);
    botChoice.addEventListener("change", () => {
        bot.id = botChoice.value;
    })

    botPanel.appendChild(createText("\n", "1vw"));

    botPanel.appendChild(createText("Max Time: \n", "1.5vw"))
    const maxTime = document.createElement("input");
    maxTime.value = bot.maxTime;
    botPanel.appendChild(maxTime);
    maxTime.addEventListener("change", () => {
        bot.maxTime = Number(maxTime.value);
    })
    bot.controlled = true;
}

function addBotPause(panelElem, affBoard) {
    const botPause = newElem("control-button");
    botPause.appendChild(createText("\n", "1vw"));
    botPause.textContent = affBoard.botPause ? "▶ Resume Bot" : "⏸ Pause Bot";
    botPause.addEventListener("mousedown", () => {
        affBoard.botPause = !affBoard.botPause;
        botPause.textContent = affBoard.botPause ? "▶ Resume Bot" : "⏸ Pause Bot";
        nextTurn(affBoard);
    })
    panelElem.appendChild(botPause);
}

const panelStructure = {
    pvp: [addControls],
    pvb: [addBotControls, addBotPause, addControls],
    bvb: [addBotControls, addBotControls, addBotPause, addControls],
}

function updatePanel(affBoard) {
    if (!affBoard.panelElem) return;
    const structure = panelStructure[MODE];
    const {panelElem, bots} = affBoard;
    bots.w.controlled = false;
    bots.b.controlled = false;
    panelElem.replaceChildren();
    for (const part of structure) {
        part(panelElem, affBoard);
    }
}

function initAffBoard(affBoard, controlled=true) {
    const boardElem = createBoardElem(affBoard);
    const container = newElem("game-container");
    body.appendChild(container);
    container.appendChild(boardElem);
    
    if (controlled) {
        const panelElem = newElem("panel");
        container.appendChild(panelElem);
        affBoard.panelElem = panelElem;
    } 
    affBoard.boardElem = boardElem;
    
    updatePanel(affBoard)
    updateBoard(affBoard);
}

function changeOrientation(affBoard) {
    affBoard.orientation = !affBoard.orientation;
    updateBoard(affBoard);
}

function newAffBoard(controlled=true) {
    const obj = {
        game: new Chess(),
        boardElem: null,
        panelElem: null,
        squareSelect: null,
        orientation: true,
        history: [],
        backMoves: 0,
        bots: {
            w: newBot(),
            b: newBot(),
        },
        botPause: true,
    }
    initAffBoard(obj, controlled);
    return obj;
}

function playMove(affBoard, move) {
    const {game, backMoves, history} = affBoard;
    game.move(move);
    history.splice(history.length - backMoves - 1, backMoves);
    affBoard.backMoves = 0;
    history.push(move);
    nextTurn(affBoard);
}

function undoMove(affBoard) {
    const {game, backMoves, history} = affBoard;
    if (backMoves === history.length) return;
    affBoard.backMoves++;
    game.undo();
    affBoard.squareSelect = null;
    updateBoard(affBoard);
    nextTurn(affBoard);
}

function redoMove(affBoard) {
    const {game, backMoves, history} = affBoard;
    if (backMoves === 0) return;
    const move = history[history.length - affBoard.backMoves--];
    game.move(move);
    affBoard.squareSelect = null;
    updateBoard(affBoard);
    nextTurn(affBoard);
}

function handleClick(affBoard, square) {
    const {squareSelect, game, orientation} = affBoard;
    const idx = orientation ? square : 63 - square;
    if (squareSelect === null) {
        affBoard.squareSelect = idx;
    } 
    else if (squareSelect === idx) {
        affBoard.squareSelect = null;
    }
    else {
        if (affBoard.bots[game.turn()].isOn && !affBoard.botPause) affBoard.squareSelect = idx;
        else {
            try {
                const move = {
                    from: squareName(squareSelect),
                    to: squareName(idx),
                    promotion: "q",
                }
                playMove(affBoard, move);
                affBoard.squareSelect = null;
            } catch (e) {
                affBoard.squareSelect = idx;
            }
        }
    }
    updateBoard(affBoard);
}

// ========== MODE HANDLING ========== //
// ==========               ========== //

const modes = {
    pvp: "play",
    pvb: "play bot",
    bvb: "Bot vs bot",
}

let MODE = "pvp";
const mainAffBoard = newAffBoard(true);


const menu = newElem("menu");
body.appendChild(menu);
updateMenu();

function updateMenu() {
    menu.replaceChildren();
    for (const mode in modes) {
        if (mode === MODE) continue;
        const option = newElem("option");
        option.textContent = modes[mode];
        option.addEventListener("mousedown", () => changeMode(mode));
        menu.appendChild(option);
    }
}

function changeMode(newMode) {
    if (newMode === MODE) return;
    MODE = newMode;
    updateMenu();
    updatePanel(mainAffBoard);
    const {bots} = mainAffBoard;
    if (newMode === "pvp") {
        bots.w.isOn = false;
        bots.b.isOn = false;
    } else
    if (newMode === "pvb") {
        bots.w.isOn = false;
        bots.b.isOn = true;
    } else 
    if (newMode === "bvb") {
        bots.w.isOn = true;
        bots.b.isOn = true;
    }
    nextTurn(mainAffBoard);
}

document.addEventListener("keydown", (e) => {
    const {key} = e;
    if (key === "ArrowLeft") undoMove(mainAffBoard);
    else if (key === "ArrowRight") redoMove(mainAffBoard);
})

// ========== BOT WORKER ========== //
// ==========            ========== //

function newBot() {
    return {
        id: Object.keys(botList)[0],
        maxTime: 2000,
        isOn: false,
        controlled: false,
    }
}

const analysisInfo = {
    depth: 0,
    eval: 0,
    move: 0,
}
const moveRequests = new Map();
let worker;
function initWorker() {
  worker = new Worker("worker.js", {type: "module"});
  worker.onmessage = function(event) {
    const { type, depth, eval: moveEval, move, requestId, error } = event.data;

    if (type === "analysisUpdate") {
      analysisInfo.depth = depth;
      analysisInfo.eval = moveEval;
      analysisInfo.move = move;
      return;
    }

    if (!moveRequests.has(requestId)) return;
    const {resolve, reject} = moveRequests.get(requestId);
    if (error) reject(error);
    else {
      moveRequests.delete(requestId);
      resolve(move);
    }
  }
}
initWorker();

function cancelAllBotRequests() {
  for (const [, { reject }] of moveRequests) {
    reject("Cancelled");
  }
  moveRequests.clear();
  worker.terminate();
  initWorker();
}

function getBotMove(affBoard) {
    return new Promise((resolve, reject) => {
        const {game, bots} = affBoard;
        const bot = bots[game.turn()];
        const requestId = Date.now() + Math.random();
    moveRequests.set(requestId, {resolve, reject});
    let maxTime = MODE !== "analysis" ? bot.maxTime : Infinity;
    worker.postMessage({
      requestId,
      botId: bot.id,
      fen: game.fen(),
      maxTime
    });
  });
}

async function playBotMove(affBoard) {
    if (affBoard.botPause) return;
    try {
        const move = await getBotMove(affBoard);
        if (move) {
        playMove(affBoard, move);
        }
    } catch (e) {
      console.error(e);
    }
    updateBoard(affBoard);
}

function nextTurn(affBoard) {
    const {game, bots} = affBoard;
    if (game.isGameOver()) return;
    const bot = bots[game.turn()];
    if (bot.isOn) playBotMove(affBoard);
}