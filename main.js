// global state for game
const colors = {0: "#de498f", 1: "#760a82", "-1": "lightblue"};
const columns = ["a", "b", "c", "d", "e", "f", "g"]
let wins;
let gameOver;
let player;
let board;
let opponent;
let buttonUnderMouse;
let gameHistory;
let gameHistoryIndex;

// keys for reviewing game
document.addEventListener("keyup", event => {
    if (!gameOver) return;
    if (event.code === "ArrowLeft") gameHistoryIndex = Math.max(gameHistoryIndex - 1, 0);
    else if (event.code === "ArrowRight") gameHistoryIndex = Math.min(gameHistoryIndex + 1, gameHistory.length - 1);
    board = gameHistory[gameHistoryIndex];
    drawBoard(highlightWins = gameHistoryIndex === gameHistory.length - 1);
});

// button for taking back a move vs ai only
document.getElementById("takeback").addEventListener("click", () => {
    gameHistory.pop();
    gameHistory.pop();
    board = gameHistory[gameHistory.length - 1];
    player = 0;
    gameOver = false;
    wins = [];
    drawBoard();
});

function newGame(opp) {
    opponent = opp;
    wins = [];
    gameOver = false;
    player = 0; // 0 is first player, 1 is second player
    board = [
        [-1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1]
    ]; // left to right array of columns
       // each column is bottom to top
       // -1 means empty
    drawBoard();
    gameHistory = [copy(board)];
}

newGame("human");

document.getElementById("newGame").addEventListener("click", () => { newGame("human") });
document.getElementById("newGameAI").addEventListener("click", () => { newGame("ai") });

// updates board with result of move
function makeMove(column) {
    let nextSlot = board[column].indexOf(-1);
    board[column][nextSlot] = player;
    gameHistory.push(copy(board));
    checkWin();
    drawBoard();
    player = 1 - player;
}

// updates page with representation of the board
function drawBoard(highlightWins=true) {
    for (let column = 0; column < 7; column++) {
        for (let row = 0; row < 6; row++) {
            document.getElementById(`${columns[column]}${row + 1}`).style.backgroundColor = colors[board[column][row]];
            document.getElementById(`${columns[column]}${row + 1}`).style.boxShadow = "";
        }
    }
    if (highlightWins) {
        for (let win of wins) {
            for (let [col, row] of win) {
                document.getElementById(`${columns[col]}${row + 1}`).style.boxShadow = "0px 0px 20px 10px #b9fae2";
            }
        }
    }
}

// check for win
function checkWin() {
    // check if arr is all 0 or all 1
    function allSame(arr) {
        let first = arr[0];
        for (let elt of arr) {
            if (elt === -1 || elt !== first) return false;
        }
        return true;
    }
    for (let [possibleWin, possibleWinCoords] of fours(board)) {
        if (allSame(possibleWin)) wins.push(possibleWinCoords);
    }
    if (wins.length > 0) {
        gameOver = true;
        gameHistoryIndex = gameHistory.length - 1;
    }
}

// iterate over all "4-in-a-row"s (candidate wins)
// yields a pair of the 4 values (player 1, player 2, empty) and the 4 locations considered
function fours(board) {
    let result = [];
    let values;
    let coords;
    // columns
    for (let column = 0; column < 7; column++) {
        for (let startingRow = 0; startingRow < 3; startingRow++) {
            values = [];
            coords = [];
            for (let i = 0; i < 4; i++) {
                values.push(board[column][startingRow + i]);
                coords.push([column, startingRow + i]);
            }
            result.push([values, coords]);
        }
    }
    // rows
    for (let row = 0; row < 6; row++) {
        for (let startingColumn = 0; startingColumn < 4; startingColumn++) {
            values = [];
            coords = [];
            for (i = 0; i < 4; i++) {
                values.push(board[startingColumn + i][row]);
                coords.push([startingColumn + i, row]);
            }
            result.push([values, coords]);
        }
    }
    // diagonals: left to right, bottom to top
    for (let startingColumn = 0; startingColumn < 4; startingColumn++) {
        for (let startingRow = 0; startingRow < 3; startingRow++) {
            values = [];
            coords = [];
            for (let i = 0; i < 4; i++) {
                values.push(board[startingColumn + i][startingRow + i]);
                coords.push([startingColumn + i, startingRow + i]);
            }
            result.push([values, coords]);
        }
    }
    // anti-diagonals: left to right, top to bottom
    for (let startingColumn = 0; startingColumn < 4; startingColumn++) {
        for (let startingRow = 5; startingRow > 2; startingRow--) {
            values = [];
            coords = [];
            for (let i = 0; i < 4; i++) {
                values.push(board[startingColumn + i][startingRow - i]);
                coords.push([startingColumn + i, startingRow - i]);
            }
            result.push([values, coords]);
        }
    }
    return result;
}


