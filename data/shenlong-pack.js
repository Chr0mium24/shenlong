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
  presentation: {
    linePacing: {
      narrationMs: 1200,
      dialogueMs: 1650,
      verseMs: 1850,
      noteMs: 1400,
      fadeMs: 260
    },
    endingTransition: {
      durationMs: 4200
    },
    cast: [
      {
        id: 'king',
        name: '大王',
        aliases: ['临川王'],
        portrait: '/portraits/king.svg'
      },
      {
        id: 'zigao',
        name: '陈子高',
        aliases: ['子高', '嫂嫂'],
        portrait: '/portraits/zigao.svg'
      },
      {
        id: 'princess',
        name: '玉华公主',
        aliases: ['公主'],
        portrait: '/portraits/princess.svg'
      },
      {
        id: 'general',
        name: '将军',
        aliases: [],
        portrait: '/portraits/general.svg'
      }
    ]
  },
  endingTransition: {
    act: '终幕',
    title: '戏台之下',
    durationMs: 4200,
    lines: [
      '利用一种类似第一人称飞行器（FPV）急速拉远的空间感，把你从沉浸式2D对话中强行拽出，展现戏台本质。',
      '[游戏画面与脚本] 大王（临川王）：在这几抹胭脂色的春光里，明月又转过了树梢。',
      '镜头突然脱离第一人称，以极快速度向后上方拉远。',
      '原本2D人物立绘，变成巨大黑色空间里的纸片人。',
      '镜头继续拉远，露出一个孤零零亮着灯的戏台；台下是无数没有面目的黑色人影。',
      '[视觉表现] 镜头继续拉远，露出这个空间的真面目——一个孤零零的、亮着灯的戏台。戏台下，是无数个没有面目的黑色人影（象征历史的看客）。',
      '[最终独白] 莫笑台中雌雄假，看客同是梦里人。',
      '[屏幕黑下，浮现两行白字]：剧终。感谢游玩。'
    ],
    continueText: '看清此局'
  },
  nodes: story
};
