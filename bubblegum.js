const connection = module.parent.exports.io;
const superJob = module.parent.exports.superJob;
const globalSettings = module.parent.exports.globalSettings;

const md5 = require('md5');

const appName = 'BubbleGum';
const io = connection.of('/bubblegum');

var rooms = {};
var users = {};

function buildTable(side) {
    let table = [];
    for (let i = 0; i < side; i++) {
        let tmpLine = [];
        for (let j = 0; j < side; j++) {
            tmpLine.push('x');
        }
        table.push(tmpLine);
    }
    return table;
}

function tableIsFull(table) {
    let zeros = 0;
    let side = table.length;
    for (let i = 0; i < side; i++) {
        for (let j = 0; j < side; j++) {
            zeros += table[i][j] == 'x' ? 1 : 0;
        }
    }
    return zeros == 0 ? true : false;

}

function clearScores(players) {
    Object.keys(players).forEach((playerID) => {
        users[playerID].score = 0;
    });
}

function getHighScore(players) {
    let highscore = { score: -1 };
    Object.keys(players).forEach((playerID) => {
        if (users[playerID].score > highscore.score) {
            highscore.username = users[playerID].username;
            highscore.score = users[playerID].score;
        }
    });
    return highscore;
}

function getScoreBoard(players) {
    let packet = [];
    Object.keys(players).forEach((playerID) => {
        let player = users[playerID];
        let entry = {};
        entry.username = player.username;
        entry.score = player.score;
        packet.push(entry);
    });
    return packet;
}

function disconnectHandler(socket) {
    let user = users[socket.id];
    if (user.room) {
        socket.leave(user.room.id);
        delete user.room.players[socket.id];
        io.to(user.room.id).emit('notification', { text: user.username + ' left the room' });
        io.to(user.room.id).emit('scoreBoard', getScoreBoard(user.room.players));
        updatePublicRoomInfo(user.room);
        if (Object.keys(user.room.players).length == 0) delete rooms[user.room.name];
    }
}

function updatePublicRoomInfo (room) {
    if(room.password == md5('')){
        let packet = {};
        packet.name = room.name;
        packet.users = Object.keys(room.players).length;
        io.emit('updatePublicRoomInfo', packet);
    }
}

function coldbootPublicRoomInfo (socket) {
    let publicRooms = {};
    Object.keys(rooms).forEach((roomID) => {
        if(rooms[roomID].password == md5('')){
            let packet = {};
            packet.name = rooms[roomID].name;
            packet.users = Object.keys(rooms[roomID].players).length;
            publicRooms[roomID] = packet;
        }
    });
    socket.emit('publicRoomsInfo', publicRooms);
}

