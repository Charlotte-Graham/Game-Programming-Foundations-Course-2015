var canvas = document.getElementById("gameCanvas");
var context = canvas.getContext("2d");

var startFrameMillis = Date.now();
var endFrameMillis = Date.now();

function getDeltaTime()
{
	endFrameMillis = startFrameMillis;
	startFrameMillis = Date.now();

	var deltaTime = (startFrameMillis - endFrameMillis) * 0.001;

	if(deltaTime > 1)
		deltaTime = 1;
		
	return deltaTime;
}

var fps = 0;
var fpsCount = 0;
var fpsTime = 0;

var score = 0;
var lives = 6;

var heartImage = document.createElement("img");
heartImage.src = "diamond.png";

var TILE = 35;

var METER = TILE;
var GRAVITY = METER * 9.8 * 6;
var MAXDX = METER * 10;
var MAXDY = METER * 15;
var ACCEL = MAXDX * 2;
var FRICTION = MAXDX * 6;
var JUMP = METER * 1500;

var ENEMY_MAXDX = METER * 5;
var ENEMY_ACCEL = ENEMY_MAXDX * 2;

//screen
var SCREEN_WIDTH = canvas.width;
var SCREEN_HEIGHT = canvas.height;

//states
var STATE_SPLASH = 0;
var STATE_GAME = 1;
var STATE_GAMEOVER = 2;
var STATE_GAMEWIN = 3;
var gameState = STATE_SPLASH;

//layers
var LAYER_COUNT = 5;
var LAYER_BACKGROUND_IMAGES = 0;
var LAYER_PLATFORMS = 2;
var LAYER_LADDERS = 1;
var LAYER_OBJECT_ENEMIES = 3;
var LAYER_OBJECT_TRIGGERS = 4;

var MAP = {tw: 60, th: 15};

var TILESET_TILE = TILE * 2;
var TILESET_PADDING = 2;
var TILESET_SPACING = 2;
var TILESET_COUNT_X = 14;
var TILESET_COUNT_Y = 14;

var player = new Player();
var keyboard = new Keyboard();

var musicBackground;
var sfxFire;

//arrays
var enemies = [];
var bullets = [];
var exits = [];

//collision detection
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


var cells = [];
function initialize()
{
	//idx = 0;
	for(var layerIdx = 0; layerIdx < LAYER_COUNT; layerIdx++)
	{
		cells[layerIdx] = [];
		var idx = 0;
		for(var y = 0; y < level1.layers[layerIdx].height; y++)
		{
			cells[layerIdx][y] = [];
			for(var x = 0; x < level1.layers[layerIdx].width; x++)
			{
				if(level1.layers[layerIdx].data[idx] != 0)
				{
					cells[layerIdx][y][x] = 1;
					cells[layerIdx][y-1][x] = 1;
					cells[layerIdx][y-1][x+1] = 1;
					cells[layerIdx][y][x+1] = 1;
				}

				/*else if(level1.layers[LAYER_OBJECT_ENEMIES].data[idx] != 0)
				{
					var px = tileToPixel(x);
					var py = tileToPixel(y);
					var e = new Enemy (px, py);
					enemies.push(e);
				}*/

				else if (cells[layerIdx][y][x] != 1)
				{
					cells[layerIdx][y][x] = 0;
				}
				idx++;
			}
		}
	}

	idx = 0;
	for(var y = 0; y < level1.layers[LAYER_OBJECT_ENEMIES].height; y++)
	{
		for(var x = 0; x < level1.layers[LAYER_OBJECT_ENEMIES].width; x++)
		{
			if(level1.layers[LAYER_OBJECT_ENEMIES].data[idx] != 0)
			{
				var px = tileToPixel(x);
				var py = tileToPixel(y);
				var e = new Enemy(px, py);
				enemies.push(e);
			}
			idx++;
		}
	}

	cells[LAYER_OBJECT_TRIGGERS] = [];
	idx = 0;
	for(var y = 0; y < level1.layers[LAYER_OBJECT_TRIGGERS].height; y++) {
		cells[LAYER_OBJECT_TRIGGERS][y] = [];
		for(var x = 0; x < level1.layers[LAYER_OBJECT_TRIGGERS].width; x++) {
			if(level1.layers[LAYER_OBJECT_TRIGGERS].data[idx] != 0) {
				
				cells[LAYER_OBJECT_TRIGGERS][y][x] = 1;
				cells[LAYER_OBJECT_TRIGGERS][y-1][x] = 1;
				cells[LAYER_OBJECT_TRIGGERS][y-1][x+1] = 1;
				cells[LAYER_OBJECT_TRIGGERS][y][x+1] = 1;
			
				if(level1.layers[LAYER_OBJECT_TRIGGERS].data[idx] == 163) 
				{
					var px = tileToPixel(x);
					var py = tileToPixel(y);
					var exit = new Exit(px, py);
					exits.push(exit);
				}
			}
			
			
			if(cells[LAYER_OBJECT_TRIGGERS][y][x] != 1) {
				// if we haven't set this cell's value, then set it to 0 now
				cells[LAYER_OBJECT_TRIGGERS][y][x] = 0;
			}
			
			
			idx++;
		}
	}


	musicBackground = new Howl(
	{
		urls: ["background.ogg"],
		loop: true,
		buffer: true,
		volume: 0.5
	});
	musicBackground.play();

	sfxFire = new Howl (
	{
		urls: ["fireEffect.ogg"],
		buffer: true,
		volume: 1,
		onend: function() {
			isSfxPlaying = false;
		}
	});
}

