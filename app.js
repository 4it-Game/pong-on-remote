const express = require('express'),
    uuid = require('uuid/v1'),
    http = require('http'),
    app = express(),
    server = http.createServer(app),
    port = 4444;

let SOCKET_LIST = {};

// Instantiate Socket.IO hand have it listen on the Express/HTTP server
var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket) {
    socket.id = Math.random();
    socket.x = 0;
    socket.y = 0;
    SOCKET_LIST[socket.id] = socket;

    socket.on('disconnect', () => {
        delete SOCKET_LIST[socket.io];
    });

});

//game loop

setInterval(() => {
    var pack = [];
    for (var i in SOCKET_LIST) {
        let socket = SOCKET_LIST[i];
        socket.y++;
        pack.push({
            y: socket.y
        });
    }

    for (let i in SOCKET_LIST) {
        let socket = SOCKET_LIST[i];
        socket.emit('newPosition', pack);
    }
}, 1000 / 25);

app.use(express.static(__dirname + '/public'));


server.listen(port, () => {
    console.log("Listen to port " + port);
});