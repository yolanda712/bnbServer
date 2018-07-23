var Point = require('./tdPoint')
var TDMap = require('./tdMap')
var constants = require('./tdConst')
var Direction = constants.Direction;

var Monster = function(name,game){
    this.FPS = 90;
    this.currentDirection = Direction.None;
    this.name = name;
    this.isDead = false;
    this.moveStep = 1;
    this.tdMap = null;
    this.getMap = function(){
        return this.tdMap;
    }

    this.setMap = function(tdMap){
        this.tdMap = tdMap;
    }

    this.setPosition = function(x, y){
        this.position.x = x;
        this.position.y = y;
    }

    this.getPosition = function(){
        return this.position;
    }

    this.move = function(directionnum){
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
    this.isPositionPassable = function(x,y){
        if(this.isDead) return false;
        var tdMap = this.getMap();
        var location = tdMap.getMapLocation(x,y);
        return tdMap.isPositionPassable(location.x,location.y);
    }
    this.die = function(){
        this.isDead = true;
        this.setPosition(x,y);
    }
    while(!this.isDead){
        var directionnum = Math.floor(Math.random()*4);
        this.move(directionnum);
    }
}