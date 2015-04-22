var canvas = document.getElementById("gameCanvas");
var context = canvas.getContext("2d")

window.addEventListener('keydown', function(evt) { onKeyDown(evt); }, false);
window.addEventListener('keyup', function(evt) { onKeyUp(evt); }, false);

//VARIABLES BELOW HERE//

var startFrameMillis = Date.now();
var endFrameMillis = Date.now();
function getDeltaTime()
{
    endFrameMillis = startFrameMillis;
    startFrameMillis = Date.now();
    var deltaTime = (startFrameMillis - endFrameMillis) * 0.001;
    if (deltaTime > 1)
    {
        deltaTime = 1;
    }
    return deltaTime;
}

var STATE_SPLASH = 0;
var STATE_GAME = 1;
var STATE_GAMEOVER = 2;

var gameState = STATE_SPLASH;

var grass = document.createElement("img");
grass.src = "grass.png";

var background = [];

for(var y=0; y<15; y++)
{
    background[y] = [];
    for(var x=0; x<20; x++)
        background[y][x] = grass;
}

var SCREEN_WIDTH = canvas.width;
var SCREEN_HEIGHT = canvas.height;

var ASTEROID_SPEED = 0.8;
var PLAYER_SPEED = 1;
var PLAYER_TURN_SPEED = 0.04;
var BULLET_SPEED = 1.5;

var player = {
    image: document.createElement("img"),
    x: SCREEN_WIDTH/2,
    y: SCREEN_HEIGHT/2,
    width: 93,
    height: 80,
    directionX: 0,
    directionY: 0,
    angularDirection: 0,
    rotation: 0
};

player.image.src = "ship1.png";

var spawnTimer = 0;

var KEY_SPACE = 32;
var KEY_LEFT = 37;
var KEY_UP = 38;
var KEY_RIGHT = 39;
var KEY_DOWN = 40;

var shootTimer = 0;

var picture = document.createElement("img");
picture.src = "picture.png";

var splashBack = [];

for(var y=0; y<15; y++)
{
    splashBack[y] = [];
    for(var x=0; x<20; x++)
        splashBack[y][x] = picture;
}

//FUNCTIONS BELOW HERE//

var splashTimer = 3;
function runSplash(deltaTime)
{
    for(var y=0; y<15; y++)
    {
        for(var x=0; x<20; x++)
        {
            context.drawImage(splashBack[y][x], x*32, y*32);
        }
    }

    splashTimer -= deltaTime;
    if(splashTimer <= 0)
    {
        gameState = STATE_GAME;
        return;
    }

    context.fillStyle = "#3399FF";
    context.font = "32px Chalkduster";
    context.fillText("Planet Rock", 200, 240);

}

