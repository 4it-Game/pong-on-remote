const express = require('express'),
    uuid = require('uuid/v1'),
    http = require('http'),
    app = express(),
    server = http.createServer(app),
    port = 4444;

require('./controller/Entity');
require('./public/js/Inventory');

//database connection
const mongoose = require('mongoose');
mongoose.connect('localhost:27017/myGame');
let account = require('./models/users');

let SOCKET_LIST = {};

let DEBUG = true;

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
                Player.onConnect(socket, data.username);
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
        for (let i in SOCKET_LIST)
            SOCKET_LIST[i].emit('addToChat', Player.list[socket.id].username + ': ' + msg);
    });

    socket.on('sendPmToServer', (msg) => { //msg:(username, massage)
        let recipientSocket = null;
        for (let i in Player.list)
            if (Player.list[i].username === msg.username)
                recipientSocket = SOCKET_LIST[Player.list[i].id];
        if (recipientSocket === null) {
            socket.emit('addToChat', 'The Player ' + msg.username + ' is not online.');
        } else {
            recipientSocket.emit('addToChat', 'From ' + msg.username + ':' + msg.message);
            socket.emit('addToChat', 'To ' + msg.username + ':' + msg.message);
        }

        // for (let i in SOCKET_LIST)
        //     SOCKET_LIST[i].emit('addToChat', Player.list[socket.id].username + ': ' + msg);
    });

    socket.on('evalServer', (data) => {
        let res = eval(data);
        socket.emit('evalAnswer', res);
    });

});


//game loop

setInterval(() => {
    let packs = Entity.getFrameUpdate();
    for (let i in SOCKET_LIST) {
        let socket = SOCKET_LIST[i];
        socket.emit('init', packs.initPack);
        socket.emit('update', packs.updatePack);
        socket.emit('remove', packs.removePack);
    }

}, 1000 / 25);




app.use(express.static(__dirname + '/public'));


server.listen(port || process.env.PORT, () => {
    console.log("Listen to port " + port || process.env.PORT);
});