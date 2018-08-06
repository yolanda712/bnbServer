var Point = require('./tdPoint')
var constants = require('./tdConst')
var Direction = constants.Direction;

var TDMonster = function(monsterIndex,name,game){
    this.currentDirection = Direction.None;
    this.game = game;
    this.tdMap = null;
    this.position = new Point(0,0);
    this.FPS = 90;
    this.monsterIndex = monsterIndex;
    this.name = name;
    //判断怪物是否死亡
    this.isDead = false;
    //怪物每步的移动距离
    this.moveStep = 0.5;
    //怪物移动Interval
    this.moveInterval = null;
    //用于怪物每一大步后改变方向
    this.oneMoveStep = 30;
    this.tempMoveStep = 0;
    //怪物的边界
    this.monsterBorder = 15.9;
    this.leftBorder = 0;
    this.rightBorder = 0;
    this.upBorder = 0;
    this.downBorder = 0;
    //怪物移动的目标位置
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

/**
 * 小怪物移动
 */
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

TDMonster.prototype.moveOneDirection = function(directionnum){
    this.calculate();
    var randomDirection = -1;
    switch (directionnum) {
        //向上
        case Direction.Up:
            if(this.isPositionPassable(this.leftBorder,this.targetYUp)&& this.isPositionPassable(this.rightBorder,this.targetYUp)){
                this.position.y += this.moveStep;
                this.tempMoveStep += this.moveStep;
                this.chooseNewDirection(this.tempMoveStep);
            }else{
                randomDirection = this.findRandomDirection();
                this.startNewMovInterval(randomDirection);
            }
        break;
        //向下
        case Direction.Down:
            if(this.isPositionPassable(this.leftBorder,this.targetYDown) && this.isPositionPassable(this.rightBorder,this.targetYDown)){
                this.position.y -= this.moveStep;
                this.tempMoveStep += this.moveStep;
                this.chooseNewDirection(this.tempMoveStep);
            }else{
                randomDirection = this.findRandomDirection();
                this.startNewMovInterval(randomDirection);
            }
        break;
        //向左
        case Direction.Left:
            if(this.isPositionPassable(this.targetXLeft, this.upBorder)&& this.isPositionPassable(this.targetXLeft,this.downBorder)){
                this.position.x -= this.moveStep;
                this.tempMoveStep += this.moveStep;
                this.chooseNewDirection(this.tempMoveStep);
            }else{
                randomDirection = this.findRandomDirection();
                this.startNewMovInterval(randomDirection);
            }
        break;
        //向右
        case Direction.Right:
            if(this.isPositionPassable(this.targetXRight, this.upBorder) && this.isPositionPassable(this.targetXRight,this.downBorder)){
                this.position.x += this.moveStep;
                this.tempMoveStep += this.moveStep;
                this.chooseNewDirection(this.tempMoveStep);
            }else{
                randomDirection = this.findRandomDirection();
                this.startNewMovInterval(randomDirection);
            }
        break;
    }
}

/**
 * 寻找一个随机的可行方向
 */
TDMonster.prototype.findRandomDirection = function(){
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

/**
 * 计算当前运动方向的相反方向
 */
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

TDMonster.prototype.chooseNewDirection = function(moveStep){
    //当怪物在一个方向的移动距离超过oneMoveStep时，随机寻找新方向
    if(moveStep >= this.oneMoveStep){
        randomDirection = this.findRandomDirection();
        if(randomDirection!=this.currentDirection){
            //开启一个新的移动线程
            this.startNewMovInterval(randomDirection);
        }
    }
}

TDMonster.prototype.startNewMovInterval = function(randomDirection){
    clearInterval(this.moveInterval);
    this.currentDirection = randomDirection;
    this.move();
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

TDMonster.prototype.isPositionPassable = function(x,y){
    if(this.isDead) return false;
    var tdMap = this.getMap();
    var location = this.getMapLocation(x,y);
    return tdMap.isPositionPassable(location.x,location.y);
}

/**
 * 怪物死亡
 */
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

    