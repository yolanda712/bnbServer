var constants = require('./tdConst')

/**
 * 数组去重
 * @param {Array} arr 
 */
var uniquePosArray = function(arr){
    var hash = {};
    var base = 10000;
    var resultArr = [];
    for(var i=0; i<arr.length; i++){
        var obj = arr[i];
        key = base*obj.x+obj.y;
        // 去重
        if(hash[key]){
            continue;
        }
        hash[key] = 1;
        resultArr.push(obj);
    }
    return resultArr;
}

/**
 * 合并结果集
 * @param {Object} result 
 * @param {Object} calculateResult 
 */
var concatBoomResult = function(result, calculateResult){
    result.boomXYArr = uniquePosArray(result.boomXYArr.concat(calculateResult.boomXYArr));
    result.boomBoxArr = uniquePosArray(result.boomBoxArr.concat(calculateResult.boomBoxArr));
    result.boomPaopaoArr = uniquePosArray(result.boomPaopaoArr.concat(calculateResult.boomPaopaoArr));
}

var TDPaopao = function(position, power, role){
    this.isActive = true;
    this.position = position;
    this.power = power;
    this.role = role;
    this.map = this.role.getMap();
    this.map.setValue(position.x,position.y,constants.PAOPAO);
    this.game = this.role.game;
    console.log('paopao created at'+ this.position.x+","+this.position.y);
    var self = this;
    this.boomTimeout = setTimeout(function(){
        self.boom();
    },3000);

}

/**
 * 清除爆炸定时器
 */
TDPaopao.prototype.clearBoomTimeout = function(){
    clearTimeout(this.boomTimeout);
}

/**
 * 是否生成礼物
 */
TDPaopao.prototype.calcItemPosibility = function(){
    // return parseInt(Math.random());
    return 1;
}

/**
 * 泡泡爆炸
 */
TDPaopao.prototype.boom = function(){
    console.log('paopao boom  at'+this.position.x+","+this.position.y);
    var result = this.findPaopaoBombXY(this.position);
    var boomPaopaoArr = result.boomPaopaoArr;
    var boomXYArr = result.boomXYArr;
    var boomBoxArr = result.boomBoxArr;
    var itemArr = [];
    // 终止泡泡爆炸动画
    for(var i=0; i<boomPaopaoArr.length; i++){
        var pos = boomPaopaoArr[i];
        var paopao = this.game.paopaoArr[pos.x][pos.y];
        if(paopao)
            paopao.role.deletePaopao(paopao);
    }
    for(var i=0; i<boomXYArr.length; i++){
        var pos = boomXYArr[i];
        //道具是否被炸掉
        this.isItemBoomed(pos);
        //角色是否被炸死
        this.isRoleBoomed(pos);
        //怪物是否被炸死
        this.isMonsterBoomed(pos);

    }
    // 生成道具
    for(var i=0; i<boomBoxArr.length; i++){
        var pos = boomBoxArr[i];
        this.creatItem(pos,itemArr);
    }
    result['itemArr'] = itemArr;
    console.log(result);
    var game = this.game;
    game.broadcastMsg("boomInfo",result);

};

/**
 * 计算泡泡的爆炸范围
 * @param {tdPoint} currentMapLocation 泡泡的位置
 * @return {Object} result 爆炸范围
 */
TDPaopao.prototype.findPaopaoBombXY = function(currentMapLocation){
    if(this.isActive){
        this.isActive = false;
        var boomXYArr = [];
        var boomBoxArr = [];
        var boomPaopaoArr = [];
        var result = {
            boomXYArr:boomXYArr,
            boomBoxArr:boomBoxArr,
            boomPaopaoArr:boomPaopaoArr
        };
        //是否可以前进
        var canGo = {Up : true, Down : true, Left : true, Right : true};
        result.boomXYArr.push({x:currentMapLocation.x, y:currentMapLocation.y});
        result.boomPaopaoArr.push({x:currentMapLocation.x, y:currentMapLocation.y});

        for(var i=1; i<=this.power; i++){
            //向左
            if(currentMapLocation.y-i >= 0 ){
                if(canGo.Left){
                    var calcX = currentMapLocation.x;
                    var caclY = currentMapLocation.y-i;
                    var leftResult = this.oneDirectionBombArea(calcX,caclY,canGo,"Left");
                    //合并计算结果
                    concatBoomResult(result, leftResult);
                }
            }
            //向右
            if(currentMapLocation.y+i < this.map.getXLen()){
                if(canGo.Right){
                    var calcX = currentMapLocation.x;
                    var caclY = currentMapLocation.y+i;
                    var rightResult = this.oneDirectionBombArea(calcX,caclY,canGo,"Right");
                    //合并计算结果
                    concatBoomResult(result, rightResult);
                }
            }
            //向上
            if(currentMapLocation.x-i >= 0){
                if(canGo.Up){
                    var calcX = currentMapLocation.x-i;
                    var caclY = currentMapLocation.y;
                    var upResult = this.oneDirectionBombArea(calcX,caclY,canGo,"Up");
                    //合并计算结果
                    concatBoomResult(result, upResult);
                }
            }
            //向下
            if(currentMapLocation.x+i < this.map.getYLen()){
                if(canGo.Down){
                    var calcX = currentMapLocation.x+i;
                    var caclY = currentMapLocation.y;
                    var downResult = this.oneDirectionBombArea(calcX,caclY,canGo,"Down");
                    //合并计算结果
                    concatBoomResult(result, downResult);
                }
            }
        }
        return result;
    }else{
        return null;
    }
}

