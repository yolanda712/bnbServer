var Point = require('./tdPoint')
var constants = require('./tdConst')
var Direction = constants.Direction;

var TDMonster = function(game){
    this.currentDirection = Direction.None;
    this.game = game;
    this.isDead = false;
    this.moveStep = 1;
    this.tdMap = null;
    this.position = new Point(0,0);
    this.FPS = 90;
    this.roleBorder = 15.9;

    this.moveInterval = null;
     
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
    leftBorder = this.position.x - this.roleBorder;
    rightBorder = this.position.x + this.roleBorder;
    downBorder = this.position.y - this.roleBorder;
    upBorder = this.position.y + this.roleBorder;
    targetYUp = this.position.y + this.roleBorder + this.moveStep;
    targetYDown = this.position.y - this.roleBorder - this.moveStep;
    targetXLeft = this.position.x - this.roleBorder - this.moveStep;
    targetXRight = this.position.x + this.roleBorder + this.moveStep;
    var direcArr = [];
    var self = this;
    if(this.isPositionPassable(leftBorder,targetYUp)&& this.isPositionPassable(rightBorder,targetYUp))
        direcArr.push(0);
    if(this.isPositionPassable(leftBorder,targetYDown) && this.isPositionPassable(rightBorder,targetYDown))
        direcArr.push(1);
    if(this.isPositionPassable(targetXLeft, upBorder)&& this.isPositionPassable(targetXLeft,downBorder))
        direcArr.push(2);
    if(this.isPositionPassable(targetXRight, upBorder) && this.isPositionPassable(targetXRight,downBorder))
        direcArr.push(3);
    var randomIndex = Math.floor(Math.random()*direcArr.length);
    var directionnum = direcArr[randomIndex];
    console.log('!!!!!!!directionnum'+directionnum);
    return directionnum;
}

TDMonster.prototype.move = function(){
    if(!this.isDead){
        var directionnum = this.findDirection();
        var self = this;
        this.moveInterval = setInterval(function(){
            self.touchRole();
            self.moveOneDirection(directionnum);
        },1000/self.FPS);
    }
}

TDMonster.prototype.moveOneDirection = function(directionnum){
    var leftBorder,rightBorder,upBorder,downBorder,targetYUp,targetYDown,targetXLeft,targetXRight;
    leftBorder = this.position.x - this.roleBorder;
    rightBorder = this.position.x + this.roleBorder;
    downBorder = this.position.y - this.roleBorder;
    upBorder = this.position.y + this.roleBorder;
    targetYUp = this.position.y + this.roleBorder + this.moveStep;
    targetYDown = this.position.y - this.roleBorder - this.moveStep;
    targetXLeft = this.position.x - this.roleBorder - this.moveStep;
    targetXRight = this.position.x + this.roleBorder + this.moveStep;
    switch (directionnum) {
        case Direction.Up:
            if(this.isPositionPassable(leftBorder,targetYUp)&& this.isPositionPassable(rightBorder,targetYUp)){
                this.position.y += this.moveStep;
                this.game.broadcastMsg('monsterInfo',{x:this.position.x,y:this.position.y});
                console.log("!!!!!!!!"+this.position.x+"!!!!!"+this.position.y);
            }else{
                clearInterval(this.moveInterval);
                this.move();
            }
        break;

        case Direction.Down:
            if(this.isPositionPassable(leftBorder,targetYDown) && this.isPositionPassable(rightBorder,targetYDown)){
                this.position.y -= this.moveStep;
                this.game.broadcastMsg('monsterInfo',{x:this.position.x,y:this.position.y});
                console.log("!!!!!!!!"+this.position.x+"!!!!!"+this.position.y);
            }else{
                clearInterval(this.moveInterval);
                this.move();
            }
        break;

        case Direction.Left:
            if(this.isPositionPassable(targetXLeft, upBorder)&& this.isPositionPassable(targetXLeft,downBorder)){
                this.position.x -= this.moveStep;
                this.game.broadcastMsg('monsterInfo',{x:this.position.x,y:this.position.y});
                console.log("!!!!!!!!"+this.position.x+"!!!!!"+this.position.y);
            }else{
                 clearInterval(this.moveInterval);
                 this.move();
            }
        break;

        case Direction.Right:
            if(this.isPositionPassable(targetXRight, upBorder) && this.isPositionPassable(targetXRight,downBorder)){
                this.position.x += this.moveStep;
                this.game.broadcastMsg('monsterInfo',{x:this.position.x,y:this.position.y});
                console.log("!!!!!!!!"+this.position.x+"!!!!!"+this.position.y);
            }else{
                clearInterval(this.moveInterval);
                this.move();
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
    clearInterval(this.moveInterval);
}

TDMonster.prototype.touchRole = function(){
    for(var rIndex=0; rIndex<this.game.roleArr.length; rIndex++){
        var curRole = this.game.roleArr[rIndex];
        curRole.touchMonster();
    }
}

module.exports = TDMonster;

    