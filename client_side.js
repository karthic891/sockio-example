var socket = io();
$('form').submit(function() {
    var username = $('#m').val();
    socket.emit('username', username);
    $('#m').val('');
    return false;
});
socket.on('chat message', function(msg) {
    $('#messages').append($('<li>').text(msg));
});
socket.on('bid', function(data) {
    data = JSON.parse(data);
    $('#messages').append($('<li>').text(data.msg));
});
