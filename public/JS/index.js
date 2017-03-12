'use strict';

/**
 * Constants 
 */
let WIDTH = 700,
    HEIGHT = 600,
    pi = Math.PI,
    canvas,
    // Game elements
    ctx,
    keystate;

/**
 * {Objects} 
 */
let player = {
        x: null,
        y: null,
        width: 20,
        height: 100,
        update: function() {},
        draw: function() {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    },
    ai = {
        x: null,
        y: null,
        width: 20,
        height: 100,
        update: function() {},
        draw: function() {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    },
    ball = {
        x: null,
        y: null,
        side: 20,
        update: function() {},
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