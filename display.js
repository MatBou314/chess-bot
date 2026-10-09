import { Chess } from "https://esm.sh/chess.js";
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

function createBoardElem(affBoard) {
    const boardElem = newElem("board");
    for (let i = 0; i < 64; i++) {
        const color = (Math.floor(i/8) + i) % 2 === 0 ? "var(--white-color)" : "var(--black-color)";
        const cell = newElem("cell");
        const piece = newElem("piece");
        cell.appendChild(piece);
        cell.style.backgroundColor = color;
        boardElem.appendChild(cell);
        cell.addEventListener("click", () => handleClick(affBoard, i));
    }
    return boardElem;
}

function initAffBoard(affBoard) {
    const container = newElem("board-container");
    const boardElem = createBoardElem(affBoard);
    container.appendChild(boardElem);
    affBoard.boardElem = boardElem;
    body.appendChild(container);
    updateAffBoard(affBoard);
}

function updateAffBoard(affBoard) {
    const {orientation} = affBoard;
    for (let square = 0; square < 64; square++) {
        const idx = orientation ? square : 63-square;
        const cell = affBoard.boardElem.children[idx];
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
    }
}

function changeOrientation(affBoard) {
    affBoard.orientation = !affBoard.orientation;
    updateAffBoard(affBoard);
}

function newAffBoard() {
    const obj = {
        game: new Chess(),
        boardElem: null,
        squareSelect: null,
        orientation: true,
        history: [],
        backMoves: 0,
    }
    initAffBoard(obj);
    return obj;
}

function playMove(affBoard, move) {
    const {game, backMoves, history} = affBoard;
    game.move(move);
    history.splice(history.length - backMoves - 1, backMoves);
    affBoard.backMoves = 0;
    history.push(move);
}

function undoMove(affBoard) {
    const {game, backMoves, history} = affBoard;
    if (backMoves === history.length) return;
    affBoard.backMoves++;
    game.undo();
    updateAffBoard(affBoard);
}

function redoMove(affBoard) {
    const {game, backMoves, history} = affBoard;
    if (backMoves === 0) return;
    const move = history[history.length - affBoard.backMoves--];
    game.move(move);
    updateAffBoard(affBoard);
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
    updateAffBoard(affBoard);
}


// ========== MODE HANDLING ========== //
// ==========               ========== //

const modes = {
    pvp: "play",
    pvb: "play bot",
    bvb: "Bot vs bot",
}

const mainAffBoard = newAffBoard();
let MODE = "pvp";
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
}

document.addEventListener("keydown", (e) => {
    const {key} = e;
    if (key === "ArrowLeft") undoMove(mainAffBoard);
    else if (key === "ArrowRight") redoMove(mainAffBoard);
})