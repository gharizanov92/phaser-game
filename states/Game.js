var Game = function(game) {
    game.over = false;
    game.started = 8;
};

var TILE_WIDTH = 32;
var TILE_HEIGHT = 32;

var player;
var platforms;
var cursors;

var goblein;

var moveToX = 300;
var moveToY = 200;

var tileWidth = 10;
var tileHeight = 10;

var map;
var tileset;
var grid;
var layer;
var pathfinder;
var path;
var direction;
var walkables;

var stars;
var waypoints;
var obstacles;
var score = 0;
var scoreText;

var enemies;
var enemyBullets;
var enemiesTotal = 0;
var enemiesAlive = 0;
var explosions;

var nextTankSpawn = 500;
var tankRespawnRate = 5000;
var tankSpeed = 7;

var nextFire = 0;
var fireRate = 500;
var canShoot = false;

var bullets;
var graphics;
var arrow;
var energyBar;

var totalEnemiesSpawned = 0;

var animationAngles = {
    0: 'right',
    45: 'upRight',
    90: 'up',
    135: 'upLeft',
    180: 'left',
    225: 'downLeft',
    270: 'down',
    315: 'downRight'
};

var tutorialText = [
"Good luck!",
"If you have no energy - you can't shoot.\nRegain energy by collecting crystals",
"If you get hit by the enemy, you lose energy.\nYour energy is displayed in the bottom bar",
"You're basically like Dorian Grey, just cooler",
"If the enemy touches it\nyou lose your power and die.",
"It's the source of your power",
"Cool! Now that you know the basics,\nthe goal of the game is to protect the kitty goblein",
"In order to shoot, click on me,\ndrag and release to the point you want to hit\nTry this now.",
"Hi!\nI'm Lady Gaga.\nClick somewhere on the map\nto make me move"];

var createPathForPlayer = function(found_path) {
    found_path = found_path || [];
    path = found_path;
    waypoints.removeAll();
    path = path.slice(1);

    for(var i = 0, ilen = path.length; i < ilen; i++) {
        if (path[i].x <= 0) {
            path[i].x = 1;
        }
        if (path[i].y <= 0) {
            path[i].y = 1;
        }
        if (path[i].x >= layer.width / TILE_WIDTH) {
            path[i].x = layer.width / TILE_WIDTH - 1;
        }               
        if (path[i].y >= layer.height / TILE_HEIGHT) {
            path[i].y = layer.height / TILE_HEIGHT - 1;
        }
        waypoints.create(path[i].x * TILE_WIDTH, path[i].y * TILE_HEIGHT, 'waypoint');
    }

    moveToX = path[0].x * TILE_WIDTH;
    moveToY = path[0].y * TILE_HEIGHT;
}

