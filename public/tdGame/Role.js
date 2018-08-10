var Point = require('./Point')
var constants = require('./Const')
var Direction = constants.Direction;


/**
 * Role类，用于控制游戏角色的所有操作
 *
 * @param {int} roleIndex 未来用于替换name
 * @param {string} name 角色名称 master or challenger
 * @param {tdGame} game 所属游戏
 * @param {object} userInfo 用户个人资料
 */
var Role = function(roleIndex,name,game,userInfo){
    this.FPS = constants.FPS.ROLE_FPS;
    this.name = name;
    this.nickName = userInfo.nickName;
    this.gender = userInfo.gender;
    this.avatarUrl = userInfo.avatarUrl;
    this.guid = userInfo.guid;

    this.roleIndex = roleIndex;
    this.game = game;
    this.Map = null;
    this.position = new Point(0,0);
    
    // threshold用于辅助玩家操作，如果太大的话可能有bug最好不要超过role border
    this.threshold = 14.9;

    // 用来检测旁边块是否可以移动
    this.roleBorder = 14.9;
    this.borderStep = 32;

    // 处理移动方向
    this.currentDirection = Direction.None;
    this.isKeyDown = false;
    this.currentAngle = 45;

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
    return this.Map;
}

Role.prototype.setMap = function(Map){
    this.Map = Map;
}

Role.prototype.setPosition = function(x, y){
    this.position.x = x;
    this.position.y = y;
}

Role.prototype.getPosition = function(){
    return this.position;
}

/**
 * 角色通过手机遥杆移动，通过开启interval不断移动角色
 *
 * @param {float}} angle
 * @returns
 */
Role.prototype.mobileMove = function(angle){
    if(Math.abs(this.currentAngle - angle) < 5 || Math.abs(this.currentAngle - angle) > 355){
        return;
    }else{
        var self = this;
        this.mobileStop();
    
        //移动线程
        this.moveInterval = setInterval(function() {
            self.mobileMoveOneStep(angle);
        }, 1000/self.FPS);

        this.currentAngle = angle;
    }
}

/**
 * 根据角度信息移动角色一步
 *
 * @param {float} angle
 */
Role.prototype.mobileMoveOneStep = function(angle){    
    angle = anglePreprocess(angle);
    var x_offset = Math.cos(angle * (Math.PI/180)) * this.moveStep;
    var y_offset = Math.sin(angle * (Math.PI/180)) * this.moveStep;

    var x_able = this.mobileCheckXOffset(x_offset, 0);
    var y_able = this.mobileCheckYOffset(y_offset, 0);
    if(Math.abs(x_offset)<0.1){
        x_able = false;
        x_offset = 0;
    } 
    if(Math.abs(y_offset)<0.1){
        y_able = false;
        y_offset = 0;
    }

    if(x_able && y_able){
        this.setPosition(this.position.x + x_offset, this.position.y + y_offset);
    }else if(x_able){
        this.setPosition(this.position.x + x_offset, this.position.y);
    }else if(y_able){
        this.setPosition(this.position.x, this.position.y + y_offset);
    }else{
        //threshold辅助玩家移动
        var mobileThreshold = this.threshold;
        if(x_offset && this.mobileCheckXOffset(x_offset,mobileThreshold)){
            var centerPoint = this.getNormPosition(this.position.x, this.position.y);
            this.setPosition(this.position.x + x_offset, centerPoint.y);
        }else if(y_offset && this.mobileCheckYOffset(y_offset, mobileThreshold)){
            var centerPoint = this.getNormPosition(this.position.x,this.position.y);
            this.setPosition(centerPoint.x, this.position.y + y_offset);
        }
    }
    
    // 吃道具检测
    if(this.isPositionAnItem(this.position.x,this.position.y)){
        var mapPosition = this.getMapLocation(this.position.x,this.position.y);
        this.getItem(mapPosition);
    }
}

/**
 * 检测角色是否可以沿X轴横向移动
 *
 * @param {float} x_offset
 * @param {float} threshold
 * @returns {boolean}
 */
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

/**
 * 检测是否可以沿Y轴纵向移动
 *
 * @param {float} y_offset
 * @param {float} threshold
 * @returns {boolean}
 */
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

/**
 * 停止移动角色
 *
 */
Role.prototype.mobileStop = function(){
    this.isKeyDown = false;
    this.currentDirection = Direction.None;
    clearInterval(this.moveInterval);
}

/**
 * 角色根据按键移动函数
 *
 * @param {int} directionnum
 * @returns
 */
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
        self.moveOneStep(directionnum);
    }, 1000/self.FPS);
}

Role.prototype.moveOneStep = function(directionnum){
    var threshold = this.threshold;
    switch (directionnum) {
        case Direction.Up:
            this.moveUpOneStep(threshold);
            break;
        case Direction.Down:
            this.moveDownOneStep(threshold);
            break;
        case Direction.Left:
            this.moveLeftOneStep(threshold);
            break;
        case Direction.Right:
            this.moveRightOneStep(threshold);
            break;
    };
}