function runGame(deltaTime)
{
    for(var y=0; y<15; y++)
    {
        for(var x=0; x<20; x++)
        {
            context.drawImage(background[y][x], x*32, y*32);
        }
    }
    
    if(shootTimer >0)
        shootTimer -= deltaTime;
    
    for(var i=0; i<bullets.length; i++)
    {
        bullets[i].x += bullets[i].velocityX;
        bullets[i].y += bullets[i].velocityY;
    }
    
    for (var i=0; i<bullets.length; i++)
    {
        if(bullets[i].x < -bullets[i].width ||
           bullets[i].x > SCREEN_WIDTH ||
           bullets[i].y < -bullets[i].height ||
           bullets[i].y > SCREEN_HEIGHT)
        {
            bullets.splice(i, 1);
            break;
        }
    }
    
    for(var i=0; i<bullets.length; i++)
    {
        context.drawImage(bullets[i].image,
                          bullets[i].x - bullets[i].width/2,
                          bullets[i].y - bullets[i].height/2);
    }
    
    var s = Math.sin(player.rotation);
    var c = Math.cos(player.rotation);
    
    var xDir = (player.directionX * c) - (player.directionY * s);
    var yDir = (player.directionX * s) + (player.directionY * c);
    var xVel = xDir * PLAYER_SPEED;
    var yVel = yDir * PLAYER_SPEED;
    
    player.x += xVel;
    player.y += yVel;
    
    player.rotation += player.angularDirection * PLAYER_TURN_SPEED;
    
    context.save();
        context.translate(player.x, player.y);
        context.rotate(player.rotation);
        context.drawImage(
            player.image, -player.width/2, -player.height/2);
    context.restore();
    
    //PLAYER WRAPPING//
    if ( player.x > SCREEN_WIDTH)
    {
        context.save();
        context.translate( player.x = 0, player.y)
        context.restore();
    }
    if ( player.x < 0)
    {
        context.save();
        context.translate( player.x = SCREEN_WIDTH, player.y)
        context.restore();
    }
    if ( player.y > SCREEN_HEIGHT)
    {
        context.save();
        context.translate( player.x, player.y = 0)
        context.restore();
    }
    if ( player.y < 0)
    {
        context.save();
        context.translate( player.x, player.y = SCREEN_HEIGHT)
        context.restore();
    }

    for(var i=0; i<asteroids.length; i++)
    {
        asteroids[i].x = asteroids[i].x + asteroids[i].velocityX;
        asteroids[i].y = asteroids[i].y + asteroids[i].velocityY;
        
        //ASTEROIDS WRAPPPING//
        if ( asteroids[i].x > SCREEN_WIDTH)
        {
            context.save();
            context.translate( asteroids[i].x = 0, asteroids[i].y)
            context.restore();
        }
        if ( asteroids[i].x < 0)
        {
            context.save();
            context.translate( asteroids[i].x = SCREEN_WIDTH, asteroids[i].y)
            context.restore();
        }
        if ( asteroids[i].y > SCREEN_HEIGHT)
        {
            context.save();
            context.translate( asteroids[i].x, asteroids[i].y = 0)
            context.restore();
        }
        if ( asteroids[i].y < 0)
        {
            context.save();
            context.translate( asteroids[i].x, asteroids[i].y = SCREEN_HEIGHT)
            context.restore();
        }
    }
    
    for(var i=0; i<asteroids.length; i++)
    {
        context.drawImage(asteroids[i].image, asteroids[i].x, asteroids[i].y);
    }
    
    spawnTimer -= deltaTime;
    if(spawnTimer <= 0)
    {
        spawnTimer = 1;
        spawnAsteroid();
    }
    
    for(var i=0; i<asteroids.length; i++)
    {
        for(var j=0; j<bullets.length; j++)
        {
            if(intersects(
                bullets[j].x, bullets[j].y,
                bullets[j].width, bullets[j].height,
                asteroids[i].x, asteroids[i].y,
                asteroids[i].width, asteroids[i].height) == true)
            {
                asteroids.splice(i, 1);
                bullets.splice(j, 1);
                break;
            }
        }
    }

    for(var i=0; i<asteroids.length; i++)
    {
            if(intersects(
                player.x, player.y,
                player.width, player.height,
                asteroids[i].x, asteroids[i].y,
                asteroids[i].width, asteroids[i].height) == true)
            {
                gameState = STATE_GAMEOVER;
                break;
            }
    }
}

var over = document.createElement("img");
over.src = "over.png";

var sadness = [];

for(var y=0; y<15; y++)
{
    sadness[y] = [];
    for(var x=0; x<20; x++)
        sadness[y][x] = over;
}

function runGameOver(deltaTime)
{
    for(var y=0; y<15; y++)
    {
        for(var x=0; x<20; x++)
        {
            context.drawImage(sadness[y][x], x*32, y*32);
        }
    }

    context.fillStyle = "#3399FF";
    context.font = "32px Chalkduster";
    context.fillText("Game Over", 200, 240);
}

var asteroids = [];

    
function rand(floor, ceil)
{
    return Math.floor( (Math.random()* (ceil-floor)) +floor );
}

