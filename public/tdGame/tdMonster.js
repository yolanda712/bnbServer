var Point = require('./tdPoint')
var constants = require('./tdConst')
var Direction = constants.Direction;

var TDMonster = function(monsterIndex,name,game){
    this.currentDirection = Direction.None;
    this.game = game;
    this.isDead = false;
    this.moveStep = 0.5;
    this.tdMap = null;
    this.position = new Point(0,0);
    this.FPS = 90;
    this.monsterBorder = 15.9;
    this.monsterIndex = monsterIndex;
    this.name = name;
    this.moveInterval = null;
    this.tempMoveStep = 0;
    this.oneMoveStep = 30;
     
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

TDMonster.prototype.findDirection = function(){
    var leftBorder,rightBorder,upBorder,downBorder,targetYUp,targetYDown,targetXLeft,targetXRight;
    leftBorder = this.position.x - this.monsterBorder;
    rightBorder = this.position.x + this.monsterBorder;
    downBorder = this.position.y - this.monsterBorder;
    upBorder = this.position.y + this.monsterBorder;
    targetYUp = this.position.y + this.monsterBorder + this.moveStep;
    targetYDown = this.position.y - this.monsterBorder - this.moveStep;
    targetXLeft = this.position.x - this.monsterBorder - this.moveStep;
    targetXRight = this.position.x + this.monsterBorder + this.moveStep;
    var direcArr = [];
    if(this.isPositionPassable(leftBorder,targetYUp) 
      && this.isPositionPassable(rightBorder,targetYUp) 
      && this.reverseDirection(this.currentDirection)!=Direction.Up)
        direcArr.push(Direction.Up);
    if(this.isPositionPassable(leftBorder,targetYDown)
      && this.isPositionPassable(rightBorder,targetYDown) 
      && this.reverseDirection(this.currentDirection)!=Direction.Down)
        direcArr.push(Direction.Down);
    if(this.isPositionPassable(targetXLeft, upBorder) 
      && this.isPositionPassable(targetXLeft,downBorder) 
      && this.reverseDirection(this.currentDirection)!=Direction.Left)
        direcArr.push(Direction.Left);
    if(this.isPositionPassable(targetXRight, upBorder) 
      && this.isPositionPassable(targetXRight,downBorder) 
      && this.reverseDirection(this.currentDirection)!=Direction.Right)
        direcArr.push(Direction.Right);
    if(direcArr.length == 0)
        direcArr.push(this.reverseDirection(this.currentDirection));
    var randomIndex = Math.floor(Math.random()*direcArr.length);
    var directionnum = direcArr[randomIndex];
    // console.log(this.name+"!!!!!!condir"+this.currentDirection+'!!!!!!!directionnum'+directionnum+"!!!!!"+direcArr);
    return directionnum;
}

TDMonster.prototype.reverseDirection = function(directionnum){
    switch (directionnum) {
        case Direction.Up:
             return Direction.Down;
        case Direction.Down:
             return Direction.Up;
        case Direction.Left:
             return Direction.Right;
        case Direction.Right:
             return Direction.Left;
    }
}

TDMonster.prototype.move = function(){
    // this.currentDirection = this.findDirection();
    if(!this.isDead){
        var self = this;
        this.tempMoveStep = 0;
        this.moveInterval = setInterval(function(){
            self.game.monsterMeetRole();
            self.moveOneDirection(self.currentDirection);
        },1000/self.FPS);
    }
}

TDMonster.prototype.moveOneDirection = function(directionnum){
    var leftBorder,rightBorder,upBorder,downBorder,targetYUp,targetYDown,targetXLeft,targetXRight;
    leftBorder = this.position.x - this.monsterBorder;
    rightBorder = this.position.x + this.monsterBorder;
    downBorder = this.position.y - this.monsterBorder;
    upBorder = this.position.y + this.monsterBorder;
    targetYUp = this.position.y + this.monsterBorder + this.moveStep;
    targetYDown = this.position.y - this.monsterBorder - this.moveStep;
    targetXLeft = this.position.x - this.monsterBorder - this.moveStep;
    targetXRight = this.position.x + this.monsterBorder + this.moveStep;
    // var tempMoveStep = 0;
    var randomDirection = -1;
    switch (directionnum) {
        case Direction.Up:
            if(this.isPositionPassable(leftBorder,targetYUp)&& this.isPositionPassable(rightBorder,targetYUp)){
                this.position.y += this.moveStep;
                this.tempMoveStep += this.moveStep;
                if(this.tempMoveStep >= this.oneMoveStep){
                    randomDirection = this.findDirection();
                    if(randomDirection!=this.currentDirection){
                        clearInterval(this.moveInterval);
                        this.currentDirection = randomDirection;
                        this.move();
                    }
                }
            }else{
                clearInterval(this.moveInterval);
                randomDirection = this.findDirection();
                this.currentDirection = randomDirection;
                this.move();
            }
        break;

        case Direction.Down:
            if(this.isPositionPassable(leftBorder,targetYDown) && this.isPositionPassable(rightBorder,targetYDown)){
                this.position.y -= this.moveStep;
                this.tempMoveStep += this.moveStep;
                if(this.tempMoveStep >= this.oneMoveStep){
                    randomDirection = this.findDirection();
                    if(randomDirection!=this.currentDirection){
                        clearInterval(this.moveInterval);
                        this.currentDirection = randomDirection;
                        this.move();
                    }
                }
            }else{
                clearInterval(this.moveInterval);
                randomDirection = this.findDirection();
                this.currentDirection = randomDirection;
                this.move();
            }
        break;

        case Direction.Left:
            if(this.isPositionPassable(targetXLeft, upBorder)&& this.isPositionPassable(targetXLeft,downBorder)){
                this.position.x -= this.moveStep;
                this.tempMoveStep += this.moveStep;
                if(this.tempMoveStep >= this.oneMoveStep){
                    randomDirection = this.findDirection();
                    if(randomDirection!=this.currentDirection){
                        clearInterval(this.moveInterval);
                        this.currentDirection = randomDirection;
                        this.move();
                    }
                }
            }else{
                clearInterval(this.moveInterval);
                randomDirection = this.findDirection();
                this.currentDirection = randomDirection;
                this.move();
            }
        break;

        case Direction.Right:
            if(this.isPositionPassable(targetXRight, upBorder) && this.isPositionPassable(targetXRight,downBorder)){
                this.position.x += this.moveStep;
                this.tempMoveStep += this.moveStep;
                if(this.tempMoveStep >= this.oneMoveStep){
                    randomDirection = this.findDirection();
                    if(randomDirection!=this.currentDirection){
                        clearInterval(this.moveInterval);
                        this.currentDirection = randomDirection;
                        this.move();
                    }
                }
            }else{
                clearInterval(this.moveInterval);
                randomDirection = this.findDirection();
                this.currentDirection = randomDirection;
                this.move();
            }
        break;
    }
}

TDMonster.prototype.isPositionPassable = function(x,y){
    if(this.isDead) return false;
    var tdMap = this.getMap();
    var location = this.getMapLocation(x,y);
    return tdMap.isPositionPassable(location.x,location.y);
}


TDMonster.prototype.die = function(){
    this.isDead = true;
    clearInterval(this.moveInterval);
    this.game.broadcastMsg("monsterBoom",{x:this.position.x,y:this.position.y,name:this.name});
}

TDMonster.prototype.getMapLocation = function(x,y){
    var tdMap = this.getMap();
    if(tdMap ==null){
        console.log('map not set');
        return {}
    }
    return new Point(tdMap.getMapLocation(x,y).x, tdMap.getMapLocation(x,y).y);
}


module.exports = TDMonster;

    