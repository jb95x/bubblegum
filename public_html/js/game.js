
//Table Variables

var side = 2;

//Draw precalc

var Unit;

//Canvas variables
var parent;
var ctx;
var c;

//Matrix's

var tableMatrix = [];

function onResize() {
    c.width = parent.offsetWidth*0.8;
    c.height = c.width;
    Unit = c.width / side;
    draw();
}

function setupTableMatrix(){
    for (let i = 0; i < side; i++) {
        let tmpLine = [];
        for (let j = 0; j < side; j++) {
            tmpLine.push(360*Math.random());
        }
        tableMatrix.push(tmpLine);
    }
}

function onGameConnection(table) {
    tableMatrix = table;
    side = table.length;
    Unit = c.width / side;
    draw();
}

(function setup() {
    let canvas = document.createElement('canvas');
    parent = document.getElementById('board');
    canvas.width = parent.offsetWidth*0.8;
    canvas.height = canvas.width;
    c = parent.appendChild(canvas);
    ctx = c.getContext('2d');
    window.addEventListener('resize', onResize);
    c.addEventListener('click', onClick);
    c.onselectstart = function () { return false; }
    setupTableMatrix();
    onResize();
    draw();
})();

function onMark(data) {
    snd_mark();
    tableMatrix[data.x][data.y] = data.color;
    draw();
}

function onClick(evt){
    let x = Math.floor(evt.offsetX / Unit);
    let y = Math.floor(evt.offsetY / Unit);
    socket.emit('mark', {x: x, y: y});

}

//Draw Game Board 

function drawBoard() {
    for (let i = 0; i < side; i++) {
        for (let j = 0; j < side; j++) {
            ctx.beginPath();
            ctx.arc(Unit/2 + i * Unit, Unit/2 + j * Unit, Unit/3, 0, 2*Math.PI);
            if(tableMatrix[i][j] == 'x'){
                ctx.fillStyle = 'black';
                ctx.lineWidth = 5;
                ctx.strokeStyle = 'white';
                ctx.stroke();
            } else {
                ctx.fillStyle = 'hsl(' + tableMatrix[i][j] + ', 100%, 50%)';
            }
            ctx.fill();
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    drawBoard();
}