function spawnAsteroid()
{
    var type = rand(0, 3);
   
    var asteroid = {};
    
    asteroid.image = document.createElement("img");
    asteroid.image.src = "rock_large.png";
    asteroid.width = 69;
    asteroid.height = 75;
    
    var x = SCREEN_WIDTH/2;
    var y = SCREEN_HEIGHT/2;
    
    var dirX = rand(-10, 10);
    var dirY = rand(-10, 10);
    
    var magnitude = (dirX * dirX) + (dirY * dirY);
    if(magnitude != 0)
    {
        var oneOverMag = 1 / Math.sqrt(magnitude);
        dirX *= oneOverMag;
        dirY *= oneOverMag;
    }
    
    var movX = dirX * SCREEN_WIDTH;
    var movY = dirY * SCREEN_HEIGHT;
    
    asteroid.x = x + movX;
    asteroid.y = y + movY;
    
    asteroid.velocityX = -dirX * ASTEROID_SPEED;
    asteroid.velocityY = -dirY * ASTEROID_SPEED;
    
    asteroids.push(asteroid);
}

var bullets = [];

function playerShoot()
{
    var bullet = {
        image: document.createElement("img"),
        x: player.x,
        y: player.y,
        width: 5,
        height: 5,
        velocityX: 0,
        velocityY: 0
    };
    
    bullet.image.src = "bullet.png";
    
    var velX = 0;
    var velY = 1;
    
    var s = Math.sin(player.rotation);
    var c = Math.cos(player.rotation);
    
    var xVel = (velX * c) - (velY * s);
    var yVel = (velY * s) + (velY * c);
    
    bullet.velocityX = xVel * BULLET_SPEED;
    bullet.velocityY = yVel * BULLET_SPEED;
   
    bullets.push(bullet);
}

function onKeyDown(event)
{
    if(event.keyCode == KEY_UP)
    {
        player.directionY = 1;
    }
    if(event.keyCode == KEY_DOWN)
    {
        player.directionY = -1;
    }
    if(event.keyCode == KEY_LEFT)
    {
        player.angularDirection = -1;
    }
    if(event.keyCode == KEY_RIGHT)
    {
        player.angularDirection = 1;
    }
    if(event.keyCode == KEY_SPACE && shootTimer <= 0)
    {
        shootTimer += 0.3;
        playerShoot();
    }
}

function onKeyUp(event)
{
    if(event.keyCode == KEY_UP)
    {
        player.directionY = 0;
    }
    if(event.keyCode == KEY_DOWN)
    {
        player.directionY = 0;
    }
    if(event.keyCode == KEY_LEFT)
    {
        player.angularDirection = 0;
    }
    if(event.keyCode == KEY_RIGHT)
    {
        player.angularDirection = 0;
    }
}

function intersects(x1, y1, w1, h1, x2, y2, w2, h2)
{
    if(y2 + h2 < y1 ||
       x2 + w2 < x1 ||
       x2 > x1 + w1 ||
       y2 > y1 + h1)
    {
        return false;
    }
    return true;
}

//RUN FUNCTION HERE//

function run()
{
    context.fillStyle = "#6495ED";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    var deltaTime = getDeltaTime();

    switch(gameState)
    {
        case STATE_SPLASH:
            runSplash(deltaTime);
            break;
        case STATE_GAME:
            runGame(deltaTime);
            break;
        case STATE_GAMEOVER:
            runGameOver(deltaTime);
            break;
    }
}

            //THIS IS IMPORTANT STUFF YOU DONT UNDERSTAND//
                        //DONT TOUCH THIS STUFF//

(function() {
    var onEachFrame;
    if (window.requestAnimationFrame) {
        onEachFrame = function(cb) {
            var _cb = function() { cb(); window.requestAnimationFrame(_cb); }
            _cb();
        };
    } else if (window.mozRequestAnimationFrame) {
        onEachFrame = function(cb) {
            var _cb = function() { cb();
                                  window.mozRequestAnimationFrame(_cb); }
            _cb();
        };
    } else {
        onEachFrame = function(cb) {
            setInterval(cb, 1000 / 60);
        }
    }
    
    window.onEachFrame = onEachFrame;
})();

window.onEachFrame(run);