function onConnection(socket) {

    users[socket.id] = {};
    coldbootPublicRoomInfo(socket);

    socket.on('joinRoom', (packet) => {
        //Gather info about user and room
        let user = users[socket.id];
        let room = rooms[packet.room];
        if (user.username) {
            //Username is set
            if (room) {
                // Room Exists
                if (room.password == md5(packet.password)) {
                    //Password is right
                    if (user.room && user.room.name != room.name) disconnectHandler(socket);
                    user.room = room;
                    user.score = 0;
                    socket.join(room.id);
                    room.players[socket.id] = user;
                    socket.emit('setTable', { name: room.name, table: room.table, button: 'START' });
                    socket.emit('notification', { text: 'Room joined!' });
                    io.to(user.room.id).emit('scoreBoard', getScoreBoard(user.room.players));
                    socket.to(user.room.id).emit('notification', { text: user.username + ' joined the room' });
                    if (user.room.running) socket.emit('goGoGo', 'Go!');
                    updatePublicRoomInfo(user.room);
                } else {
                    //Pasword is not rigth
                    socket.emit('notification', { text: 'Wrong Password!' });
                }
            } else {
                //New Room
                disconnectHandler(socket);
                let id = md5(packet.room + '_' + packet.password);
                rooms[packet.room] = {};
                rooms[packet.room].password = md5(packet.password);
                rooms[packet.room].name = packet.room;
                rooms[packet.room].id = id;
                rooms[packet.room].players = {};
                rooms[packet.room].players[socket.id] = user;
                user.room = rooms[packet.room];
                user.score = 0;
                user.room.table = buildTable(1);
                socket.join(id);
                socket.emit('setTable', { name: packet.room, table: user.room.table, button: 'START' });
                socket.emit('notification', { text: 'Room Created! Room Joined!' });
                io.to(user.room.id).emit('scoreBoard', getScoreBoard(user.room.players));
                updatePublicRoomInfo(user.room);
            }
        } else {
            //Username is not set
            socket.emit('notification', { text: 'Set a Username first!' });
        }
        globalJob(socket);
    });

    socket.on('updateUser', (packet) => {
        let user = users[socket.id];
        user.username = packet.username;
        user.color = packet.color;
        socket.emit('notification', { text: 'User Updated!' });
        globalJob(socket);
    });

    socket.on('mark', (data) => {
        let user = users[socket.id];
        if (user.room && user.room.running) {
            let x = data.x;
            let y = data.y;
            let color = user.color;
            let roomname = user.room.name;
            let table = user.room.table;
            let side = user.room.table.length;
            if (((x < side && x >= 0) && (y < side && y >= 0)) && table[x][y] == 'x') {
                user.score++;
                table[x][y] = color;
                data.color = color;
                io.to(user.room.id).emit('mark', data);
                io.to(user.room.id).emit('scoreBoard', getScoreBoard(user.room.players));
                if (tableIsFull(table)) {
                    io.to(user.room.id).emit('gameOver', getHighScore(user.room.players));
                    let static_room = rooms[user.room.name];
                    setTimeout(() => {
                        if (rooms[static_room.name]) {
                            static_room.running = false;
                            static_room.started = false;
                            io.to(static_room.id).emit('changeStartButton', 'START');
                        }
                    }, 5000);
                }
            }
        }
        globalJob(socket);
    });

    socket.on('startGame', (tableSize) => {
        let user = users[socket.id];
        if (user.room && !user.room.started) {
            user.room.started = true;
            let seconds = 3;
            clearScores(user.room.players);
            io.to(user.room.id).emit('scoreBoard', getScoreBoard(user.room.players));
            if (tableSize < 1) tableSize = 1;
            if (tableSize > 16) tableSize = 16;
            user.room.table = buildTable(tableSize);
            io.to(user.room.id).emit('setTable', { name: user.room.name, table: user.room.table, button: 'START' });
            let static_room = rooms[user.room.name];
            let countDownInterval = setInterval(() => {
                if (rooms[static_room.name]) {
                    if (seconds > 0) {
                        io.to(static_room.id).emit('changeStartButton', seconds);
                        seconds--;
                    } else {
                        clearInterval(countDownInterval);
                        io.to(static_room.id).emit('goGoGo', 'Go!');
                        static_room.running = true;
                    }
                } else {
                    clearInterval(countDownInterval);
                }
            }, 1000);
        }
        globalJob(socket);
    });

    socket.on('message', (msg) => {
        let user = users[socket.id];
        if (user.room && globalSettings.chatEnabled) {
            let dateObj = new Date();
            let packet = {};
            packet.date = {};
            packet.date.hours = dateObj.getHours();
            packet.date.minutes = dateObj.getMinutes();
            packet.date.seconds = dateObj.getSeconds();
            packet.username = user.username;
            packet.color = user.color;
            packet.message = msg;
            io.to(user.room.id).emit('message', packet);
        }
        globalJob(socket);
    });

    socket.on('pingyou', (date) => {
        packet = {};
        packet.ping = Date.now() - date;
        packet.rooms = Object.keys(rooms).length;
        packet.users = Object.keys(users).length;
        socket.emit('pongme', packet);
    });

    socket.on('disconnect', (reason) => {
        disconnectHandler(socket);
        delete users[socket.id];
        globalJob(socket);
    });
}

function globalJob(socket) {
    superJob(users, appName);
    if (globalSettings.debug) {
        console.log(appName + '\n');
        console.log('USERS:\n');
        console.log(users);
        console.log('ROOMS:\n');
        console.log(rooms);
    }
}

io.on('connection', onConnection);