'use strict';

/**
 * Constants 
 */
let WIDTH = 700,
    HEIGHT = 600,
    pi = Math.PI;
let canvas,
    ctx,
    keystate;
let UpArrow = 38,
    DownArrow = 40;

/**
 * {Objects} 
 */
let player = {
        x: null,
        y: null,
        width: 20,
        height: 100,
        update: function() {
            if (keystate[UpArrow]) this.y -= 7;
            if (keystate[DownArrow]) this.y += 7;
        },
        draw: function() {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    },
    ai = {
        x: null,
        y: null,
        width: 20,
        height: 100,
        update: function() {
            // calculate ideal position
            var des = ball.y - (this.height - ball.side) * 0.5;
            // ease the movement towards the ideal position
            this.y += (des - this.y) * 0.1;
            // keep the paddle inside of the canvas
            this.y = Math.max(Math.min(this.y, HEIGHT - this.height), 0);
        },
        draw: function() {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    },
    ball = {
        x: null,
        y: null,
        vel: null,
        side: 20,
        speed: 5,

        //check where the ball hitting
        serve: function() {
            var r = Math.random();
            this.x = side === 1 ? player.x : ai.x - this.side;
            this.y = (HEIGHT - this.side) * r;

            var phi = 0.1 * pi * (1 - 2 * r);
            this.vel = {
                x: side * this.speed * Math.cos(phi),
                y: this.speed * Math.sin(phi)
            }
        },

        update: function() {
            this.x += this.vel.x;
            this.y += this.vel.y;

            if (0 > this.y || this.y + this.side > HEIGHT) {
                let offset = this.vel.y < 0 ? 0 - this.y : HEIGHT - (this.y + this.side);
                this.y += 2 * offset;
                this.vel.y *= -1;
            }
            //check intesect between tho
            // axis aligned bounding boxex (AABB)
            let AABBIntersect = function(ax, ay, aw, ah, bx, by, side) {
                return ax < bx + side && ay < by + side && bx < ax + aw && by < ay + ah;
            };

            var paddle = this.vel.x < 0 ? player : ai;
            if (AABBIntersect(paddle.x, paddle.y, paddle.width, paddle.height, this.x, this.y, this.side)) {
                this.x = paddle === player ? player.x + player.width : ai.x - this.side
                var n = (this.y + this.side - paddle.y) / (paddle.height + this.side);
                var phi = 0.25 * pi * (2 * n - 1); //pi/4 = 45

                var smash = Math.abs(phi) > 0.2 * pi ? 1.5 : 1;
                this.vel.x = smash * (paddle === player ? 1 : -1) * this.speed * Math.cos(phi);
                this.vel.y = smash * this.speed * Math.sin(phi);
            }

            //reset
            if (0 > this.x + this.side || this.x > WIDTH + 20) {
                setTimeout(function() {
                    this.serve(paddle == player ? 1 : -1);
                }, 1000);

            }
        },
        // Draw the ball to the canvas
        draw: function() {
            ctx.fillRect(this.x, this.y, this.side, this.side);
        }
    };

// Starts the game
function main() {
    // create, initiate and append game canvas
    canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    ctx = canvas.getContext("2d");
    document.body.appendChild(canvas);

    keystate = {};

    document.addEventListener("keydown", function(evt) {
        keystate[evt.keyCode] = true;
    });
    document.addEventListener("keyup", function(evt) {
        delete keystate[evt.keyCode];
    });

    // initiate game objects
    init();

    // game loop
    let loop = function() {
        update();
        draw();

        window.requestAnimationFrame(loop, canvas);
    };
    window.requestAnimationFrame(loop, canvas);
}

// Initatite game objects and set start positions
function init() {
    player.x = player.width;
    player.y = (HEIGHT - player.height) / 2;

    ai.x = WIDTH - (player.width + ai.width);
    ai.y = (HEIGHT - ai.height) / 2;

    ball.x = (WIDTH - ball.side) / 2;
    ball.y = (HEIGHT - ball.side) / 2;

    ball.vel = {
        x: ball.speed,
        y: 0
    }
}

// game updates
function update() {
    ball.update();
    player.update();
    ai.update();
}

// Draw game objects
function draw() {
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.save();
    ctx.fillStyle = "#fff";

    ball.draw();
    player.draw();
    ai.draw();



    let w = 4,
        x = (WIDTH - w) * 0.5,
        y = 0,
        step = HEIGHT / 15;
    while (y < HEIGHT) {
        ctx.fillRect(x, y + step * 0.25, w, step * 0.5);
        y += step;
    }

    ctx.restore();
}

// start and run the game
main();