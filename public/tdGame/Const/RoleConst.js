//人物被炸后死亡延迟时间
const ROLE_BOOM_DELAY = 3000;

//角色初始移动速度
const MOVE_STEP = 1.1;

//角色初始可放的泡泡数
const MAX_PAOPAO_COUNT = 2;

//泡泡的初始强度
const PAOPAO_POWER = 1;

//每个加速礼物的增加速度
const ITEM_MOVE_STEP = 0.2;

//角色可放泡泡数的最大限度
const LIMIT_PAOPAO_COUNT = 5;

//角色的最快移动速度
const LIMIT_MOVE_STEP = 2;

//角色泡泡的最大强度
const LIMIT_PAOPAO_POWER = 5;

//角色移动渲染频率
const ROLE_FPS = 90;

//用于辅助玩家操作，如果太大的话可能有bug最好不要超过role border
const THRESHOD = 14.9;

//用来检测旁边块是否可以移动
const ROLE_BODER = 14.9;

module.exports = {
    ROLE_BOOM_DELAY:ROLE_BOOM_DELAY,
    MOVE_STEP:MOVE_STEP,
    MAX_PAOPAO_COUNT:MAX_PAOPAO_COUNT,
    PAOPAO_POWER:PAOPAO_POWER,
    ITEM_MOVE_STEP:ITEM_MOVE_STEP,
    LIMIT_PAOPAO_COUNT:LIMIT_PAOPAO_COUNT,
    LIMIT_MOVE_STEP:LIMIT_MOVE_STEP,
    LIMIT_PAOPAO_POWER:LIMIT_PAOPAO_POWER,
    ROLE_FPS:ROLE_FPS,
    THRESHOD:THRESHOD,
    ROLE_BODER:ROLE_BODER
}