Game.prototype = {

    preload: function () {  
        game.load.image('cup', 'assets/cup.png');   
        game.load.image('goblein', 'assets/goblein.jpg');
        game.load.spritesheet('lady gaga', 'assets/stella_walk.png', 64, 64);
        game.load.image('star', 'assets/diamond.png');
        game.load.image('waypoint', 'assets/waypoint.png');
        game.load.image('grass', 'assets/grass_random_grid.png');
        game.load.tilemap('map', 'assets/map.json', null, Phaser.Tilemap.TILED_JSON);
        game.load.image('tiles', 'assets/ground_tiles.png', 64, 64);
        game.load.spritesheet('background', 'assets/ground_tiles.png', 64, 64);

        game.load.atlas('enemy', 'assets/tanks/enemy-tanks.png', 'assets/tanks/tanks.json');
        game.load.image('enemy-turret', 'assets/tanks/turret.png');
        game.load.image('shadow_hover', 'assets/tanks/shadow_hover.png');
        game.load.image('bullet', 'assets/tanks/bullet.png');
        game.load.spritesheet('kaboom', 'assets/tanks/explosion.png', 64, 64, 23);
    },

    addMenuOption: function(text, callback) {
        var optionStyle = { font: '30pt TheMinion', fill: 'white', align: 'left', stroke: 'rgba(0,0,0,0)', srokeThickness: 4};
        var txt = game.add.text(game.world.centerX, (this.optionCount * 80) + 200, text, optionStyle);
        txt.anchor.setTo(0.5);
        txt.stroke = "rgba(0,0,0,0";
        txt.strokeThickness = 4;
        var onOver = function (target) {
            target.fill = "#FEFFD5";
            target.stroke = "rgba(200,200,200,0.5)";
            txt.useHandCursor = true;
        };
        var onOut = function (target) {
            target.fill = "white";
            target.stroke = "rgba(0,0,0,0)";
            txt.useHandCursor = false;
        };
        //txt.useHandCursor = true;
        txt.inputEnabled = true;
        txt.events.onInputUp.add(callback, this);
        txt.events.onInputOver.add(onOver, this);
        txt.events.onInputOut.add(onOut, this);

        this.optionCount ++;
    },

    create: function () { 

        this.tankSpeed = 7;

        game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;

        // game
        game.world.setBounds(0, 0, 800, 480);

        map = game.add.tilemap('map');
        map.addTilesetImage('ground_tiles', 'tiles');
        layer = map.createLayer('walkable');
        obsticles = map.createLayer('obsticles');

        // room
        game.physics.startSystem(Phaser.Physics.P2JS);
        platforms = game.add.group();
        platforms.enableBody = true;

        walkables = [0, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20, 21, 22, 23, 24, 25, 26];
        //map.setCollisionBetween(1, 7);
        game.physics.p2.convertTilemap(map, layer);
        //var walkables = [127];

        pathfinder = game.plugins.add(Phaser.Plugin.PathFinderPlugin);
        pathfinder._easyStar.enableDiagonals();
        pathfinder.setGrid(map.layers[0].data, walkables);

        // stars
        stars = game.add.group();
        stars.enableBody = true;
        stars.create(250, 210, 'star');

        waypoints = game.add.group();
        waypoints.enableBody = true;

        // obstacles
        obstacles = game.add.group();
        obstacles.enableBody = true;

        //obstacles.body.immovable = true;
        goblein = game.add.sprite(380, 252, 'cup');
        game.physics.arcade.enable(goblein);
        goblein.anchor.setTo(0.5, 0.5);
        game.add.sprite(364, 220, 'goblein');

        // player
        player = game.add.sprite(300, 200, 'lady gaga');
        player.anchor.setTo(0.5, 0.5);
        player.scale.setTo(0.75, 0.75);
        player.energy = 100;

        //  We need to enable physics on the player
        game.physics.arcade.enable(player);
        player.body.collideWorldBounds = true;

        //  Our two animations, walking left and right.
        player.animations.add('down', [0, 1, 2, 3], 8, true);
        player.animations.add('left', [4, 5, 6, 7], 8, true);
        player.animations.add('right', [8, 9, 10, 11], 8, true);
        player.animations.add('up', [12, 13, 14, 15], 8, true);
        player.animations.add('downRight', [16, 17, 18, 19], 8, true);
        player.animations.add('downLeft', [20, 21, 22, 23], 8, true);
        player.animations.add('upLeft', [24, 25, 26, 27], 8, true);
        player.animations.add('upRight', [28, 29, 30, 31], 8, true);

        // arrow and energy bar
        energyBar = game.add.sprite(0, 480, 'loading');

        // enemies
        //  The enemies bullet group
        enemyBullets = game.add.group();
        enemyBullets.enableBody = true;
        enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
        enemyBullets.createMultiple(100, 'bullet');

        enemyBullets.setAll('anchor.x', 0.5);
        enemyBullets.setAll('anchor.y', 0.5);
        enemyBullets.setAll('outOfBoundsKill', true);
        enemyBullets.setAll('checkWorldBounds', true);
        //enemyBullets.setAll('scale', (0.5, 0.5));
        //bullet.scale.set(0.5, 0.5);

        enemies = [];

        //  Our bullet group
        bullets = game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;
        bullets.createMultiple(30, 'bullet', 0, false);
        bullets.setAll('anchor.x', 0.5);
        bullets.setAll('anchor.y', 0.5);
        bullets.setAll('outOfBoundsKill', true);
        bullets.setAll('checkWorldBounds', true);

        //  Explosion pool
        explosions = game.add.group();

        for (var i = 0; i < 300; i++) {
            var explosionAnimation = explosions.create(0, 0, 'kaboom', [0], false);
            explosionAnimation.anchor.setTo(0.5, 0.5);
            explosionAnimation.animations.add('kaboom');
        }

        game.input.onDown.add(this.moveOrPrepareShot);

        game.input.onUp.add(function() {
            if (player.energy > 0 && canShoot && game.time.now > nextFire) {
                nextFire = game.time.now + fireRate;
                var bullet = this.bullets.getFirstDead();
                bullet.reset(player.x, player.y);
                bullet.rotation = game.physics.arcade.moveToPointer(bullet, 400);
                if(game.started == 7) {
                    game.started--;
                    introText.text = tutorialText[game.started];
                }
                player.energy -= 3;
            }
            canShoot = false;
            //arrow.visible = false;
            arrow.kill();
        });

            //      font: 'bold 30pt TheMinion', fill: '#FDFFB5', align: 'center'
        introText = game.add.text(game.world.centerX, 100, tutorialText[8], { font: '25px TheMinion', fill: '#FDFFB5', align: 'center' });
        introText.anchor.setTo(0.5, 0.5);
        scoreText = game.add.text(10, 10, "Score: " + score, { font: '16px TheMinion', fill: '#FDFFB5', align: 'center' });

        graphics = game.add.graphics(0, 0);        
        graphics.lineStyle(2, 0x0000FF, 0.2);
        graphics.beginFill(0x0000FF, 0.2);
        graphics.drawRect(0, 0, 100, 5);

        arrow = game.add.sprite(player.x, player.y, graphics.generateTexture());
        arrow.kill();
    },

    update: function() {
        energyBar.scale.setTo(2.06 * (player.energy / 100), 0.90);

        if (game.over) {
            this.gameOver();
            return;
        }

        if (arrow && arrow.alive) {
            arrow.rotation =  game.physics.arcade.angleToPointer(player);
            arrow.x = player.x;
            arrow.y = player.y;
            arrow.scale.setTo(game.physics.arcade.distanceToPointer(player) / 100, 1)
        }

        player.body.velocity.x = 0;
        player.body.velocity.y = 0;

        game.world.bringToTop(explosions);

        game.physics.arcade.collide(player, platforms);
        game.physics.arcade.overlap(player, stars, this.collectStar, null, this);

        game.physics.arcade.overlap(enemyBullets, player, this.bulletHitPlayer, null, this);

        game.physics.arcade.overlap(enemyBullets, layer, this.bulletHitTile, null, this);
        game.physics.arcade.overlap(bullets, layer, this.bulletHitTile, null, this);
        game.physics.arcade.overlap(enemyBullets, goblein, this.bulletHitPlayer, null, this);

        // show player movement
        game.physics.arcade.overlap(player, waypoints, function(player, waypoint){
            if (!waypoint.markedForKill) {
                setTimeout(function() {
                    waypoint.kill();
                }, 50);
            }
            waypoint.markedForKill = true;
        }, null, this);

        // if we've reached the next point
        if (game.physics.arcade.distanceBetween(player, new Phaser.Point(moveToX, moveToY)) > 3) {
            var from = new Phaser.Point(player.x + 5, player.y + 5);
            var to = new Phaser.Point(moveToX + 5, moveToY + 5);
            direction = game.physics.arcade.angleBetween(from, to);
            game.physics.arcade.velocityFromRotation(direction, 150, player.body.velocity);
        } else {
            player.animations.stop();
            if (path && path.length > 0) {
                var nextPoint = path[0];
                moveToX = nextPoint.x * TILE_WIDTH;
                moveToY = nextPoint.y * TILE_HEIGHT;
                path = path.slice(1);
            }
        }

        player.animations.play(animationAngles[radToDeg(direction)]);

        // handle enemies
        if (game.started != 0) {
            return;
        }

        // update all enemies
        for (var i = 0; i < enemies.length; i++) {
            if (enemies[i].alive) {
                enemiesAlive++;
                game.physics.arcade.overlap(bullets, enemies[i].tank, this.bulletHitEnemy, null, this);
                game.physics.arcade.overlap(enemyBullets, enemies[i].tank, this.bulletHitEnemy, null, this);
                game.physics.arcade.overlap(goblein, enemies[i].tank, this.gameOver, null, this);
                enemies[i].update();
            }
        }

        // spawn new onews
        if (game.time.now > nextTankSpawn && enemiesTotal < 30) {
            nextTankSpawn = game.time.now + tankRespawnRate;
            if (tankRespawnRate > 1500) {
                tankRespawnRate -= 150;
            }
            this.tankSpeed += 2;
            enemies.push(new EnemyTank(enemiesTotal++, game, player, goblein, enemyBullets, pathfinder, this.tankSpeed));
        }

        scoreText.text = "Score: " + score;
    },

    gameOver : function() {
        game.over = true;

        if (!game.restartIn) {
            game.restartIn = game.time.now + 1000;
        } else if (game.time.now > game.restartIn) {
            game.state.start(game.state.current);
            game.restartIn = undefined;
            game.over = false;
            game.started = 1;
            enemies = [];
            enemiesTotal = 0;
            enemiesAlive = 0;
            tankSpeed = 7;
            introText.text = tutorialText[1];
            nextTankSpawn = 500;
            tankRespawnRate = 5000;
            tankSpeed = 7;
            this.game.state.start("GameOver");
        }
        
        player.body.velocity.setTo(0);
        for (var i = 0; i < enemies.length; i++) {
            enemies[i].tank.body.velocity.setTo(0);
        }
    },

    moveOrPrepareShot : function(tile) {
        var allowMovement = true;
        if (game.started > 0) {
            if(game.started != 8) {
                allowMovement = false;
            }
            if(game.started != 7) {
                game.started--;
                introText.text = tutorialText[game.started];
            }
        } else {
            introText.visible = false;
        }

        if (game.over) {
            return;
        }

        if (game.physics.arcade.distanceBetween(player, game.input.activePointer) < 96) {
            canShoot = true;
            arrow = game.add.sprite(player.x + player.width / 2, player.y + player.height / 2, graphics.generateTexture());
            //arrow = game.add.sprite(player.x, player.y, graphics.generateTexture());
        } else {
            if(!allowMovement) {
                return; 
            }
            findPath(new Phaser.Point(player.x + player.width / 2, player.y  + player.height / 2), new Phaser.Point(game.input.activePointer.pageX, game.input.activePointer.pageY), createPathForPlayer);
        }
    },

    bulletHitPlayer : function(targetHit, bullet) {
        bullet.kill();
        var xDist = 32 * Math.cos(bullet.rotation);
        var yDist = - 32 * Math.sin(bullet.rotation);
        createExplosionAt(bullet.x + xDist, bullet.y - yDist);
        if (player.energy > 0) {
            player.energy -= 20;
        }        
    },

    bulletHitTile : function(bullet, tile) {
        if (tile.index == -1) {
            return;
        }
        if (walkables.indexOf(tile.index) != -1) {
            return;
        }
        if (game.physics.arcade.distanceBetween(bullet, new Phaser.Point(tile.worldX + tile.width / 2, tile.worldY + tile.height / 2)) > 16) {
            return;
        }
        bullet.kill();
        var xDist = 32 * Math.cos(bullet.rotation);
        var yDist = - 32 * Math.sin(bullet.rotation);
        createExplosionAt(bullet.x + xDist, bullet.y - yDist);
    },

    bulletHitEnemy : function (tank, bullet) {

        bullet.kill();
        console.log(tank);
        console.log(bullet);
        var xDist = 32 * Math.cos(bullet.rotation);
        var yDist = - 32 * Math.sin(bullet.rotation);
        createExplosionAt(bullet.x + xDist, bullet.y - yDist);
        enemies[tank.name].damage();
        score += Math.round(this.tankSpeed * ((5000 - tankRespawnRate) / 10));
    },

    collectStar : function (player, star) {
        // Removes the star from the screen
        star.kill();
        x = 128 + Math.floor(Math.random() * (game.world.width - 128));
        y = 64 + Math.floor(Math.random() * (game.world.height - 280));

        stars.create(x, y, 'star');
        player.energy = player.energy + 50;

        if (player.energy > 100) {
            player.energy = 100;
        }

        score += 10;
        //scoreText.text = 'Score: ' + score;
    }
}
