// --- הגדרות גלובליות ואלמנטים ---
const gridContainer = document.getElementById('grid-container');
const startBtn = document.getElementById('start-btn');
const algorithmSelect = document.getElementById('algorithm-select');
const mazeBtn = document.getElementById('maze-btn');
const clearWallsBtn = document.getElementById('clear-walls-btn');
const clearBoardBtn = document.getElementById('clear-board-btn');
const speedSlider = document.getElementById('speed-slider');

const NUM_ROWS = 20;
const NUM_COLS = 50;
let START_NODE_ROW = 10, START_NODE_COL = 10;
let END_NODE_ROW = 10, END_NODE_COL = 40;

let grid = [];
let isDragging = false;
let nodeBeingDragged = null; // 'start' or 'end'
let wallDrawingMode = null; // 'drawing' or 'erasing'
let animationSpeed = 20;
let isRunning = false;

// --- מבנה נתונים לתא ---
class Cell {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.element = document.createElement('div');
        this.element.className = 'grid-cell';
        this.element.id = `cell-${row}-${col}`;
        this.isWall = false;
        
        this.distance = Infinity;
        this.gScore = Infinity;
        this.fScore = Infinity;
        this.previousNode = null;
    }

    reset() {
        this.distance = Infinity;
        this.gScore = Infinity;
        this.fScore = Infinity;
        this.previousNode = null;
    }
}

// ------ 1. יצירת הרשת והגדרת אירועים ------
function createGrid() {
    gridContainer.innerHTML = '';
    grid = [];
    for (let row = 0; row < NUM_ROWS; row++) {
        const currentRow = [];
        for (let col = 0; col < NUM_COLS; col++) {
            const cell = new Cell(row, col);
            setupEventListeners(cell);
            gridContainer.appendChild(cell.element);
            currentRow.push(cell);
        }
        grid.push(currentRow);
    }
    updateNodeClasses();
}

function updateNodeClasses() {
    for (let row of grid) {
        for (let cell of row) {
            cell.element.classList.remove('start-node', 'end-node');
            if (cell.row === START_NODE_ROW && cell.col === START_NODE_COL) {
                cell.element.classList.add('start-node');
            } else if (cell.row === END_NODE_ROW && cell.col === END_NODE_COL) {
                cell.element.classList.add('end-node');
            }
        }
    }
}

function setupEventListeners(cell) {
    cell.element.addEventListener('mousedown', (e) => {
        e.preventDefault(); // מונע התנהגות גרירה דיפולטיבית של הדפדפן
        if (isRunning) return;
        if (cell.row === START_NODE_ROW && cell.col === START_NODE_COL) {
            nodeBeingDragged = 'start';
        } else if (cell.row === END_NODE_ROW && cell.col === END_NODE_COL) {
            nodeBeingDragged = 'end';
        } else {
            isDragging = true;
            wallDrawingMode = !cell.isWall;
            toggleWall(cell);
        }
    });

    cell.element.addEventListener('mouseover', () => {
        if (nodeBeingDragged) {
            moveNode(cell);
        } else if (isDragging) {
            if (cell.isWall !== wallDrawingMode) {
                toggleWall(cell);
            }
        }
    });
    
    cell.element.addEventListener('mouseup', () => {
        isDragging = false;
        nodeBeingDragged = null;
        wallDrawingMode = null;
    });
}
window.addEventListener('mouseup', () => {
    isDragging = false;
    nodeBeingDragged = null;
    wallDrawingMode = null;
});


// ------ 2. לוגיקת פקדים ואינטראקטיביות ------
function toggleWall(cell) {
    if ((cell.row === START_NODE_ROW && cell.col === START_NODE_COL) || 
        (cell.row === END_NODE_ROW && cell.col === END_NODE_COL)) return;
    cell.isWall = !cell.isWall;
    cell.element.classList.toggle('wall', cell.isWall);
}

function moveNode(newCell) {
    if ((nodeBeingDragged === 'start' && newCell.row === END_NODE_ROW && newCell.col === END_NODE_COL) ||
        (nodeBeingDragged === 'end' && newCell.row === START_NODE_ROW && newCell.col === START_NODE_COL)) {
        return;
    }

    if (nodeBeingDragged === 'start') {
        START_NODE_ROW = newCell.row;
        START_NODE_COL = newCell.col;
    } else {
        END_NODE_ROW = newCell.row;
        END_NODE_COL = newCell.col;
    }
    if (newCell.isWall) toggleWall(newCell);
    updateNodeClasses();
}