function cellAtPixelCoord(layer, x, y)
{
	if(x<0 || x>SCREEN_WIDTH || y<0)
		return 1;
	if(y>SCREEN_HEIGHT)
		return 0;
	return cellAtTileCoord(layer, p2t(x), p2t(y));
};

function cellAtTileCoord(layer, tx, ty)
{
	if(tx<0 || tx>=MAP.tw || ty<0)
		return 1;
	if(ty>=MAP.th)
		return 0;
	return cells[layer][ty][tx];
};

function tileToPixel(tile)
{
	return tile * TILE;
};

function pixelToTile(pixel)
{
	return Math.floor(pixel/TILE);
};

function bound(value, min, max)
{
	if(value < min)
		return min;
	if(value > max)
		return max;
	return value;
}

var tileset = document.createElement("img");
tileset.src = "tileset.png";

//var worldOffsetX = 0;
function drawMap()
{
	//var startX = -1;
	var maxTiles = Math.floor(SCREEN_WIDTH / TILE) + 2;
	var tileX = pixelToTile(player.position.x);
	var offsetX = TILE + Math.floor(player.position.x%TILE);

	startX = tileX - Math.floor(maxTiles / 2);

	if(startX < -1)
	{
		startX = 0;
		offsetX = 0;
	}
	if(startX > MAP.tw - maxTiles)
	{
		startX = MAP.tw - maxTiles + 1;
		offsetX = TILE;
	}

	worldOffsetX = startX * TILE + offsetX;

	for(var layerIdx = 0; layerIdx < LAYER_COUNT; layerIdx++)
	{
		for(var y = 0; y < level1.layers[layerIdx].height; y++)
		{
			var idx = y * level1.layers[layerIdx].width + startX;

			for(var x = startX; x < startX + maxTiles; x++)
			{
				if(level1.layers[layerIdx].data[idx] != 0)
				{
					var tileIndex = level1.layers[layerIdx].data[idx] - 1;
					var sx = TILESET_PADDING + (tileIndex % TILESET_COUNT_X) * (TILESET_TILE + TILESET_SPACING);
					var sy = TILESET_PADDING + (Math.floor(tileIndex/TILESET_COUNT_Y)) * (TILESET_TILE + TILESET_SPACING);
					context.drawImage(tileset, sx, sy, TILESET_TILE, TILESET_TILE, (x - startX) * TILE - offsetX, (y - 1) * TILE, TILESET_TILE, TILESET_TILE);
				}
				idx++;
			}
		}
	}
}



function run()
{
	context.fillStyle = "#66CCFF";		
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
        case STATE_GAMEWIN:
        	runGameWin(deltaTime);
        	break;
    }

}

var titleScreen = 
{
	image: document.createElement("img"),
	width: 640,
	heigth: 480
};

titleScreen.image.src = "splashScreen.png"

function runSplash(deltaTime)
{
	context.fillStyle = "#ccc";
	context.fillRect(0, 0, canvas.width, canvas.height);
	
	if(keyboard.isKeyDown(keyboard.KEY_SHIFT) == true) {
		gameState = STATE_GAME;
		return;
	}
	
	context.drawImage(titleScreen.image, 0, 0);
}

