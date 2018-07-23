var Point = require('./tdPoint')
var TDMap = require('./tdMap')
var constants = require('./tdConst')
var Direction = constants.Direction;

var TDMonster = function(game){
    this.currentDirection = Direction.None;
    this.game = game;
    this.isDead = false;
    this.moveStep = 32;
    this.tdMap = null;
    this.position = new Point.Point(0,0);
    this.FPS = 20;
    this.roleBorder = 15.9;

    var self = this;

    
    this.monsterMoveInterval = setInterval(function(){
        if(!this.isDead){
            var directionnum = Math.floor(Math.random()*4);
            self.move(directionnum);
        }
    },1000/self.FPS);
    
    
}
TDMonster.prototype.getMap = function(){
    return this.tdMap;
}

TDMonster.prototype.setMap = function(tdMap){
    this.tdMap = tdMap;
}

TDMonster.prototype.setPosition = function(x, y){
    this.position.x = x;
    this.position.y = y;
}

TDMonster.prototype.getPosition = function(){
    return this.position;
}

TDMonster.prototype.move = function(directionnum){
    var leftBorder,rightBorder,upBorder,downBorder;
    var targetX,targetY;
    switch (directionnum) {
        case Direction.Up:
            leftBorder = this.position.x - this.roleBorder;
            rightBorder = this.position.x + this.roleBorder;
            targetY = this.position.y + this.roleBorder + this.moveStep;
            if(this.isPositionPassable(leftBorder,targetY)&& this.isPositionPassable(rightBorder,targetY)){
                this.position.y += this.moveStep;
            }
        break;
        case Direction.Down:
            leftBorder = this.position.x - this.roleBorder;
            rightBorder = this.position.x + this.roleBorder;
            targetY = this.position.y - this.roleBorder - this.moveStep;
            if(this.isPositionPassable(leftBorder,targetY) && this.isPositionPassable(rightBorder,targetY)){
                    this.position.y -= this.moveStep;
            }
        break;
        case Direction.Left:
            downBorder = this.position.y - this.roleBorder;
            upBorder = this.position.y + this.roleBorder;
            targetX = this.position.x - this.roleBorder - this.moveStep;
            if(this.isPositionPassable(targetX, upBorder)&& this.isPositionPassable(targetX,downBorder)){
                this.position.x -= this.moveStep;
            }
        break;
        case Direction.Right:
            downBorder = this.position.y - this.roleBorder;
            upBorder = this.position.y + this.roleBorder;
            targetX = this.position.x + this.roleBorder + this.moveStep;
            if(this.isPositionPassable(targetX, upBorder) && this.isPositionPassable(targetX,downBorder)){
                this.position.x += this.moveStep;
            }
        break;
    }
}
TDMonster.prototype.isPositionPassable = function(x,y){
    if(this.isDead) return false;
    var tdMap = this.getMap();
    var location = tdMap.getMapLocation(x,y);
    return tdMap.isPositionPassable(location.x,location.y);
}

TDMonster.prototype.startCocosPosition = function(){
    var tdMap = this.getMap();
    var startPosition = tdMap.monsterStartPointArr[0];
    var cocosPosition = tdMap.convertMapIndexToCocosAxis(tdMap.getYLen(), startPosition.x, startPosition.y);
    return cocosPosition;
}

TDMonster.prototype.die = function(){
    this.isDead = true;
    var monsterBoomTime = setTimeout(function(){
        var cocosPosition =this.startCocosPosition();
        this.setPosition(cocosPosition.x, cocosPosition.y);
        this.isDead = false;
    },1500);
    clearInterval(monsterBoomTime);
}

module.exports = TDMonster;

    