function clearPath() {
    for (const row of grid) {
        for (const cell of row) {
            cell.element.classList.remove('visited', 'path');
            cell.reset();
        }
    }
}

function clearWalls() {
    if (isRunning) return;
    clearPath();
    for (const row of grid) {
        for (const cell of row) {
            if (cell.isWall) {
                toggleWall(cell);
            }
        }
    }
}

function clearBoard() {
    if (isRunning) return;
    clearWalls();
    START_NODE_ROW = 10; START_NODE_COL = 10;
    END_NODE_ROW = 10; END_NODE_COL = 40;
    updateNodeClasses();
}

speedSlider.oninput = () => {
    animationSpeed = 110 - speedSlider.value;
};


// ------ 3. לוגיקת האלגוריתמים ------
async function runVisualization() {
    if (isRunning) return;
    isRunning = true;
    clearPath();
    
    const algorithm = algorithmSelect.value;
    const startNode = grid[START_NODE_ROW][START_NODE_COL];
    const endNode = grid[END_NODE_ROW][END_NODE_COL];
    
    let visitedNodesInOrder = [];
    switch (algorithm) {
        case 'bfs': visitedNodesInOrder = bfs(startNode, endNode); break;
        case 'dijkstra': visitedNodesInOrder = dijkstra(startNode, endNode); break;
        case 'astar': visitedNodesInOrder = astar(startNode, endNode); break;
    }
    
    await animateSearch(visitedNodesInOrder, endNode);
    if (!endNode.previousNode) {
        alert("לא נמצא נתיב!");
    }
    
    isRunning = false;
}

function bfs(startNode, endNode) {
    const queue = [startNode];
    const visited = new Set([startNode]);
    const visitedNodesInOrder = [];
    
    while (queue.length > 0) {
        const currentNode = queue.shift();
        visitedNodesInOrder.push(currentNode);
        if (currentNode === endNode) return visitedNodesInOrder;
        
        for (const neighbor of getNeighbors(currentNode)) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                neighbor.previousNode = currentNode;
                queue.push(neighbor);
            }
        }
    }
    return visitedNodesInOrder;
}

function dijkstra(startNode, endNode) {
    const unvisitedNodes = getAllNodes();
    startNode.distance = 0;
    const visitedNodesInOrder = [];

    while (unvisitedNodes.length > 0) {
        unvisitedNodes.sort((a, b) => a.distance - b.distance);
        const closestNode = unvisitedNodes.shift();
        if (closestNode.isWall) continue;
        if (closestNode.distance === Infinity) return visitedNodesInOrder;
        
        visitedNodesInOrder.push(closestNode);
        if (closestNode === endNode) return visitedNodesInOrder;

        for (const neighbor of getNeighbors(closestNode)) {
            const distance = closestNode.distance + 1;
            if (distance < neighbor.distance) {
                neighbor.distance = distance;
                neighbor.previousNode = closestNode;
            }
        }
    }
    return visitedNodesInOrder;
}

function astar(startNode, endNode) {
    const openSet = [startNode];
    startNode.gScore = 0;
    startNode.fScore = heuristic(startNode, endNode);
    const visitedNodesInOrder = [];

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.fScore - b.fScore);
        const currentNode = openSet.shift();
        
        visitedNodesInOrder.push(currentNode);
        if (currentNode === endNode) return visitedNodesInOrder;

        for (const neighbor of getNeighbors(currentNode)) {
            const tentativeGScore = currentNode.gScore + 1;
            if (tentativeGScore < neighbor.gScore) {
                neighbor.previousNode = currentNode;
                neighbor.gScore = tentativeGScore;
                neighbor.fScore = neighbor.gScore + heuristic(neighbor, endNode);
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                }
            }
        }
    }
    return visitedNodesInOrder;
}

function heuristic(nodeA, nodeB) {
    const dx = Math.abs(nodeA.col - nodeB.col);
    const dy = Math.abs(nodeA.row - nodeB.row);
    return dx + dy;
}