// initialize buttons
const buttons = {};
for (let [index, column] of columns.entries()) {
    buttons[column] = document.getElementById(column);
    buttons[column].addEventListener("mouseover", event => {
        if (!gameOver && board[index].indexOf(-1) !== -1 && (opponent === "human" || player === 0)) buttons[column].style.backgroundColor = colors[player];
        buttonUnderMouse = column;
    });
    buttons[column].addEventListener("mouseout", event => {
        buttons[column].style.background = "transparent";
        buttonUnderMouse = undefined;
    });
    buttons[column].addEventListener("click", event => {
        lastClicked = column;
        if (!gameOver && board[index].indexOf(-1) !== -1 && (opponent === "human" || player === 0)) {
            makeMove(index);
            if (opponent === "ai") setTimeout(ai, 50);
            if (!gameOver && board[index].indexOf(-1) !== -1 && opponent === "human") {
                buttons[column].style.backgroundColor = colors[player];
            } else {
                buttons[column].style.background = "transparent";
            }
        }
    });
}

function ai() {
    if (gameOver) return;
    let [move, value] = negamax(board, 5, 1);
    makeMove(move);
    console.log(`playing column ${move} with value ${value}`);
    if(buttonUnderMouse !== undefined) document.getElementById(buttonUnderMouse).style.backgroundColor = colors[0];
}

// return all legal moves for a given board state
function getCandidateMoves(boardState) {
    let candidateMoves = [];
    for (let column = 0; column < 7; column++) {
        if (boardState[column].indexOf(-1) !== -1) candidateMoves.push(column);
    }
    return candidateMoves;
}

// check if two length 4 arrays of numbers are equal
function equals(arr1, arr2) {
    for (let i = 0; i < 4; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}

// checks if game is over (terminal game node)
function terminal(boardState) {
    for (let [values, _] of fours(boardState)) {
        if (equals(values, [0, 0, 0, 0]) || equals(values, [1, 1, 1, 1])) return true;
    }
    return false;
}

// makes a deep copy of board
function copy(boardState) {
    let newBoard = [[],[],[],[],[],[],[]];
    for (let c = 0; c < 7; c++) {
        for (let r = 0; r < 6; r++) {
            newBoard[c].push(boardState[c][r]);
        }
    }
    return newBoard;
}

// places new piece in column on boardState to create new boardState
function update(boardState, column, player) {
    let newBoard = copy(boardState);
    let nextSlot = newBoard[column].indexOf(-1);
    newBoard[column][nextSlot] = player;
    return newBoard;
}

// values a whole board
function heuristicValue(boardState) {
    let value = 0;
    for (let [values, _] of fours(boardState)) {
        value += valueFour(values);
    }
    return value;
}

// values locally: only 4 spaces in a row
function valueFour(values) {
    // loss
    if (equals(values, [0, 0, 0, 0])) return -Infinity;
    // victory
    if (equals(values, [1, 1, 1, 1])) return Infinity;
    // otherwise just want more pieces in the four
    let value = 0;
    for (let piece of values) {
        value += {'0': -1, '1': 1, '-1': 0}[piece]; // opponents pieces are -1, ai's are 1, blank is 0
    }
    return value;
}

// search algorithm for selecting move
function negamax(boardState, depth, color) {
    if (depth === 0 || terminal(boardState)) {
        return ["na", color * heuristicValue(boardState)];
    }
    let value = -Infinity;
    let bestMove = getCandidateMoves(boardState)[0]; // gotta pick some default if all moves are -Infinity bad
    for (let move of getCandidateMoves(boardState)) {
        let newBoardState = update(boardState, move, {'1': 1, '-1': 0}[color]);
        let [_, moveValue] = negamax(newBoardState, depth - 1, -color);
        moveValue *= -1
        if (moveValue === Infinity) return [move, moveValue]; // no need to search further
        if (moveValue > value) {
            value = moveValue;
            bestMove = move;
        }
    }
    return [bestMove, value];
}