/**
 * 计算泡泡在某方向的爆炸范围
 * @param {number} calcX 目标位置的X坐标
 * @param {number} caclY 目标位置的Y坐标
 * @param {Object} canGo 是否可以前进
 * @param {String} direction 移动方向
 * @return {Object} {boomXYArr:boomXYArr,boomBoxArr:boomBoxArr,boomPaopaoArr:boomPaopaoArr}爆炸范围
 */
TDPaopao.prototype.oneDirectionBombArea = function(calcX,caclY,canGo,direction){
    var boomXYArr = [];
    var boomBoxArr = [];
    var boomPaopaoArr = [];

    mapValue = this.map.getValue(calcX,caclY);
    if(0 < mapValue && mapValue < 4){
        canGo[direction] = false;
        //处理箱子爆炸 先不随机刷礼物 最后再统一刷礼物
        boomBoxArr.push({x:calcX, y:caclY});
        //炸掉盒子的得分
        this.role.score += constants.SCORE_FOR_WALL;
    }else if(4 <= mapValue && mapValue < 100){
        canGo[direction] = false;
        //无法被炸毁的东西，直接过
    }else if(mapValue == 100){
        canGo[direction] = false;
        //如果旁边是泡泡，将该泡泡的爆炸区域合并到现在的泡泡中
        var nextPaopao = this.game.paopaoArr[calcX][caclY];
        var nextResult = nextPaopao.findPaopaoBombXY({x:calcX,y:caclY});
        if(nextResult){
            boomXYArr = uniquePosArray(boomXYArr.concat(nextResult.boomXYArr));
            boomBoxArr = uniquePosArray(boomBoxArr.concat(nextResult.boomBoxArr));
            boomPaopaoArr = uniquePosArray(boomPaopaoArr.concat(nextResult.boomPaopaoArr));
        }
    }else{
        boomXYArr.push({x:calcX, y:caclY});
    }
    return {boomXYArr:boomXYArr,boomBoxArr:boomBoxArr,boomPaopaoArr:boomPaopaoArr};
}

/**
 * 人物是否被炸到
 * @param {tdPoint} position 当前位置
 */
TDPaopao.prototype.isRoleBoomed = function(position){
    for(var rIndex=0; rIndex<this.game.roleArr.length; rIndex++){
        var curRole = this.game.roleArr[rIndex];
        var roleMapPos = curRole.getMapLocation(curRole.position.x, curRole.position.y);
        if(roleMapPos.equals(position)){
            //人物被炸到
            curRole.roleBoom();
        }
    }
}

/**
 * 怪物是否被炸到
 * @param {tdPoint} position 当前位置
 */
TDPaopao.prototype.isMonsterBoomed = function(position){
    for(var mIndex=0; mIndex<this.game.monsterArr.length; mIndex++){
        var curMonster = this.game.monsterArr[mIndex];
        var monsterMapPos = curMonster.getMapLocation(curMonster.position.x,curMonster.position.y);
        if(monsterMapPos.equals(position)){
            //炸掉小怪物的得分
            this.role.score += constants.SCORE_FOR_MONSTER;
            //怪物被炸
            curMonster.die();
        }
    }
}

/**
 * 礼物是否被炸掉
 * @param {tdPoint} position 当前位置
 */
TDPaopao.prototype.isItemBoomed = function(position){
    if(this.map.isPositionAnItem(position.x,position.y)){
        console.log("itemEaten"+ position);
        //礼物被炸掉
        this.game.broadcastMsg("itemEaten",{x:position.x,y:position.y,role:'null'});
    }
    this.map.setValue(position.x,position.y,constants.GROUND);
}

/**
 * 生成礼物
 * @param {tdPoint} position 当前位置
 * @param {number} itemArr 礼物类型编号
 */
TDPaopao.prototype.creatItem = function(position,itemArr){
    if(this.map.getValue(position.x,position.y)==constants.GIFT_WALL && this.calcItemPosibility()){
        var itemCode = 101 + parseInt(Math.random()*3);
        this.map.setValue(position.x,position.y,itemCode);
        itemArr.push({x:position.x,y:position.y,itemCode:itemCode});
    }else{
        this.map.setValue(position.x,position.y,constants.GROUND);
    }
}

module.exports = TDPaopao