// ------ 4. אנימציה ושחזור נתיב (עם התיקונים) ------
async function animateSearch(visitedNodesInOrder, endNode) {
    for (const cell of visitedNodesInOrder) {
        const isStart = cell.row === START_NODE_ROW && cell.col === START_NODE_COL;
        const isEnd = cell.row === END_NODE_ROW && cell.col === END_NODE_COL;

        if (!isStart && !isEnd) {
            cell.element.classList.add('visited');
            await sleep(animationSpeed);
        }
        
        if (cell === endNode) {
            await animatePath(endNode);
            return;
        }
    }
}

async function animatePath(endNode) {
    const path = [];
    let currentNode = endNode;
    while (currentNode !== null) {
        path.unshift(currentNode);
        currentNode = currentNode.previousNode;
    }
    for (const cell of path) {
        const isStart = cell.row === START_NODE_ROW && cell.col === START_NODE_COL;
        const isEnd = cell.row === END_NODE_ROW && cell.col === END_NODE_COL;

        if (!isStart && !isEnd) {
            cell.element.classList.remove('visited');
            cell.element.classList.add('path');
            await sleep(animationSpeed * 2);
        }
    }
}

// ------ 5. יצירת מבוך (Recursive Division) ------
async function generateMaze() {
    if (isRunning) return;
    isRunning = true;
    clearBoard();
    
    for (let col = 0; col < NUM_COLS; col++) {
        await drawWall(grid[0][col]);
        await drawWall(grid[NUM_ROWS - 1][col]);
    }
    for (let row = 0; row < NUM_ROWS; row++) {
        await drawWall(grid[row][0]);
        await drawWall(grid[row][NUM_COLS - 1]);
    }
    
    await recursiveDivision(1, 1, NUM_COLS - 2, NUM_ROWS - 2, chooseOrientation(NUM_COLS - 2, NUM_ROWS - 2));
    isRunning = false;
}

async function recursiveDivision(x, y, width, height, orientation) {
    if (width < 2 || height < 2) return;

    const isHorizontal = orientation === 'horizontal';
    
    let wx = x + (isHorizontal ? 0 : Math.floor(Math.random() * (width - 2) / 2) * 2 + 1);
    let wy = y + (isHorizontal ? Math.floor(Math.random() * (height - 2) / 2) * 2 + 1 : 0);
    
    const passageX = wx + (isHorizontal ? Math.floor(Math.random() * width / 2) * 2 : 0);
    const passageY = wy + (isHorizontal ? 0 : Math.floor(Math.random() * height / 2) * 2);

    const length = isHorizontal ? width : height;
    
    for (let i = 0; i < length; i++) {
        const currentX = wx + (isHorizontal ? i : 0);
        const currentY = wy + (isHorizontal ? 0 : i);
        if (currentX !== passageX || currentY !== passageY) {
            if (grid[currentY][currentX]) {
                 await drawWall(grid[currentY][currentX]);
            }
        }
    }

    if (isHorizontal) {
        await recursiveDivision(x, y, width, wy - y, chooseOrientation(width, wy - y));
        await recursiveDivision(x, wy + 1, width, y + height - (wy + 1), chooseOrientation(width, y + height - (wy + 1)));
    } else {
        await recursiveDivision(x, y, wx - x, height, chooseOrientation(wx - x, height));
        await recursiveDivision(wx + 1, y, x + width - (wx + 1), height, chooseOrientation(x + width - (wx + 1), height));
    }
}
function chooseOrientation(width, height) {
    if (width < height) return 'horizontal';
    if (height < width) return 'vertical';
    return Math.random() < 0.5 ? 'horizontal' : 'vertical';
}

async function drawWall(cell) {
    if (!cell.isWall) toggleWall(cell);
    await sleep(animationSpeed / 2);
}

// ------ פונקציות עזר ------
function getNeighbors(cell) {
    const neighbors = [];
    const { row, col } = cell;
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < NUM_ROWS - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < NUM_COLS - 1) neighbors.push(grid[row][col + 1]);
    return neighbors.filter(neighbor => !neighbor.isWall);
}
function getAllNodes() {
    return grid.flat();
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ------ הרצה ראשונית וחיבור אירועים לכפתורים ------
createGrid();
startBtn.addEventListener('click', runVisualization);
mazeBtn.addEventListener('click', generateMaze);
clearWallsBtn.addEventListener('click', clearWalls);
clearBoardBtn.addEventListener('click', clearBoard);

const modalContainer = document.getElementById('modal-container');
const closeModalBtn = document.getElementById('close-modal-btn');
closeModalBtn.addEventListener('click', () => { modalContainer.style.display = 'none'; });