
var publicRooms = {};

function onUpdatePublicRoomsInfo(packet) {
    if (packet.users < 1) {
        publicRooms[packet.name] = {};
        delete publicRooms[packet.name];
    } else {
        publicRooms[packet.name] = {};
        publicRooms[packet.name].name = packet.name;
        publicRooms[packet.name].users = packet.users;
    }
    renderPublicRooms();
    console.log(packet);
}

function onPublicRoomsInfo(packet) {
    Object.keys(packet).forEach((roomID) => {
        publicRooms[roomID] = {};
        publicRooms[roomID].name = packet[roomID].name;
        publicRooms[roomID].users = packet[roomID].users;
    });
    renderPublicRooms();
    console.log(packet);
}

function renderPublicRooms() {
    let roomsString = '';
    Object.keys(publicRooms).forEach((roomID) => {
        roomsString += '<tr><td>' + publicRooms[roomID].name + '</td><td>' +  publicRooms[roomID].users + '</td><td>' + '<a onClick="joinPublicRoom(' +  publicRooms[roomID].name + ')" class="waves-effect waves-light btn">Join</a></td></tr>';
    });

    document.getElementById('publicrooms').innerHTML = roomsString;
}

function joinPublicRoom(roomID) {
    let packet = {};
    packet.room = roomID;
    packet.password = '';
    socket.emit('joinRoom', packet);
}