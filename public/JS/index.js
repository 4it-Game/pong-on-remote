let socket = io();

//sign
let signDiv = document.getElementById('signDiv'),
    signDivUsername = document.getElementById('signDiv-username'),
    signDivPassword = document.getElementById('signDiv-password'),
    signIn = document.getElementById('signDiv-signIn'),
    signUp = document.getElementById('signDiv-signUp');
//image
let Img = {};
Img.player = new Image();
Img.player.src = '/assert/img/player.png';
Img.bullet = new Image();
Img.bullet.src = '/assert/img/bullet.png';
Img.map = new Image();
Img.map.src = '/assert/img/map.png';

let chatText = document.getElementById('chat-text'),
    chatInput = document.getElementById('chat-input'),
    chatForm = document.getElementById('chat-form');
// game
let ctx = document.getElementById("ctx").getContext("2d");
ctx.font = "bold 18px Calibri";

signIn.onclick = function() {
    socket.emit('signIn', {
        username: signDivUsername.value,
        password: signDivPassword.value
    });
};
signUp.onclick = function() {
    socket.emit('signUp', {
        username: signDivUsername.value,
        password: signDivPassword.value
    });
};
socket.on('signInResponce', function(data) {
    if (data.success) {
        signDiv.style.display = 'none';
        gameDiv.style.display = 'inline-block';
    } else {
        alert('Sign in Unsuccessful.');
    }
});
socket.on('signUpResponce', function(data) {
    if (data.success) {
        alert('Sign Up Successful.');
    } else {
        alert('Sign Up Unsuccessful.');
    }
});


/**
 * {Player}
 */

let Player = function(initPack) {
    let self = {};
    self.id = initPack.id;
    self.x = initPack.x;
    self.y = initPack.y;
    self.width = 20;
    self.height = 20;
    self.angale = 0;
    self.hp = initPack.hp;
    self.hpMax = initPack.hpMax;
    self.score = initPack.score;

    self.draw = function() {
        let hpWidth = 40 * self.hp / self.hpMax;
        ctx.beginPath();
        ctx.fillStyle = 'green';
        ctx.fillRect(self.x - hpWidth / 2, self.y - 30, hpWidth, 4);
        ctx.closePath();
        self.rotate();
    }

    self.rotate = function() {
        ctx.beginPath();
        let width = Img.bullet.width * 4;
        let height = Img.bullet.height * 4;
        ctx.save();
        ctx.translate(self.x, self.y);
        ctx.rotate(self.angale * Math.PI / 180);
        ctx.translate(-self.x, -self.y);
        ctx.drawImage(Img.player,
            0, 0, Img.player.width, Img.player.height,
            self.x - width / 2, self.y - height / 2, width, height)
        ctx.closePath();
        ctx.restore();

    }

    Player.list[self.id] = self;
    return self;
}

Player.list = {}

/**
 * {Player}
 */

let Bullet = function(initPack) {
    let self = {};
    self.id = initPack.id;
    self.x = initPack.x;
    self.y = initPack.y;

    self.draw = function() {
        let width = Img.bullet.width * 2 / 3;
        let height = Img.bullet.height * 2 / 3;

        ctx.drawImage(Img.bullet,
            0, 0, Img.bullet.width, Img.bullet.height,
            self.x, self.y, width, height);

        // ctx.fillRect(self.x + 5, self.y + 5, 8, 8);
    }

    Bullet.list[self.id] = self;
    return self;
}

Bullet.list = {}

let selfId = null;

//init [When new object created, contains all the data]
socket.on('init', function(data) {
    if (data.selfId) {
        selfId = data.selfId;
    }
    for (let i = 0; i < data.player.length; i++) {
        new Player(data.player[i]);
    }
    for (let i = 0; i < data.bullet.length; i++) {
        new Bullet(data.bullet[i]);
    }
});

//update [defference]
socket.on('update', function(data) {
    for (var i = 0; i < data.player.length; i++) {
        let pack = data.player[i];
        let p = Player.list[pack.id];
        if (p) {
            if (pack.x !== undefined)
                p.x = pack.x;
            if (pack.y !== undefined)
                p.y = pack.y;
            if (pack.hp !== undefined)
                p.hp = pack.hp;
            if (pack.score !== undefined)
                p.score = pack.score;
            if (pack.ang !== undefined)
                p.angale = pack.ang;
        }
    }
    for (var i = 0; i < data.bullet.length; i++) {
        let pack = data.bullet[i];
        let p = Bullet.list[pack.id];
        if (p) {
            if (pack.x !== undefined)
                p.x = pack.x;
            if (pack.y !== undefined)
                p.y = pack.y;
        }
    }
});

// remove [using id]
socket.on('remove', function(data) {
    for (let i = 0; i < data.player.length; i++) {
        delete Player.list[data.player[i]];
    }
    for (let i = 0; i < data.bullet.length; i++) {
        delete Bullet.list[data.bullet[i]];
    }
});

setInterval(function() {
    ctx.clearRect(0, 0, 700, 600);
    drawMap();
    drawScore();
    for (let i in Player.list)
        Player.list[i].draw();

    for (var i in Bullet.list)
        Bullet.list[i].draw();
}, 40);

let drawMap = function() {
    ctx.drawImage(Img.map, 0, 0);
}

let drawScore = function() {
    ctx.fillText(Player.list[selfId] ? Player.list[selfId].score : 0, 10, 30);
};

//res of input
socket.on('addToChat', function(data) {
    chatText.innerHTML += '<div>' + data + '</div>';
    chatText.scrollTop = chatText.scrollHeight;
});
socket.on('evalAnswer', function(data) {
    console.log(data);
});

chatForm.onsubmit = function(e) {
    e.preventDefault();
    if (!chatInput.value.trim() == "")
        if (chatInput.value[0] === '/')
            socket.emit('evalServer', chatInput.value.slice(1));
        else
            socket.emit('sendMessageToServer', chatInput.value);
    chatInput.value = '';
};

document.onkeydown = function(event) {
    if (event.keyCode === 68)
        socket.emit('keyPress', {
            inputId: 'right',
            state: true
        });
    if (event.keyCode === 83)
        socket.emit('keyPress', {
            inputId: 'down',
            state: true
        });
    if (event.keyCode === 65)
        socket.emit('keyPress', {
            inputId: 'left',
            state: true
        });
    if (event.keyCode === 87)
        socket.emit('keyPress', {
            inputId: 'up',
            state: true
        })
}

document.onkeyup = function(event) {
    if (event.keyCode === 68)
        socket.emit('keyPress', {
            inputId: 'right',
            state: false
        });
    if (event.keyCode === 83)
        socket.emit('keyPress', {
            inputId: 'down',
            state: false
        });
    if (event.keyCode === 65)
        socket.emit('keyPress', {
            inputId: 'left',
            state: false
        });
    if (event.keyCode === 87)
        socket.emit('keyPress', {
            inputId: 'up',
            state: false
        })
}

document.onmousedown = function(event) {
    socket.emit('keyPress', {
        inputId: 'attack',
        state: true
    })
}
document.onmouseup = function(event) {
    socket.emit('keyPress', {
        inputId: 'attack',
        state: false
    })
}
document.onmousemove = function(event) {
    let x = -250 + event.clientX - 8;
    let y = -250 + event.clientY - 8;
    let angale = Math.atan2(y, x) / Math.PI * 180;
    socket.emit('keyPress', {
        inputId: 'mouseAngle',
        state: angale
    });
}