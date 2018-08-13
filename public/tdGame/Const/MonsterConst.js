//怪物移动渲染频率
const MONSTER_FPS = 90;

//怪物移动速度
const MOVE_STEP = 0.5;

//用于控制怪物每30像素重新选择方向
const ONE_MOVE_STEP = 30;

//用来检测旁边块是否可以移动
const MONSTER_BORDER = 15.9;

module.exports = {
    MONSTER_FPS:MONSTER_FPS,
    MOVE_STEP:MOVE_STEP,
    ONE_MOVE_STEP:ONE_MOVE_STEP,
    MONSTER_BORDER:MONSTER_BORDER
}