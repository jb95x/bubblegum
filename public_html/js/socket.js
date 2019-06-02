const socket = io('/bubblegum');

var room = document.getElementById('room');
var password = document.getElementById('password');
var username = document.getElementById('username');
var color = document.getElementById('usercolor');
var startbutton = document.getElementById('startbutton');
var globalsettings = document.getElementById('globalsettings');
var rtt = 0;
var volume = 1;

startbutton.style.display = 'none';
globalsettings.style.display = 'none';
document.getElementById('roomname').style.display = 'none';
color.value = randomHexColor();


socket.on('mark', onMark);
socket.on('message', onMessage);
socket.on('gameOver', onGameOver);
socket.on('scoreBoard', onScoreBoard);
socket.on('changeStartButton', onChangeStartButton);
socket.on('goGoGo', onGoGoGo);
socket.on('publicRoomsInfo', onPublicRoomsInfo);
socket.on('updatePublicRoomInfo', onUpdatePublicRoomsInfo); 


socket.on('notification', (data) => {
    snd_notification();
    Materialize.toast(data.text, 3000, 'rounded');
});

socket.on('setTable', (data) => {
    snd_entered();
    startbutton.style.display = 'block';
    startbutton.innerHTML = data.button;
    onGameConnection(data.table);
    document.getElementById('roomname').style.display = 'block';
    document.getElementById('roomname').innerHTML = 'Room ' + data.name + ' (' + data.table.length + 'x' + data.table.length + ')';
});

function onEnterRoom(e) {
    if (e.keyCode == 13 || e.which == 13) enterRoom();
}

function onUpdateUser(e) {
    if (e.keyCode == 13 || e.which == 13) updateUser();
}

function enterRoom() {
    let packet = {};
    packet.room = room.value;
    packet.password = password.value;
    socket.emit('joinRoom', packet);
}

function updateUser() {
    let packet = {};
    packet.username = username.value;
    packet.color = hex2hue(color.value);
    socket.emit('updateUser', packet);
}

function hex2hue(hex) {
    hex = hex.slice(1);
    let r = parseInt(hex.slice(0, 2), 16);
    let g = parseInt(hex.slice(2, 4), 16);
    let b = parseInt(hex.slice(4, 6), 16);
    let hue = Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b);
    return (hue / (2 * Math.PI)) * 360;
}

function randomHexColor() {
    let result = '#'
    for (let i = 0; i < 6; i++) {
        result += Math.ceil(15 * Math.random()).toString(16);
    }
    return result;
}

function startGame() {
    let sd = document.getElementById('tablesize');
    let tableSize = sd.options[sd.selectedIndex].value;
    socket.emit('startGame', tableSize);
}

function onChangeStartButton(text) {
    snd_beep();
    startbutton.innerHTML = text;
}

function onGoGoGo(text) {
    snd_go();
    startbutton.innerHTML = text;
}

function onGameOver(highscore) {
    snd_gameover();
    startbutton.innerHTML = highscore.username + ' is the WINNER!';
}

function onVolumeChange() {
    volume = document.getElementById('volumebar').value / 100;
    snd_click();
}

function showGlobalSettings() {
    globalsettings.style.display = globalsettings.style.display == 'none' ? 'inline-block' : 'none';
}

setInterval(() => {
    rtt = Date.now();
    socket.emit('pingyou', rtt);
}, 10000);

socket.on('pongme', (packet) => {
    let ping = Date.now() - rtt;
    document.getElementById('pingviewer').innerHTML = 'Ping: ' + ping + 'ms | Users: ' + packet.users + ' | Rooms: ' + packet.rooms;
});

//Audio Variables

var snd_beep = () => {
    let audiofx = new Audio("sound/beep.wav");
    audiofx.volume = volume;
    audiofx.play();
};
var snd_entered = () => {
    let audiofx = new Audio("sound/entered.wav");
    audiofx.volume = volume;
    audiofx.play();
};
var snd_gameover = () => {
    let audiofx = new Audio("sound/gameover.wav");
    audiofx.volume = volume;
    audiofx.play();
};
var snd_go = () => {
    let audiofx = new Audio("sound/go.wav");
    audiofx.volume = volume;
    audiofx.play();
};
var snd_mark = () => {
    let audiofx = new Audio("sound/mark.wav");
    audiofx.volume = volume;
    audiofx.play();
};
var snd_message = () => {
    let audiofx = new Audio("sound/message.wav");
    audiofx.volume = volume;
    audiofx.play();
};
var snd_notification = () => {
    let audiofx = new Audio("sound/notification.wav");
    audiofx.volume = volume;
    audiofx.play();
};
var snd_click = () => {
    let audiofx = new Audio("sound/click.wav");
    audiofx.volume = volume;
    audiofx.play();
};
