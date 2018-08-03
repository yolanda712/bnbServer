var Point = require('./tdPoint')
var TDPaopao = require('./tdPaopao')
var constants = require('./tdConst')
var Direction = constants.Direction;


var Role = function(roleIndex,name,game,userInfo){

    this.FPS = 90;
    this.nickName = userInfo.nickName;
    this.gender = userInfo.gender;
    this.avatarUrl = userInfo.avatarUrl;
    this.guid = userInfo.guid;

    this.currentDirection = Direction.None;
    this.isKeyDown = false;

    this.roleIndex = roleIndex;
    this.name = name;
    this.game = game;
    this.position = new Point(0,0);
    
    // threshold用于辅助玩家操作，如果太大的话可能有bug最好不要超过role border的一半，或者movestep的2倍
    this.threshold = 14.9;

    //用来检测旁边块是否可以移动
    this.roleBorder = 14.9;
    this.borderStep = 32;

    this.tdMap = null;

    //角色初始信息设置
    //移动步伐大小
    this.moveStep = 1.3;
    this.maxPaopaoCount = 2;
    this.curPaopaoCount = 0;
    this.paopaoPower = 1;
    this.score = 0;
    this.itemMoveStep = 0.3;

    //最大道具限制
    this.limitPaopaoCount = 5;
    this.limitMoveStep = 2;
    this.limitPaopaoPower = 5;

    //角色是否死亡
    this.isDead = false;
    //角色移动Interval
    this.moveInterval = 0;
}

Role.prototype.getMap = function(){
    return this.tdMap;
}

Role.prototype.setMap = function(tdMap){
    this.tdMap = tdMap;
}

Role.prototype.setPosition = function(x, y){
    this.position.x = x;
    this.position.y = y;
}

Role.prototype.getPosition = function(){
    return this.position;
}

//角色通过手机遥感移动
Role.prototype.mobileMove = function(angle){
    var self = this;
    this.mobileStop();

    //移动线程
    this.moveInterval = setInterval(function() {
        // console.log('move');
        self.mobileMoveOneStep(angle);
    }, 1000/self.FPS);
}

Role.prototype.mobileMoveOneStep = function(angle){
    // 角度模糊判断
    if(60<angle && angle<120) angle = 90;
    if(-35<angle && angle<35) angle = 0;
    if(145<angle || angle<-145) angle = 180;
    if(-120<angle && angle<-60) angle = -90;

    var x_offset = Math.cos(angle * (Math.PI/180)) * this.moveStep;
    var y_offset = Math.sin(angle * (Math.PI/180)) * this.moveStep;

    var x_able = false;
    var y_able = false;
    // 为了实现threshold，将极微小的移动置为无法移动
    if(-0.1<x_offset && x_offset<0.1){
        x_offset = 0;
    } else{
        x_able = this.mobileCheckXOffset(x_offset,0);
    }
    if(-0.1<y_offset && y_offset<0.1){
        y_offset = 0;
    } else{
        y_able = this.mobileCheckYOffset(y_offset,0);
    }

    if(x_able && y_able){
        this.setPosition(this.position.x+x_offset, this.position.y+y_offset);
    }else if(x_able){
        this.setPosition(this.position.x+x_offset, this.position.y);
    }else if(y_able){
        this.setPosition(this.position.x, this.position.y+y_offset);
    }else{
        //threshold辅助玩家移动
        var mobileThreshold = this.threshold;
        if(x_offset && this.mobileCheckXOffset(x_offset,mobileThreshold)){
            this.setPosition(this.position.x+x_offset, this.getNormPosition(this.position.x,this.position.y).y);
        }else if(y_offset && this.mobileCheckYOffset(y_offset,mobileThreshold)){
            this.setPosition(this.getNormPosition(this.position.x,this.position.y).x, this.position.y+y_offset);
        }
    }
    
    // 吃道具检测
    if(this.isPositionAnItem(this.position.x,this.position.y)){
        var mapPosition = this.getMapLocation(this.position.x,this.position.y);
        this.getItem(mapPosition);
    }

}

// 检测是否可以沿X轴横向移动
Role.prototype.mobileCheckXOffset = function(x_offset, threshold){
    var movedPos = new Point(this.position.x + x_offset, this.position.y);
    if(x_offset>0){
        var rightTopPos = new Point(movedPos.x + this.roleBorder, movedPos.y + this.roleBorder - threshold);
        var rightBottomPos = new Point(movedPos.x + this.roleBorder, movedPos.y - this.roleBorder + threshold);
        if(this.isPositionPassable(rightTopPos.x,rightTopPos.y)
            && this.isPositionPassable(rightBottomPos.x,rightBottomPos.y)){
                return true;
        }
        return false;
    }else{
        var leftTopPos = new Point(movedPos.x - this.roleBorder, movedPos.y + this.roleBorder - threshold);
        var leftBottomPos = new Point(movedPos.x - this.roleBorder, movedPos.y - this.roleBorder + threshold);
        if(this.isPositionPassable(leftTopPos.x,leftTopPos.y) 
            && this.isPositionPassable(leftBottomPos.x,leftBottomPos.y)){
                return true;
        }
        return false;
    }
}

