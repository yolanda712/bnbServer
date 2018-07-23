var constants = require('./tdConst')

var GROUND = constants.GROUND;
var NG_W_1 = constants.NO_GIFT_WALL_1;
var NG_W_2 = constants.NO_GIFT_WALL_2;
var G_W = constants.GIFT_WALL;

var S_W_1 = constants.SOLID_WALL_1;
var S_W_2 = constants.SOLID_WALL_2;
var S_W_3 = constants.SOLID_WALL_3;

var PAOPAO = constants.PAOPAO;

var I_PAOPAO = constants.ITEM_ADD_PAOPAO;
var I_POWER = constants.ITEM_ADD_POWER;
var I_SCORE = constants.ITEM_ADD_SCORE;
var I_SPEED = constants.ITEM_ADD_SPEED;

//背景地图
var backGroundMap = [ 
    [  S_W_1,  S_W_1,  S_W_1,  S_W_1,  S_W_1,  S_W_1,  S_W_1,  S_W_1,  S_W_1,  S_W_1,  S_W_1,  S_W_1,  S_W_1 ], 
    [  S_W_1, GROUND, GROUND,    G_W, GROUND, GROUND, GROUND, GROUND, GROUND,    G_W, GROUND, GROUND,  S_W_1 ],
    [  S_W_1, GROUND,  S_W_1,    G_W,  S_W_1,    G_W,  S_W_1,    G_W,  S_W_1,    G_W,  S_W_1, GROUND,  S_W_1 ],
    [  S_W_1, GROUND, GROUND,    G_W, GROUND, GROUND, GROUND, GROUND, GROUND,    G_W,    G_W, GROUND,  S_W_1 ],
    [  S_W_1, GROUND,  S_W_1,    G_W,  S_W_1,    G_W,  S_W_1,    G_W,  S_W_1,    G_W,  S_W_1, GROUND,  S_W_1 ],
    [  S_W_1, GROUND, GROUND,    G_W, GROUND, GROUND, GROUND, GROUND, GROUND,    G_W, GROUND, GROUND,  S_W_1 ],
    [  S_W_1, GROUND,  S_W_1,    G_W,  S_W_1,    G_W,  S_W_1,    G_W,  S_W_1,    G_W,  S_W_1, GROUND,  S_W_1 ],
    [  S_W_1, GROUND,    G_W,    G_W, GROUND, GROUND, GROUND, GROUND, GROUND,    G_W, GROUND, GROUND,  S_W_1 ],
    [  S_W_1, GROUND,  S_W_1,    G_W,  S_W_1,    G_W,  S_W_1,    G_W,  S_W_1,    G_W,  S_W_1, GROUND,  S_W_1 ],
    [  S_W_1, GROUND, GROUND,    G_W, GROUND, GROUND, GROUND, GROUND, GROUND,    G_W, GROUND, GROUND,  S_W_1 ],
    [  S_W_1,  S_W_1,  S_W_1,  S_W_1,  S_W_1,  S_W_1,  S_W_1,  S_W_1,  S_W_1,  S_W_1,  S_W_1,  S_W_1,  S_W_1 ]
 ];

 var roleStartPointArr = [
     {x:9, y:1},
     {x:1, y:11},
 ]

 var copyMap = function(mapArr){
    var newMap = [];
    for(var i=0; i<mapArr.length; i++){
        newMap.push(mapArr[i].concat());
    }
    return newMap;
 }



 var TDMap = function(mapName){
    this.mapName = mapName;
    this.map = copyMap(backGroundMap);
    this.roleStartPointArr = roleStartPointArr.concat();
 }

TDMap.prototype.getXLen = function(){
    return this.map[0].length;
}

TDMap.prototype.getYLen = function(){
    return this.map.length;
}

TDMap.prototype.getValue = function(x,y){
    return this.map[x][y];
}

TDMap.prototype.setValue = function(x,y,value){
    this.map[x][y] = value;
}

TDMap.prototype.isPositionPassable = function(x,y){
    if(this.getValue(x,y)==0 || this.getValue(x,y)>100) return true;
    return false;
}

TDMap.prototype.isPositionAnItem = function(x,y){
    if(this.getValue(x,y)>100) return true;
    return false;
}

TDMap.prototype.isPositionAPaopao = function(x,y){
    if(this.getValue(x,y)==100) return true;
    return false;
}

TDMap.prototype.getMapLocation = function(x,y){

    xIndex = Math.round(x/32);
    yIndex = Math.round(y/32);
    return {x: this.getYLen()-1-yIndex, y: xIndex};
}

 module.exports = TDMap;
