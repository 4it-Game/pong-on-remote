const express = require('express'),
    uuid = require('uuid/v1'),
    http = require('http'),
    app = express(),
    server = http.createServer(app),
    port = 4444;

let SOCKET_LIST = {};
let PLAYER_LIST = {};

let Player = (id) => {
    let self = {
        x: 20,
        y: 100,
        id: id,
        pressingRight: false,
        pressingLeft: false,
        pressingUp: false,
        pressingDown: false,
        speed: 10,
    }

    self.updatePosition = () => {
        if (self.pressingRight)
            self.x += self.speed;
        if (self.pressingLeft)
            self.x -= self.speed;
        if (self.pressingUp)
            self.y -= self.speed;
        if (self.pressingDown)
            self.y += self.speed;
    }

    return self;
}

// Instantiate Socket.IO hand have it listen on the Express/HTTP server
var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket) {
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;

    let player = Player(socket.id);
    PLAYER_LIST[socket.id] = player;

    socket.on('disconnect', () => {
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[socket.id];
    });

    socket.on('keyPrerss', (event) => {
        if (event.inputId === 'left')
            player.pressingLeft = event.state;
        if (event.inputId === 'right')
            player.pressingRight = event.state;
        if (event.inputId === 'up')
            player.pressingUp = event.state;
        if (event.inputId === 'down')
            player.pressingDown = event.state;
    });

});


//game loop

setInterval(() => {
    var pack = [];
    for (var i in PLAYER_LIST) {
        let player = PLAYER_LIST[i];
        player.updatePosition();
        pack.push({
            x: player.x,
            y: player.y
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