Role.prototype.moveUpOneStep = function(threshold){
    var leftBorder = this.position.x - this.roleBorder;
    var rightBorder = this.position.x + this.roleBorder;
    var targetY = this.position.y + this.roleBorder + this.moveStep;
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
}

Role.prototype.moveDownOneStep = function(threshold){
    var leftBorder = this.position.x - this.roleBorder;
    var rightBorder = this.position.x + this.roleBorder;
    var targetY = this.position.y - this.roleBorder - this.moveStep;
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
}

Role.prototype.moveLeftOneStep = function(threshold){
    var downBorder = this.position.y - this.roleBorder;
    var upBorder = this.position.y + this.roleBorder;
    var targetX = this.position.x - this.roleBorder - this.moveStep;
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
}

Role.prototype.moveRightOneStep = function(threshold){
    var downBorder = this.position.y - this.roleBorder;
    var upBorder = this.position.y + this.roleBorder;
    var targetX = this.position.x + this.roleBorder + this.moveStep;
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

/**
 * 将角色坐标转化为地图index坐标 （32，32）-> （1，1）
 *
 * @param {int} x
 * @param {int} y
 * @returns {Point}
 */
Role.prototype.getMapLocation = function(x,y){
    var Map = this.getMap();
    if(Map ==null){
        console.log('map not set');
        return {}
    }
    return new Point(Map.getMapLocation(x,y).x, Map.getMapLocation(x,y).y);
}

/**
 * 判断某一位置是否可以通过
 *
 * @param {int} x
 * @param {int} y
 * @returns {boolean}
 */
Role.prototype.isPositionPassable = function(x,y){
    if(this.isDead) return false;
    var Map = this.getMap();
    var location = this.getMapLocation(x,y);
    // 如果要走的地方是个泡泡，且角色现在正处在泡泡上，则可以走
    if(Map.isPositionAPaopao(location.x,location.y)){
        roleCurLocation = this.getMapLocation(this.position.x,this.position.y);
        if(roleCurLocation.equals(location)){
            return true;
        }
    }
    return Map.isPositionPassable(location.x,location.y);
}

/**
 * 判断角色当前位置是否可以放泡泡
 *
 * @returns {boolean}
 */
Role.prototype.isPositionPaopaoAble = function(){
    if(this.isDead) return false;
    var Map = this.getMap();
    var location = this.getMapLocation(this.position.x,this.position.y);
    return Map.isPositionPassable(location.x,location.y);
}

/**
 * 判断某一位置是否是道具
 *
 * @param {int} x
 * @param {int} y
 * @returns {boolean}
 */
Role.prototype.isPositionAnItem = function(x,y){
    var Map = this.getMap();
    var location = this.getMapLocation(x,y);
    return Map.isPositionAnItem(location.x,location.y);
}

/**
 * 吃固定位置的道具
 * 
 * @param {Point} mapPosition
 */
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
        // var paopao = new Paopao(position,this.paopaoPower,this);
        var paopao = this.game.paopaoPool.getOne(this);
        if(!this.game.paopaoArr[position.x])
            this.game.paopaoArr[position.x]=[];
        this.game.paopaoArr[position.x][position.y] = paopao;

        paopaoCreatedInfo = {
            name:this.name,
            position:{
                x:position.x,
                y:position.y
            }
        }
        // console.log(paopaoCreatedInfo);
        this.game.broadcastMsg('paopaoCreated',paopaoCreatedInfo);
    }

}

Role.prototype.deletePaopao = function(paopao){
    this.curPaopaoCount--;
    this.game.paopaoArr[paopao.position.x][paopao.position.y] = null;
    this.game.paopaoPool.freeOne(paopao);
    paopao.clearBoomTimeout();
    // console.log(this.game.paopaoArr);
}

/**
 * 角色被炸到3秒后触发死亡
 *
 */
Role.prototype.roleBoom = function(){
    console.log('loser: '+this.name);
    var self = this;
    this.isDead = true;
    var roleBoomTime = setTimeout(function(){
        self.die();
    },constants.GAME_DELAY.ROLE_BOOM_DELAY);
    this.game.broadcastMsg("roleBoom",{x:this.position.x, y:this.position.y, role:this.name});
}

/**
 * 角色立即死亡
 *
 */
Role.prototype.die = function(){
    this.game.stopGame();
}

/**
 * 将角度进行模糊计算，利于玩家移动
 *
 * @param {float} angle
 * @returns {float} angle
 */
var anglePreprocess = function(angle){
    if(60<angle && angle<120) angle = 90;
    if(-35<angle && angle<35) angle = 0;
    if(145<angle || angle<-145) angle = 180;
    if(-120<angle && angle<-60) angle = -90;
    return angle;
}

module.exports = Role