// 检测是否可以沿Y轴纵向移动
Role.prototype.mobileCheckYOffset = function(y_offset, threshold){
    var movedPos = new Point(this.position.x, this.position.y + y_offset);

    if(y_offset>0){
        var leftTopPos = new Point(movedPos.x - this.roleBorder + threshold, movedPos.y + this.roleBorder);
        var rightTopPos = new Point(movedPos.x + this.roleBorder - threshold, movedPos.y + this.roleBorder);
        if(this.isPositionPassable(leftTopPos.x,leftTopPos.y) 
            && this.isPositionPassable(rightTopPos.x,rightTopPos.y)){
                return true;
        }
        return false;
    }else{
        var leftBottomPos = new Point(movedPos.x - this.roleBorder + threshold, movedPos.y - this.roleBorder);
        var rightBottomPos = new Point(movedPos.x + this.roleBorder - threshold, movedPos.y - this.roleBorder);
        if(this.isPositionPassable(leftBottomPos.x,leftBottomPos.y)
            && this.isPositionPassable(rightBottomPos.x,rightBottomPos.y)){
                return true;
        }
        return false;
    }
}

Role.prototype.mobileStop = function(){
    this.isKeyDown = false;
    this.currentDirection = Direction.None;
    clearInterval(this.moveInterval);
}

//角色移动函数
Role.prototype.move = function(directionnum) {
    if (directionnum < 0 || directionnum > 3) return;
    // this.Stop();
    if(directionnum==this.currentDirection &&
        this.isKeyDown) return;
    
    this.stop();

    this.currentDirection = directionnum;
    this.isKeyDown = true;
    
    var self = this;

    //移动线程
    this.moveInterval = setInterval(function() {
        // console.log('move');
        self.moveOneStop(directionnum);
    }, 1000/self.FPS);
}

Role.prototype.moveOneStop = function(directionnum){
    // console.log(this.getMapLocation(this.position.x,this.position.y));
    var leftBorder,rightBorder,upBorder,downBorder;
    var targetX,targetY;
    var threshold = this.threshold;
    switch (directionnum) {
        case Direction.Up:
            leftBorder = this.position.x - this.roleBorder;
            rightBorder = this.position.x + this.roleBorder;
            targetY = this.position.y + this.roleBorder + this.moveStep;
            // threshold检测
            if(this.isPositionPassable(leftBorder+threshold,targetY)
                && this.isPositionPassable(rightBorder-threshold,targetY)){
                this.position.y += this.moveStep;
                if(!this.isPositionPassable(leftBorder,targetY)
                    || !this.isPositionPassable(rightBorder,targetY)){
                    this.position.x = this.getNormPosition(this.position.x,this.position.y).x;
                }
                // 吃道具检测
                if(this.isPositionAnItem(this.position.x,this.position.y)){
                    var mapPosition = this.getMapLocation(this.position.x,this.position.y);
                    this.getItem(mapPosition);
                }
            }
            break;
        case Direction.Down:
            leftBorder = this.position.x - this.roleBorder;
            rightBorder = this.position.x + this.roleBorder;
            targetY = this.position.y - this.roleBorder - this.moveStep;
            if(this.isPositionPassable(leftBorder+threshold,targetY)
                && this.isPositionPassable(rightBorder-threshold,targetY)){
                this.position.y -= this.moveStep;
                if(!this.isPositionPassable(leftBorder,targetY)
                    || !this.isPositionPassable(rightBorder,targetY)){
                    this.position.x = this.getNormPosition(this.position.x,this.position.y).x;
                }
                if(this.isPositionAnItem(this.position.x,this.position.y)){
                    var mapPosition = this.getMapLocation(this.position.x,this.position.y);
                    this.getItem(mapPosition);
                }
            }
            break;
        case Direction.Left:
            downBorder = this.position.y - this.roleBorder;
            upBorder = this.position.y + this.roleBorder;
            targetX = this.position.x - this.roleBorder - this.moveStep;
            if(this.isPositionPassable(targetX, upBorder-threshold)
                && this.isPositionPassable(targetX,downBorder+threshold)){
                this.position.x -= this.moveStep;
                if(!this.isPositionPassable(targetX, upBorder)
                    || !this.isPositionPassable(targetX,downBorder)){
                    this.position.y = this.getNormPosition(this.position.x,this.position.y).y;
                }
                if(this.isPositionAnItem(this.position.x,this.position.y)){
                    var mapPosition = this.getMapLocation(this.position.x,this.position.y);
                    this.getItem(mapPosition);
                }
            }
            break;
        case Direction.Right:
            downBorder = this.position.y - this.roleBorder;
            upBorder = this.position.y + this.roleBorder;
            targetX = this.position.x + this.roleBorder + this.moveStep;
            if(this.isPositionPassable(targetX, upBorder-threshold)
                && this.isPositionPassable(targetX,downBorder+threshold)){
                this.position.x += this.moveStep;
                if(!this.isPositionPassable(targetX, upBorder)
                    || !this.isPositionPassable(targetX,downBorder)){
                    this.position.y = this.getNormPosition(this.position.x,this.position.y).y;
                }
                if(this.isPositionAnItem(this.position.x,this.position.y)){
                    var mapPosition = this.getMapLocation(this.position.x,this.position.y);
                    this.getItem(mapPosition);
                }
            }
            break;
    };
}
    
