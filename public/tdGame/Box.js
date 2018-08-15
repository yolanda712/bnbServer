var constants = require('./Const/GameConst');

var Box = function(boxType,position,map){
    this.boxType = boxType;
    this.position = position;
    this.map = map;
}

/**
 * 盒子爆炸
 * @param {Point} position 
 * @param {Array} boxArr 
 */
Box.prototype.boxBoom = function(boxArr){
    boxArr[this.position.x][this.position.y] = null;
    return this.creatItem();
}

/**
 * 是否生成礼物
 */
Box.prototype.calcItemPosibility = function(){
    return Math.round(Math.random());
}

/**
 * 生成礼物
 * @param {Point} position 当前位置
 * @param {number} itemArr 礼物类型编号
 */
Box.prototype.creatItem = function(){
    if(this.boxType == constants.GIFT_WALL && this.calcItemPosibility()){
        var itemCode = 101 + parseInt(Math.random()*3);
        this.map.setValue(this.position.x,this.position.y,itemCode);
        console.log("我是礼物！快乐的礼物 X"+this.position.x+"Y"+this.position.y+"itemCode"+itemCode);
        return ({x:this.position.x,y:this.position.y,itemCode:itemCode});
    }else{
        this.map.setValue(this.position.x,this.position.y,constants.GROUND);
        return null;
    }
}

module.exports = Box

