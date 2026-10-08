const {body} = document;

const piecesCaracters = { 
    

function newElem(...classNames) {
    const el =  document.createElement("div");
    el.classList.add(...classNames);
    return el;
}

function newAffBoard() {
    const obj = {
      boardElem: null,
    }
    initAffBoard(obj);
    return obj;
}

function initAffBoard(affBoard) {
    const container = newElem("board-container");
    const boardElem = createBoardElem();
    container.appendChild(boardElem);
    affBoard.boardElem = boardElem;
    body.appendChild(container);
}

function createBoardElem() {
    const boardElem = newElem("board");
    for (let i = 0; i < 64; i++) {
        const color = (Math.floor(i/8) + i) % 2 === 0 ? "var(--white-color)" : "var(--black-color)";
        const cell = newElem("cell");
        cell.style.backgroundColor = color;
        boardElem.appendChild(cell)

    }
    return boardElem;
}

const mainAffBoard = newAffBoard();