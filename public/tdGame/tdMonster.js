var Point = require('./tdPoint')
var TDMap = require('./tdMap')
var constants = require('./tdConst')
var Direction = constants.Direction;

var TDMonster = function(name,game){
    this.currentDirection = Direction.None;
    this.name = name;
    this.isDead = false;
    this.moveStep = 32;
    this.tdMap = null;
    this.position = new Point.Point(0,0);
    this.FPS = 5;
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
    switch (directionnum) {
        case Direction.Up:
            if(this.isPositionPassable(this.position.x,this.position.y + this.moveStep)){
                this.position.y += this.moveStep;
            }
        break;
        case Direction.Down:
            if(this.isPositionPassable(this.position.x,this.position.y - this.moveStep)){
                this.position.y -= this.moveStep;
            }
        break;
        case Direction.Left:
            if(this.isPositionPassable(this.position.x - this.moveStep,this.position.y)){
                this.position.x -= this.moveStep;
            }
        break;
        case Direction.Right:
            if(this.isPositionPassable(this.position.x + this.moveStep,this.position.y)){
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

    