function runGame(deltaTime)
{
	context.fillStyle = "#ccc";
	context.fillRect(0, 0, canvas.width, canvas.height);

	//UPDATE
	player.update(deltaTime);
	
	// update the frame counter
	fpsTime += deltaTime;
	fpsCount++;
	if(fpsTime >= 1)
	{
		fpsTime -= 1;
		fps = fpsCount;
		fpsCount = 0;
	}
	

	//exit
	for(var i=0; i<exits.length; i++)
	{
		exits[i].update(deltaTime);
	}

	//enemies
	for(var i=0; i<enemies.length; i++)
	{
		enemies[i].update(deltaTime);
	}

	//bullets
	var hit=false;
	for(var i=0; i<bullets.length; i++)
		{
			bullets[i].update(deltaTime);
			if( bullets[i].position.x - worldOffsetX < 0 ||
				bullets[i].position.x - worldOffsetX > SCREEN_WIDTH)
			{
				hit = true;
			}
			
			for(var j=0; j<enemies.length; j++)
			{
				if(intersects( bullets[i].position.x, bullets[i].position.y, TILE, TILE,
				enemies[j].position.x, enemies[j].position.y, TILE, TILE) == true)
				{
					// kill both the bullet and the enemy
					enemies.splice(j, 1);
					hit = true;
					// increment the player score
					score += 1;
					break;
				}
			}
			if(hit == true)
			{
				bullets.splice(i, 1);
				break;
			}
			
		}
		
	for(var j=0; j<enemies.length; j++)
	{
		if(player.isDead == false)
		{
			if(intersects(enemies[j].position.x, enemies[j].position.y, TILE, TILE,
				player.position.x, player.position.y, player.width/2, player.height/2)== true)
			{
			lives -= 1;
			player.position.set(35, 250);
			}
		}
	}

	for(var i=0; i<exits.length; i++)
	{
		if(intersects(exits[i].position.x, exits[i].position.y, TILE, TILE,
				player.position.x, player.position.y, player.width/2, player.height/2)== true)
		{
			gameState = STATE_GAMEWIN;
			return;
		}
	}

	//DRAW
	drawMap();
	player.draw();
	//enemy.draw();
	// draw the FPS
	context.fillStyle = "yellow";
	context.font="14px Arial";
	context.fillText("FPS: " + fps, 5, 20, 100);
	
	//enemies
	for(var i=0; i<enemies.length; i++)
	{
		enemies[i].draw(deltaTime);
	}
	//bullets
	for(var i=0; i<bullets.length; i++)
	{
		bullets[i].draw(deltaTime);
	}
	//exit
	for(var i=0; i<exits.length; i++)
	{
		exits[i].draw(deltaTime);
	}

	context.fillStyle = "yellow";
	context.font="32px Arial";
	var scoreText = "Score: " + score;
	context.fillText(scoreText, SCREEN_WIDTH - 150, 37);
	
	//life counter
	for(var i=0; i<lives; i++)
	{
		context.drawImage(heartImage, 500 + ((heartImage.width+2)*i), 50);
	}

	if(player.isDead == false)
	{
		if(player.position.y > SCREEN_HEIGHT)
		{
				player.isDead == true;
				lives -= 1;
				player.position.set(35, 250);
		}
		if(lives == 0)
		{
			gameState = STATE_GAMEOVER;
			return;
		}		
		
	}
}

var overScreen = 
{
	image: document.createElement("img"),
	width: 640,
	heigth: 525
};

overScreen.image.src = "gameOver.png"

function runGameOver(deltaTime)
{
	context.fillStyle = "#ccc";
	context.fillRect(0, 0, canvas.width, canvas.height);
	
	context.drawImage(overScreen.image, 0, 0);
}

var gameWinScreen =
{
	image: document.createElement("img"),
	width: 640,
	height: 525
};

gameWinScreen.image.src = "gameWin.png"

function runGameWin(deltaTime)
{
	context.fillStyle = "#ccc";
	context.fillRect(0, 0, canvas.width, canvas.height);
	
	context.drawImage(gameWinScreen.image, 0, 0);
}

initialize();

//Heya Stupid, Don't touch this stuff//
(function() {
  var onEachFrame;
  if (window.requestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() { cb(); window.requestAnimationFrame(_cb); }
      _cb();
    };
  } else if (window.mozRequestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() { cb(); window.mozRequestAnimationFrame(_cb); }
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