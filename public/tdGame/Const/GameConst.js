
const GROUND       = 0;

const NO_GIFT_WALL_1  = 1;
const NO_GIFT_WALL_2  = 2;
const GIFT_WALL  = 3;

const SOLID_WALL_1 = 11;
const SOLID_WALL_2 = 12;
const SOLID_WALL_3 = 13;

const PAOPAO       = 100;

const ITEM_ADD_PAOPAO = 101;
const ITEM_ADD_SPEED  = 102;
const ITEM_ADD_POWER  = 103;
const ITEM_ADD_SCORE  = 104;

const SCORE_FOR_WALL = 10;
const SCORE_FOR_MAN = 50;
const SCORE_FOR_MONSTER = 100;

const KEY_CODE = {
    W: 87,
    A: 65,
    S: 83,
    D: 68,
    J: 74
}

//物体移动方向枚举
const Direction = {
    None: -1,
    Up: 0,
    Down: 1,
    Left: 2,
    Right: 3
}

//前后端通信频率
const GAME_FPS =  30;

//游戏时间
const GAME_TIME  = 1200;

//泡泡爆炸延迟时间
const PAOPAO_BOOM_DELAY = 3000;

//泡泡对象池最小对象数
const MIN_OBJECT_COUNT = 8;

module.exports = {
    GROUND:GROUND,

    NO_GIFT_WALL_1:NO_GIFT_WALL_1,
    NO_GIFT_WALL_2:NO_GIFT_WALL_2,
    GIFT_WALL:GIFT_WALL,

    SOLID_WALL_1:SOLID_WALL_1,
    SOLID_WALL_2:SOLID_WALL_2,
    SOLID_WALL_3:SOLID_WALL_3,

    PAOPAO:PAOPAO,

    ITEM_ADD_PAOPAO:ITEM_ADD_PAOPAO,
    ITEM_ADD_POWER:ITEM_ADD_POWER,
    ITEM_ADD_SCORE:ITEM_ADD_SCORE,
    ITEM_ADD_SPEED:ITEM_ADD_SPEED,
    
    GAME_TIME:GAME_TIME,
    SCORE_FOR_WALL:SCORE_FOR_WALL,
    SCORE_FOR_MAN:SCORE_FOR_MAN,
    SCORE_FOR_MONSTER:SCORE_FOR_MONSTER,
    KEY_CODE:KEY_CODE,
    Direction:Direction,
    PAOPAO_BOOM_DELAY:PAOPAO_BOOM_DELAY,
    GAME_FPS:GAME_FPS,
    MIN_OBJECT_COUNT:MIN_OBJECT_COUNT
}