//停止移动
Role.prototype.stop = function(directionnum) {
    // console.log('stop');
    if(directionnum != null){
        if(directionnum != this.currentDirection)
            return;
    }
    this.isKeyDown = false;
    this.currentDirection = Direction.None;
    clearInterval(this.moveInterval);
}

Role.prototype.getMapLocation = function(x,y){
    var tdMap = this.getMap();
    if(tdMap ==null){
        console.log('map not set');
        return {}
    }
    return new Point(tdMap.getMapLocation(x,y).x, tdMap.getMapLocation(x,y).y);
}

Role.prototype.isPositionPassable = function(x,y){
    if(this.isDead) return false;
    var tdMap = this.getMap();
    var location = this.getMapLocation(x,y);
    // 如果要走的地方是个泡泡，且角色现在正处在泡泡上，则可以走
    if(tdMap.isPositionAPaopao(location.x,location.y)){
        roleCurLocation = this.getMapLocation(this.position.x,this.position.y);
        if(roleCurLocation.equals(location)){
            return true;
        }
    }
    return tdMap.isPositionPassable(location.x,location.y);
}

Role.prototype.isPositionPaopaoAble = function(){
    if(this.isDead) return false;
    var tdMap = this.getMap();
    var location = this.getMapLocation(this.position.x,this.position.y);
    return tdMap.isPositionPassable(location.x,location.y);
}

Role.prototype.isPositionAnItem = function(x,y){
    var tdMap = this.getMap();
    var location = this.getMapLocation(x,y);
    return tdMap.isPositionAnItem(location.x,location.y);
}

Role.prototype.getItem = function(mapPosition){
    var itemCode = this.getMap().getValue(mapPosition.x,mapPosition.y);
    this.getMap().setValue(mapPosition.x,mapPosition.y,constants.GROUND);
    this.game.broadcastMsg("itemEaten",{x:mapPosition.x,y:mapPosition.y,role:this.name,itemCode:itemCode});

    if(itemCode == constants.ITEM_ADD_PAOPAO && this.maxPaopaoCount<this.limitPaopaoCount) this.maxPaopaoCount++;
    else if(itemCode == constants.ITEM_ADD_POWER && this.paopaoPower<this.limitPaopaoPower) this.paopaoPower++;
    else if(itemCode == constants.ITEM_ADD_SPEED && this.moveStep<this.limitMoveStep) this.moveStep+=this.itemMoveStep;
    else if(itemCode == constants.ITEM_ADD_SCORE) this.score+=500;
}


// 计算一个点所对应的地图块中心点坐标
Role.prototype.getNormPosition = function(x,y){
    return new Point(Math.round(x/32)*32, Math.round(y/32)*32);
}

Role.prototype.createPaopao = function(){
    var position = this.getMapLocation(this.position.x,this.position.y);
    if(this.isPositionPaopaoAble(this.position.x,this.position.y) 
       && this.curPaopaoCount<this.maxPaopaoCount){
        this.curPaopaoCount++;
        var paopao = new TDPaopao(position,this.paopaoPower,this);

        if(!this.game.paopaoArr[position.x])
            this.game.paopaoArr[position.x]=[];
        this.game.paopaoArr[position.x][position.y] = paopao;
        // console.log(this.game.paopaoArr);

        paopaoCreatedInfo = {
            name:this.name,
            position:{
                x:position.x,
                y:position.y
            }
        }
        console.log(paopaoCreatedInfo);
        this.game.broadcastMsg('paopaoCreated',paopaoCreatedInfo);
    }

}

Role.prototype.deletePaopao = function(paopao){
    this.curPaopaoCount--;
    this.game.paopaoArr[paopao.position.x][paopao.position.y] = null;
    paopao.clearBoomTimeout();
    // delete paopao;
    console.log(this.game.paopaoArr);
}

Role.prototype.roleBoom = function(){
    console.log('loser: '+this.name);
    var self = this;
    this.isDead = true;
    var roleBoomTime = setTimeout(function(){
        self.die();
    },3000);
    this.game.broadcastMsg("roleBoom",{x:this.position.x, y:this.position.y, role:this.name});
}

Role.prototype.die = function(){
    // console.log('loser: '+this.name);
    this.game.stopGame();
}

module.exports = Role
