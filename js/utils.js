/**
 * Created by Kayne on 12.6.2016 ã..
 */

function getDirection(newDiretion, oldDirection) {
    if (oldDirection === undefined) {
        return newDiretion;
    } else {
        return (newDiretion + oldDirection) / 2;
    }
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function radToDeg(degrees) {
    var dir = 360 - (degrees * 180 / Math.PI);
    var direction = 45 * Math.round(dir / 45);
    return direction % 360;
}

function findPath(from, to, cb) {
    if (to.x >= game.width || to.y >= game.height || to.x <= 0 || to.y <= 0) {
        return;
    }
    pathfinder.setCallbackFunction(cb);
    var cameraX = game.camera.x;
    var cameraY = game.camera.y;
    pathfinder.preparePathCalculation(
        [layer.getTileX(from.x), layer.getTileY(from.y)],
        [layer.getTileX(to.x), layer.getTileY(to.y)]);
    pathfinder.calculatePath();
}