var Paopao = require('./Paopao')

var remove = function(Array,element){
    var elementIndex = Array.indexOf(element);
    if(elementIndex > -1){
        Array.splice(elementIndex, 1);
    }
};

var ObjectPool = function (){
    this.totalObjCount = 0;
    this.minCount = 8;
    this.ObjectPool={
        free:[],
        busy:[]
    };
    this.init();
}
/**
 * 从对象池中获取一个对象，当没有可用的对象时候创建新的对象
 * */
ObjectPool.prototype.getOne = function(role){
    if(this.ObjectPool.free.length > 0) {
        var obj = this.ObjectPool.free.pop();
    }else {
        var obj = new Paopao();
        this.totalObjCount++;
    }
    obj.configPaopao(role);
    this.ObjectPool.busy.push(obj);
    return obj;
};

//释放对象池中的对象
ObjectPool.prototype.freeOne = function(obj){
    var elementIndex = this.ObjectPool.busy.indexOf(obj);
    if(elementIndex > -1){
        remove(this.ObjectPool.busy,obj);
        this.ObjectPool.free.push(obj);
    }
    obj.isActive = true;
};

//销毁对象池，释放所有对象
ObjectPool.prototype.destroy = function(){
    this.ObjectPool.free.forEach(function(obj){
        obj = null;
    });
    this.ObjectPool.free = [];
    this.ObjectPool.busy.forEach(function(obj){
        obj = null;
    });
    this.ObjectPool.busy = [];
    this.totalObjCount = 0;
};

ObjectPool.prototype.init = function(){
        for(var i=this.totalObjCount; i<this.minCount; i++){
            var newObj = new Paopao();
            this.totalObjCount++;
            this.ObjectPool.free.push(newObj);
        }
};

module.exports = ObjectPool