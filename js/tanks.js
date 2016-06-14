/**
 * Created by Kayne on 11.6.2016 ã..
 */
function getMidPoint(obj) {
    return new Phaser.Point(obj.x + obj.width / 2, obj.y + obj.height / 2);
}

EnemyTank = function (index, game, target, goblein, bullets, pathfinder) {

    this.pathfinder = pathfinder;

    this.path = [];

/*    isMirroredX = Math.round(Math.random());
    isMirroredY = Math.round(Math.random());
    var maxX = game.width - 32;
    var maxY = game.height - 32;
    coords = [
        isMirroredX*maxX, game.world.randomY*maxY, 
        game.world.randomX*maxX, isMirroredY*maxY
    ];

    var x = coords[0];
    var y = coords[1];*/

    var coin = Math.round(Math.random());
    var choice = Math.round(Math.random());
    var x = [];
    var y = [];
    x[0] = game.world.randomX * coin;
    x[1] = game.width - 32;
    y[0] = game.height - 32;
    y[1] = game.world.randomY * Math.abs(coin - 1);
    coin = Math.round(Math.random());
    x = x[coin];
    y = y[coin];

    this.game = game;
    this.health = 2;
    this.target = target;
    this.goblein = goblein;
    this.bullets = bullets;
    this.fireRate = 2000;
    this.nextFire = 2000;
    this.alive = true;

    this.shadow = game.add.sprite(x, y, 'enemy', 'shadow');
    this.tank = game.add.sprite(x, y, 'enemy', 'tank1');
    this.turret = game.add.sprite(x, y, 'enemy', 'turret');

    this.tank.scale.setTo(0.75, 0.75);
    this.shadow.scale.setTo(0.75, 0.75);
    this.turret.scale.setTo(0.75, 0.75);

    this.shadow.anchor.set(0.5);
    this.tank.anchor.set(0.5);
    this.turret.anchor.set(0.3, 0.5);

    this.tank.name = index.toString();
    game.physics.enable(this.tank, Phaser.Physics.ARCADE);
    this.tank.body.immovable = false;
    this.tank.body.collideWorldBounds = true;

    this.tank.angle = 90;

    this.moveTo(new Phaser.Point(goblein.x, goblein.y + 64));
    //game.physics.arcade.velocityFromRotation(this.tank.rotation, 50, this.tank.body.velocity);

};

EnemyTank.prototype.damage = function() {

    this.health -= 1;

    if (this.health <= 0)
    {
        this.alive = false;

        this.shadow.kill();
        this.tank.kill();

        return true;
    } else {
        this.turret.kill();
    }

    return false;

}

EnemyTank.prototype.update = function() {

    this.shadow.x = this.tank.x;
    this.shadow.y = this.tank.y;
    this.shadow.rotation = this.tank.rotation;

    this.turret.x = this.tank.x;
    this.turret.y = this.tank.y;
    this.turret.rotation = this.game.physics.arcade.angleBetween(this.tank, getMidPoint(this.target));
    //this.tank.rotation = this.tank.angle;

    if (this.turret.alive && this.game.physics.arcade.distanceBetween(this.tank, this.target) < 1300) {
        if (this.game.time.now > this.nextFire && this.bullets.countDead() > 0) {
            this.nextFire = this.game.time.now + this.fireRate;
            var bullet = this.bullets.getFirstDead();
            var startX = this.turret.x + 64 * Math.cos(this.turret.rotation);
            var startY = this.turret.y + 64 * Math.sin(this.turret.rotation);
            bullet.reset(startX, startY);
            bullet.rotation = this.game.physics.arcade.moveToObject(bullet, getMidPoint(this.target), 200);
        }
    }

    if (this.path[0]) {
        var moveToX = this.path[0].x;
        var moveToY = this.path[0].y;
        var tank = this.tank;
        if (this.game.physics.arcade.distanceBetween(tank, new Phaser.Point(moveToX, moveToY)) > 3) {
            var from = new Phaser.Point(tank.x + Math.round(tank.width / 2), tank.y + Math.round(tank.height / 2));
            var to = new Phaser.Point(moveToX + Math.round(tank.width / 2), moveToY + Math.round(tank.height / 2));
            tank.angle = game.physics.arcade.angleBetween(from, to);
            game.physics.arcade.velocityFromRotation(tank.angle, 7, tank.body.velocity);
            this.tank.rotation = tank.angle;
        } else {
            if (this.path && this.path.length > 0) {
                var nextPoint = this.path[0];
                moveToX = nextPoint.x;
                moveToY = nextPoint.y;
                this.path = this.path.slice(1);
            }
        }
    } else {
        this.tank.body.velocity.x = 0;
        this.tank.body.velocity.y = 0;
    }

};

EnemyTank.prototype.moveTo = function(to) {
    var that = this;
    findPath(new Phaser.Point(this.tank.x, this.tank.y), new Phaser.Point(to.x, to.y), function(found_path) {
        found_path = found_path || [];
        that.path = found_path.slice(1).map(function(entry){
            return {x: entry.x * TILE_WIDTH - TILE_WIDTH + that.tank.width, y: entry.y * TILE_HEIGHT - TILE_HEIGHT + that.tank.height};
        });
        //waypoints.removeAll();
        blocked = false;

        for(var i = 0, ilen = that.path.length; i < ilen; i++) {
            waypoints.create(that.path[i].x - 3, that.path[i].y, 'waypoint');
        }
    });
};