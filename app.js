const express = require('express'),
    uuid = require('uuid/v1'),
    http = require('http'),
    app = express(),
    server = http.createServer(app),
    port = 4444;

let SOCKET_LIST = {};

let Entity = () => {
    let self = {
        x: 250,
        y: 250,
        spdX: 0,
        spdY: 0,
        id: "",
    }
    self.update = () => {
        self.updatePosition();
    }
    self.updatePosition = () => {
        self.x += self.spdX;
        self.y += self.spdY;
    }
    return self;
}

let Player = (id) => {
    let self = Entity()
    self.id = id;
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.speed = 10;

    let super_update = self.update;
    self.update = () => {
        self.updateSpd();
        super_update();
    }

    self.updateSpd = () => {
        if (self.pressingRight)
            self.spdX = self.speed;
        else if (self.pressingLeft)
            self.spdX = -self.speed;
        else
            self.spdX = 0;

        if (self.pressingUp)
            self.spdY = -self.speed;
        else if (self.pressingDown)
            self.spdY = self.speed;
        else self.spdY = 0;
    }
    Player.list[id] = self;
    return self;
}

Player.list = {};

// creating player depending on socket id

Player.onConnect = (socket) => {
    let player = Player(socket.id);

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
}

Player.update = () => {
    var pack = [];
    for (var i in Player.list) {
        let player = Player.list[i];
        player.update();
        pack.push({
            x: player.x,
            y: player.y
        });
    }
    return pack;
}

// When the player disconnect remove hi from the list

Player.onDisconnect = (socket) => {
    delete Player.list[socket.id];
}

// Instantiate Socket.IO hand have it listen on the Express/HTTP server
var io = require('socket.io').listen(server);

//start client connect here

io.sockets.on('connection', function(socket) {
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;

    // Player connect
    Player.onConnect(socket);

    socket.on('disconnect', () => {
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);

    });

});


//game loop

setInterval(() => {

    let pack = Player.update()

    for (let i in SOCKET_LIST) {
        let socket = SOCKET_LIST[i];
        socket.emit('newPosition', pack);
    }
}, 1000 / 25);

app.use(express.static(__dirname + '/public'));


server.listen(port, () => {
    console.log("Listen to port " + port);
});