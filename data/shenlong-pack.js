import { story } from './story.js';

export const shenlongPack = {
  id: 'shenlong',
  title: '男皇后：戏台浮梦',
  stats: {
    beardBone: '须眉骨',
    rougeFace: '红粉相',
    favor: '大王好感度',
    mask: '面具值',
    feminine: '女妆值'
  },
  statOrder: ['beardBone', 'rougeFace', 'favor', 'mask', 'feminine'],
  initialState: {
    currentNode: 'start',
    beardBone: 0,
    rougeFace: 0,
    favor: 0,
    mask: 0,
    feminine: 0
  },
  endingTransition: {
    act: '终幕',
    title: '戏台之下',
    lines: [
      '镜头突然脱离第一人称，以极快速度向后上方拉远。',
      '原本2D人物立绘，变成巨大黑色空间里的纸片人。',
      '镜头继续拉远，露出一个孤零零亮着灯的戏台；台下是无数没有面目的黑色人影。',
      '大王（临川王）：“在这几抹胭脂色的春光里，明月又转过了树梢。”',
      '莫笑台中雌雄假，看客同是梦里人。'
    ],
    continueText: '看清此局'
  },
  nodes: story
};
