/**
 * Created by Kayne on 11.6.2016 ã..
 */
function getMidPoint(obj) {
    return new Phaser.Point(obj.x + obj.width / 2, obj.y + obj.height / 2);
}

EnemyTank = function (index, game, target, bullets, pathfinder) {

    this.pathfinder = pathfinder;

    this.path = [];

    var x = game.world.randomX;
    var y = game.world.randomY;

    this.game = game;
    this.health = 3;
    this.target = target;
    this.bullets = bullets;
    this.fireRate = 5000;
    this.nextFire = 0;
    this.alive = true;

    this.shadow = game.add.sprite(x, y, 'enemy', 'shadow');
    this.tank = game.add.sprite(x, y, 'enemy', 'tank1');
    this.turret = game.add.sprite(x, y, 'enemy', 'turret');

    this.shadow.anchor.set(0.5);
    this.tank.anchor.set(0.5);
    this.turret.anchor.set(0.3, 0.5);

    this.tank.name = index.toString();
    game.physics.enable(this.tank, Phaser.Physics.ARCADE);
    this.tank.body.immovable = false;
    this.tank.body.collideWorldBounds = true;
    this.tank.body.bounce.setTo(1, 1);

    this.tank.angle = game.rnd.angle();

    //game.physics.arcade.velocityFromRotation(this.tank.rotation, 50, this.tank.body.velocity);

};

EnemyTank.prototype.damage = function() {

    this.health -= 1;

    if (this.health <= 0)
    {
        this.alive = false;

        this.shadow.kill();
        this.tank.kill();
        this.turret.kill();

        return true;
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

    if (this.game.physics.arcade.distanceBetween(this.tank, this.target) < 300)
    {
        if (this.game.time.now > this.nextFire && this.bullets.countDead() > 0)
        {
            this.nextFire = this.game.time.now + this.fireRate;

            var bullet = this.bullets.getFirstDead();

            bullet.reset(this.turret.x, this.turret.y);

            bullet.rotation = this.game.physics.arcade.moveToObject(bullet, getMidPoint(this.target), 300);
        }
    }

};

EnemyTank.prototype.moveTo = function() {

};

function findPathTo1(tile) {
    pathfinder.setCallbackFunction(function(found_path) {
        found_path = found_path || [];
        path = found_path;
        path = path.slice(1);
        moveToX = path[0].x * TILE_WIDTH - TILE_WIDTH;
        moveToY = path[0].y * TILE_HEIGHT - TILE_HEIGHT;

        for(var i = 0, ilen = path.length; i < ilen; i++) {
            waypoints.create(path[i].x * TILE_WIDTH - 3, path[i].y * TILE_HEIGHT + 28, 'waypoint');
        }
    });
    var offsetY = game.camera.y;
    var offsetX = game.camera.x;
    pathfinder.preparePathCalculation(
        [layer.getTileX(target.x + 48), layer.getTileY(target.y + 48)],
        [layer.getTileX(tile.clientX + offsetX), layer.getTileY(tile.clientY + offsetY)]);
    pathfinder.calculatePath();
}