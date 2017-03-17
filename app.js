const express = require('express'),
    uuid = require('uuid/v1'),
    http = require('http'),
    app = express(),
    server = http.createServer(app),
    port = 4444;

const mongoose = require('mongoose');
mongoose.connect('localhost:27017/myGame');
let account = require('./models/users');

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
    self.getDistance = (pt) => {
        return Math.sqrt(Math.pow(self.x - pt.x, 2) + Math.pow(self.y - pt.y, 2));
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
    self.pressingAttack = false;
    self.mouseAngale = 0;
    self.speed = 10;

    let super_update = self.update;
    self.update = () => {
        self.updateSpd();
        super_update();

        if (self.pressingAttack) {
            self.shootBullet(self.mouseAngale);
        }
    }
    self.shootBullet = (angale) => {
        let b = Bullet(self.id, angale);
        b.x = self.x;
        b.y = self.y;
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
    self.getInitPack = () => {
        return {
            id: self.id,
            x: self.x,
            y: self.y
        }
    }

    Player.list[id] = self;

    initPack.player.push(self.getInitPack());
    return self;
}

Player.list = {};

// creating player depending on socket id

Player.onConnect = (socket) => {
    let player = Player(socket.id);

    socket.on('keyPress', (event) => {
        if (event.inputId === 'left')
            player.pressingLeft = event.state;
        if (event.inputId === 'right')
            player.pressingRight = event.state;
        if (event.inputId === 'up')
            player.pressingUp = event.state;
        if (event.inputId === 'down')
            player.pressingDown = event.state;
        if (event.inputId === 'attack')
            player.pressingAttack = event.state;
        if (event.inputId === 'mouseAngle')
            player.mouseAngale = event.state;
    });
}

// When the player disconnect remove hi from the list

Player.onDisconnect = (socket) => {
    delete Player.list[socket.id];
    removePack.player.push(socket.id);
}

Player.update = () => {
    var pack = [];
    for (var i in Player.list) {
        let player = Player.list[i];
        player.update();
        pack.push({
            id: player.id,
            x: player.x,
            y: player.y
        });
    }
    return pack;
}

//Bulert

let Bullet = (parent, angle) => {
    let self = Entity();
    self.id = Math.random();
    self.spdX = Math.cos(angle / 180 * Math.PI) * 10;
    self.spdY = Math.sin(angle / 180 * Math.PI) * 10;
    self.parent = parent;
    self.timer = 0;
    self.toRomove = false;
    let super_update = self.update;
    self.update = () => {
        if (self.timer++ > 50)
            self.toRomove = true;
        super_update();

        for (var i in Player.list) {
            let p = Player.list[i];
            if (self.getDistance(p) < 32 && self.parent !== p.id) {
                self.toRomove = true;
            }

        }
    }
    Bullet.list[self.id] = self
    initPack.bullet.push({
        id: self.id,
        x: self.x,
        y: self.y
    });
    return self;
}

Bullet.list = {};

Bullet.update = () => {
    var pack = [];
    for (var i in Bullet.list) {
        let bullet = Bullet.list[i];
        bullet.update();
        if (bullet.toRomove) {
            delete Bullet.list[i];
            removePack.bullet.push(bullet.id);
        } else {
            pack.push({
                id: bullet.id,
                x: bullet.x,
                y: bullet.y
            });
        }
    }
    return pack;
}



let DEBUG = true;

let USERS = {
    "qqq": "asd",
    "www": "asd"
}

let isValidPassword = (data, callback) => {
    account.findOne({
        username: data.username,
        password: data.password
    }, (err, user) => {
        if (err)
            callback(false);
        if (user)
            callback(true);
        else
            callback(false);
    });
}

let isExist = (data, callback) => {
    account.findOne({
        username: data.username
    }, (err, user) => {
        if (err)
            callback(false);
        if (user)
            callback(true);
        else
            callback(false);
    });

}

let addUser = (data, callback) => {
    account.create({
        username: data.username,
        password: data.password
    }, (_err, user) => {
        if (_err)
            return reject(_err);
        callback();
    });
}

// Instantiate Socket.IO hand have it listen on the Express/HTTP server
var io = require('socket.io').listen(server);

//start client connect here

io.sockets.on('connection', function(socket) {
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;

    socket.on('signIn', (data) => {
        isValidPassword(data, (res) => {
            if (res) {
                // Player connect
                Player.onConnect(socket);
                socket.emit('signInResponce', { success: true });
            } else {
                socket.emit('signInResponce', { success: false });
            }
        });

    });
    socket.on('signUp', (data) => {
        isExist(data, (res) => {
            if (res) {
                socket.emit('signUpResponce', { success: false });
            } else {
                addUser(data, () => {
                    socket.emit('signUpResponce', { success: true });
                });
            }
        });
    });

    socket.on('disconnect', () => {
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);

    });

    //chat server
    socket.on('sendMessageToServer', (msg) => {
        let playerName = ("" + socket.id).slice(2, 7);
        for (let i in SOCKET_LIST)
            SOCKET_LIST[i].emit('addToChat', playerName + ': ' + msg);
    });
    socket.on('evalServer', (data) => {
        let res = eval(data);
        socket.emit('evalAnswer', res);
    });

});

let initPack = { player: [], bullet: [] };
let removePack = { player: [], bullet: [] };

//game loop

setInterval(() => {
    let pack = {
        player: Player.update(),
        bullet: Bullet.update()
    }
    for (let i in SOCKET_LIST) {
        let socket = SOCKET_LIST[i];
        socket.emit('init', initPack);
        socket.emit('update', pack);
        socket.emit('remove', removePack);
    }
    initPack.player = [];
    initPack.bullet = [];
    removePack.player = [];
    removePack.bullet = [];
}, 1000 / 25);




app.use(express.static(__dirname + '/public'));


server.listen(port, () => {
    console.log("Listen to port " + port);
});