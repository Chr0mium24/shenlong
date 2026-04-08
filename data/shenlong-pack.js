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
  nodes: story
};
