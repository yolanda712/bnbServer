var Point = require('./tdPoint')
var constants = require('./tdConst')
var Direction = constants.Direction;
// var leftBorder,rightBorder,upBorder,downBorder,targetYUp,targetYDown,targetXLeft,targetXRight;

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
    this.leftBorder = 0;
    this.rightBorder = 0;
    this.upBorder = 0;
    this.downBorder = 0;
    this.targetYUp = 0;
    this.targetYDown = 0;
    this.targetXLeft = 0;
    this.targetXRight = 0;
     
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

TDMonster.prototype.calculate = function(){
    this.leftBorder = this.position.x - this.monsterBorder;
    this.rightBorder = this.position.x + this.monsterBorder;
    this.downBorder = this.position.y - this.monsterBorder;
    this.upBorder = this.position.y + this.monsterBorder;
    this.targetYUp = this.position.y + this.monsterBorder + this.moveStep;
    this.targetYDown = this.position.y - this.monsterBorder - this.moveStep;
    this.targetXLeft = this.position.x - this.monsterBorder - this.moveStep;
    this.targetXRight = this.position.x + this.monsterBorder + this.moveStep;
}

TDMonster.prototype.confirmYDirection = function(firstBorder,sencondBorder,targetY,direction){
    var canchose = true;
    if(!this.isPositionPassable(firstBorder,targetY)) canchose = false;
    if(!this.isPositionPassable(sencondBorder,targetY)) canchose = false;
    if(this.reverseDirection(this.currentDirection) == direction)  canchose = false;
    return canchose;
}

TDMonster.prototype.confirmXDirection = function(firstBorder,sencondBorder,targetX,direction){
    var canchose = true;
    if(!this.isPositionPassable(targetX,firstBorder)) canchose = false;
    if(!this.isPositionPassable(targetX,sencondBorder)) canchose = false;
    if(this.reverseDirection(this.currentDirection) == direction)  canchose = false;
    return canchose;
}

TDMonster.prototype.findDirection = function(){
    this.calculate();
    var direcArr = [];
    if(this.confirmYDirection(this.leftBorder,this.rightBorder,this.targetYUp,Direction.Up))
        direcArr.push(Direction.Up);
    if(this.confirmYDirection(this.leftBorder,this.rightBorder,this.targetYDown,Direction.Down))
        direcArr.push(Direction.Down);
    if(this.confirmXDirection(this.upBorder,this.downBorder,this.targetXLeft,Direction.Left))    
        direcArr.push(Direction.Left);
    if(this.confirmXDirection(this.upBorder,this.downBorder,this.targetXRight,Direction.Right))  
        direcArr.push(Direction.Right);
    if(direcArr.length == 0)
        direcArr.push(this.reverseDirection(this.currentDirection));
    var randomIndex = Math.floor(Math.random()*direcArr.length);
    var directionnum = direcArr[randomIndex];
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
    if(!this.isDead){
        var self = this;
        this.tempMoveStep = 0;
        this.moveInterval = setInterval(function(){
            self.game.monsterMeetRole();
            self.moveOneDirection(self.currentDirection);
        },1000/self.FPS);
    }
}

TDMonster.prototype.newDirection = function(moveStep){
    if(moveStep >= this.oneMoveStep){
        randomDirection = this.findDirection();
        if(randomDirection!=this.currentDirection){
            clearInterval(this.moveInterval);
            this.currentDirection = randomDirection;
            this.move();
        }
    }
}

TDMonster.prototype.moveOneDirection = function(directionnum){
    this.calculate();
    var randomDirection = -1;
    switch (directionnum) {
        case Direction.Up:
            if(this.isPositionPassable(this.leftBorder,this.targetYUp)&& this.isPositionPassable(this.rightBorder,this.targetYUp)){
                this.position.y += this.moveStep;
                this.tempMoveStep += this.moveStep;
                this.newDirection(this.tempMoveStep);
            }else{
                clearInterval(this.moveInterval);
                randomDirection = this.findDirection();
                this.currentDirection = randomDirection;
                this.move();
            }
        break;

        case Direction.Down:
            if(this.isPositionPassable(this.leftBorder,this.targetYDown) && this.isPositionPassable(this.rightBorder,this.targetYDown)){
                this.position.y -= this.moveStep;
                this.tempMoveStep += this.moveStep;
                this.newDirection(this.tempMoveStep);
            }else{
                clearInterval(this.moveInterval);
                randomDirection = this.findDirection();
                this.currentDirection = randomDirection;
                this.move();
            }
        break;

        case Direction.Left:
            if(this.isPositionPassable(this.targetXLeft, this.upBorder)&& this.isPositionPassable(this.targetXLeft,this.downBorder)){
                this.position.x -= this.moveStep;
                this.tempMoveStep += this.moveStep;
                this.newDirection(this.tempMoveStep);
            }else{
                clearInterval(this.moveInterval);
                randomDirection = this.findDirection();
                this.currentDirection = randomDirection;
                this.move();
            }
        break;

        case Direction.Right:
            if(this.isPositionPassable(this.targetXRight, this.upBorder) && this.isPositionPassable(this.targetXRight,this.downBorder)){
                this.position.x += this.moveStep;
                this.tempMoveStep += this.moveStep;
                this.newDirection(this.tempMoveStep);
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

    