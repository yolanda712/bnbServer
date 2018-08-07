//Point位置对象
var Point = function (x, y) {
    //X轴坐标
    this.x = x;
    //Y轴坐标
    this.y = y;
}


Point.prototype.equals = function(point){
    if(this.x == point.x && this.y == point.y){
        return true;
    }
    return false;
}

Point.prototype.notEquals = function(point){
    if(this.x != point.x || this.y != point.y){
        return true;
    }
    return false;
}

Point.prototype.clone = function(){
    return new Point(this.x,this.y);
}

module.exports = Point