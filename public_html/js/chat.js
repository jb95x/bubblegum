var chatInput = document.getElementById('chatinput');
var chatBox = document.getElementById('chatbox');
var username = document.getElementById('username');

function onEnterMessage(e) {
    if (e.keyCode == 13 || e.which == 13) sendMessage();
}

function sendMessage() {
    socket.emit('message', chatInput.value);
    chatInput.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
}

function onMessage(data) {
    snd_message();
    chatBox.innerHTML += '</br> <font style="color: hsl(' + data.color + ', 100%, 50%)"> <b>[' + data.date.hours + ':' + data.date.minutes + ':' + data.date.seconds + '] ' + data.username + '</b></font> ' + data.message;
    chatBox.scrollTop = chatBox.scrollHeight;
}