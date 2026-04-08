export const story = [
  {
    id: 'start',
    act: '第一折',
    title: '干戈营前',
    lines: [
      '你姓陈名子高，自小于江南长大。幼时家门显赫，后父母双亡，家道中落。',
      '你现在在干戈营中打杂。',
      '忽有一日锣鼓喧天，似有大军凯旋。你看见那将军人高马大、披风猎猎，受万众瞩目。',
      '这时，你有两个选择。'
    ],
    choices: [
      {
        id: 'start_a',
        text: '拦下马头',
        next: 'block_horse'
      },
      {
        id: 'start_b',
        text: '转身回头隐入群众（结局1：芸芸众生）',
        next: 'ending_1'
      }
    ]
  },
  {
    id: 'block_horse',
    act: '第一折',
    title: '拦马',
    lines: [
      '你只身拦下马头。将军一把提起你，浓烈血腥与汗臭窜入鼻孔。',
      '“你这小厮，胆敢拦我马头，怕不是个敌国奸细，看我不杀你做个好彩头！”',
      '你耳膜几近撕裂，却不敢有一丝反抗。',
      '周围兵卒哄笑，有人道：“这小厮貌美如花，拿去献给大王讨头功！”',
      '又有人起哄：“好办法！白天就打发去做些杂活，夜间……就给兄弟们好好用用！”',
      '另一小兵接话：“将军，这妖物可不是我们用的了的，听闻大王最爱男风，我们拿他讨个头功！”',
      '你没有别的法子，只得随着大军前行。'
    ],
    choices: [
      {
        id: 'horse_a',
        text: '“草民陈子高愿为大王效力……愿为大王出谋划策！”（须眉骨+5）',
        effects: { beardBone: 5 },
        next: 'march_to_king'
      },
      {
        id: 'horse_b',
        text: '不吭声，隐忍不反抗（面具值+5）',
        effects: { mask: 5 },
        next: 'march_to_king'
      }
    ]
  },
  {
    id: 'march_to_king',
    act: '第一折',
    title: '君王前侧',
    lines: [
      '没过几天，将军来拖你起身：“大王召见了，你可要好好表现。”',
      '你穿过层层侍卫，抵达巨大营帐。将军低声戏弄：“见到大王要行跪拜之礼，不可直视大王。”',
      '你跪下。将军毕恭毕敬地说：“大王，军前拿了个小生，眉清目秀，还未及冠。”',
      '大王问：“你姓甚名谁？”'
    ],
    choices: [
      {
        id: 'name_a',
        text: '“草民姓陈名子高，自幼熟读经书……愿以微薄之才，效力于天下苍生。”（须眉骨+5）',
        effects: { beardBone: 5 },
        next: 'answer_age'
      },
      {
        id: 'name_b',
        text: '“小的名唤夏花……大王慈悲，便让小的当个洒扫逗乐，也好容身。”（红粉相+5，好感+5）',
        effects: { rougeFace: 5, favor: 5 },
        next: 'answer_age'
      }
    ]
  },
  {
    id: 'answer_age',
    act: '第一折',
    title: '答年龄与本事',
    lines: [
      '大王又问：“你今年多少年纪了？有什么本事？”'
    ],
    choices: [
      {
        id: 'age_a',
        text: '“草民年方二十有余……愿为大王征战四方出谋划策。”（须眉骨+5）',
        effects: { beardBone: 5 },
        next: 'answer_loyalty'
      },
      {
        id: 'age_b',
        text: '“我还未破瓜……平时能舞刀弄枪，也能温柔陪床榻，给大王解闷儿。”（红粉相+5，好感+5）',
        effects: { rougeFace: 5, favor: 5 },
        next: 'answer_loyalty'
      }
    ]
  },
  {
    id: 'answer_loyalty',
    act: '第一折',
    title: '是否从王',
    lines: [
      '大王点点头：“你确定要从了我？”'
    ],
    choices: [
      {
        id: 'loyalty_a',
        text: '“草民誓死效忠大王。幼时父母双亡，如今投靠大王，算是有了归宿。”（好感+5）',
        effects: { favor: 5 },
        next: 'loyalty_check'
      },
      {
        id: 'loyalty_b',
        text: '“我无父无母……如若能得些活干，就是扫洒也愿意。”（红粉相+5，好感+5）',
        effects: { rougeFace: 5, favor: 5 },
        next: 'loyalty_check'
      }
    ]
  },
  {
    id: 'loyalty_check',
    act: '第一折',
    title: '王意难测',
    lines: [
      '你低头伏地，等候发落。'
    ],
    autoNext: [
      {
        if: { stat: 'favor', lt: 10 },
        next: 'ending_2'
      },
      {
        next: 'crowned'
      }
    ]
  },
  {
    id: 'crowned',
    act: '第一折',
    title: '册后',
    enterEffects: { favor: 5, feminine: 5 },
    lines: [
      '大王满意地点头：“我怎么舍得割你？我看你模样好似女子，就选你入宫。”',
      '你叩谢并道：“我情愿学那梳妆粉黛，着那繁长裙摆，安能辨我是雌雄？”',
      '大王招呼左右：“取我那白玉环鸾带和鲜明罩甲与他穿，明儿立你做个正宫皇后。”',
      '你大喜：“古有女子做得了皇帝，今当有男子披得了凤冠霞帔！”'
    ],
    choices: [
      {
        id: 'crowned_next',
        text: '进入第二折',
        next: 'second_act'
      }
    ]
  },
  {
    id: 'second_act',
    act: '第二折',
    title: '粉黛中宫',
    lines: [
      '【覆雨翻云总一般，桃花错做杏花看。大王爷军中带得个妖东西，将他妆作女妆，要立他做娘娘。】',
      '大王这天中明月，给他那野猴子摘了成。',
      '自你随军入宫，风言风语从未断绝。有人说你妖怪降世，有人说大王被下了蛊。',
      '侍女将水粉往你脸上抹，你只觉米糊糊脸；胭脂拍腮、墨笔描眉，终日粉末缠身。',
      '你恍惚又回到小时候，那时穿衣出行皆有人伺候，不似军营里整日受人笑骂。',
      '你看铜镜中的自己，娇滴滴胜过女子万千。万千女子苦求的后位，你竟因美貌轻易得之。',
      '宫女鱼贯而入，你知今日是大王立你为皇后的日子，正要踏入宫殿。',
      '立后大典锣鼓喧天，你心中五味杂陈：既感君恩，又羞于“以色侍人”，无奈苦笑。',
      '礼成入洞房，你必须表态。'
    ],
    choices: [
      {
        id: 'second_a',
        text: '叩拜大王，再提“愿为大王出谋划策”',
        next: 'ending_3'
      },
      {
        id: 'second_b',
        text: '抛媚眼：“臣妾依着大王恩宠才有今日。”（好感+5，红粉相+5）',
        effects: { favor: 5, rougeFace: 5 },
        next: 'second_favor'
      }
    ]
  },
  {
    id: 'second_favor',
    act: '第二折',
    title: '恩宠渐深',
    lines: [
      '大王夸你“好似周小史，传颂千古”，又说何必忧虑两雄并立。',
      '“即使头戴金貂的高官显贵，在你面前也该自惭形秽。”',
      '他在你的衣服上题诗作画。你察觉这份恩宠，抵得过多少鸳鸯凤凰。',
      '后宫佳丽三千跪拜于下，你在众人陪衬中，恍惚自己真如天仙。'
    ],
    choices: [
      {
        id: 'second_favor_next',
        text: '步入第三折',
        next: 'third_act_intro'
      }
    ]
  },
  {
    id: 'third_act_intro',
    act: '第三折',
    title: '玉华公主',
    lines: [
      '大王有一位特别宠爱的妹妹，众人称玉华公主。她云鬓斜插金凤，眉眼之间只留一抹余光看人。',
      '她好奇来见你：“本公主倒要瞧瞧，能被哥哥瞧上的女人如何倾国倾城。”',
      '往后她隔三差五来找你，先是撒娇借鞋，后又言语轻薄，甚至以自缢相逼。',
      '“嫂嫂，你那鞋儿借我穿穿。”“嫂嫂，你可莫要执迷不悟啊。”',
      '她牵你手被你躲开，恼羞成怒笑骂：“你这还怕什么，都能当男皇后，还怕伦理纲常！”',
      '“若你不从，我就自缢，告诉圣上你调戏我！”你知从她是欺君，不从又恐祸起。'
    ],
    choices: [
      {
        id: 'third_a',
        text: '“我只得从了你了。”',
        next: 'princess_accept'
      },
      {
        id: 'third_b',
        text: '“本宫乃六宫之主，做不得从了你的事。”（结局4）',
        next: 'ending_4'
      }
    ]
  },
  {
    id: 'princess_accept',
    act: '第三折',
    title: '白团扇',
    lines: [
      '玉华公主大喜，拿最爱的白团扇题诗赠你，写你如明月般清澈。',
      '一旁丫鬟多看了一眼，公主便大骂“这贱人在瞧什么”。',
      '你不愿闹大，只得安抚公主，让丫鬟退下。',
      '这柄团扇，终成祸根。'
    ],
    choices: [
      {
        id: 'princess_next',
        text: '进入第四折',
        next: 'fourth_act'
      }
    ]
  },
  {
    id: 'fourth_act',
    act: '第四折',
    title: '殿前对质',
    lines: [
      '你与玉华公主同被召见。那名丫鬟跪地高喊：“奴婢句句属实！这白团扇便是铁证！”',
      '你不敢抬头，却感到大殿阴沉沉，冰凉地板寒意透骨。',
      '大王怒道：“好一出‘出入怀袖百千年’！寡人破例立你这不男不女者为皇后，你竟行这苟且之事？！”',
      '你跪在冰冷砖瓦上，骨髓都发寒。此刻只能辩白或认罪。'
    ],
    choices: [
      {
        id: 'fourth_a',
        text: '“都是玉华公主屡次纠缠，臣妾不敢当面拂金枝玉叶。”（结局5）',
        next: 'ending_5'
      },
      {
        id: 'fourth_b',
        text: '“大王，不干姑娘的事，都是臣妾之罪过。”',
        next: 'ending_6'
      }
    ]
  },
  {
    id: 'ending_1',
    act: '结局',
    title: '结局1：芸芸众生',
    ending: true,
    lines: [
      '脚步在最后一刻停住。你顺势低头，侧身一闪，隐入嘈杂欢呼之中。',
      '将军高坐马背，受万众瞩目。功绩与喧嚣近在咫尺，却与你隔着一层看不见的幕。',
      '你再也无法触及那条命运岔道，终成芸芸众生。'
    ],
    choices: [
      {
        id: 'e1_stage',
        text: '看穿戏台（终幕）',
        next: 'stage_reveal'
      },
      {
        id: 'e1_restart',
        text: '重新开局',
        reset: true,
        next: 'start'
      }
    ]
  },
  {
    id: 'ending_2',
    act: '结局',
    title: '结局2：王前失宠',
    ending: true,
    lines: [
      '大王冷哼几声，摆了摆手。',
      '几个侍卫上前把你拖走，帐内灯火与兵械很快被黑暗吞没。',
      '你没能进入宫廷中心，故事在门外戛然而止。'
    ],
    choices: [
      {
        id: 'e2_stage',
        text: '看穿戏台（终幕）',
        next: 'stage_reveal'
      },
      {
        id: 'e2_restart',
        text: '重新开局',
        reset: true,
        next: 'start'
      }
    ]
  },
  {
    id: 'ending_3',
    act: '结局',
    title: '结局3：废后失宠',
    ending: true,
    lines: [
      '你叩拜大王，久久不起，再提愿为大王出谋划策。',
      '大王冷笑。他不忍杀你，却废你后位。',
      '不久你彻底失宠，落得冷冷清清。'
    ],
    choices: [
      {
        id: 'e3_stage',
        text: '看穿戏台（终幕）',
        next: 'stage_reveal'
      },
      {
        id: 'e3_restart',
        text: '重新开局',
        reset: true,
        next: 'start'
      }
    ]
  },
  {
    id: 'ending_4',
    act: '结局',
    title: '结局4：无实权假后',
    ending: true,
    lines: [
      '玉华公主大怒，连日登殿痛诉你调戏。',
      '原本对你深信不疑的大王终起疑心。',
      '你失去恩宠，只剩一个无实权的皇后名号。'
    ],
    choices: [
      {
        id: 'e4_stage',
        text: '看穿戏台（终幕）',
        next: 'stage_reveal'
      },
      {
        id: 'e4_restart',
        text: '重新开局',
        reset: true,
        next: 'start'
      }
    ]
  },
  {
    id: 'ending_5',
    act: '结局',
    title: '结局5：冷月残花',
    ending: true,
    lines: [
      '内侍上前剥去你身上华贵宫衫，摘下金翠花簪，将你丢入冷宫。',
      '冷宫寒夜刺骨。没有银烛锦瑟，只有破窗漏进的惨白月光与秋虫哀鸣。',
      '后来你听闻玉华公主不过禁足数月便获宽宥，仍是金尊玉贵。',
      '你终于明白：“生男倒坐中宫驾”的泼天富贵，不过是权力者一时兴起的荒唐游戏。'
    ],
    choices: [
      {
        id: 'e5_stage',
        text: '看穿戏台（终幕）',
        next: 'stage_reveal'
      },
      {
        id: 'e5_restart',
        text: '重新开局',
        reset: true,
        next: 'start'
      }
    ]
  },
  {
    id: 'ending_6',
    act: '结局',
    title: '结局6：赐婚驸马',
    ending: true,
    lines: [
      '大殿沉寂很久，大王长叹：“罢了，若赐死你们，寡人心头最爱也生生夺去了。”',
      '后来大王赐婚，许你做玉华公主驸马。满城称颂十里红妆，却见你仍着娘娘装束。',
      '都说玉华公主非比寻常，寻得如意郎君；却无人问这郎君为何仍着宫里娘娘衣裳。',
      '泪水滑过脸颊。你明白自己从头到尾都只是任人摆布。',
      '后史观记载里，你被写作“男生女相，惑主乱位”的反面注脚。'
    ],
    choices: [
      {
        id: 'e6_stage',
        text: '看穿戏台（终幕）',
        next: 'stage_reveal'
      },
      {
        id: 'e6_restart',
        text: '重新开局',
        reset: true,
        next: 'start'
      }
    ]
  },
  {
    id: 'stage_reveal',
    act: '终幕',
    title: '戏台之下',
    ending: true,
    lines: [
      '镜头突然脱离第一人称，以极快速度向后上方拉远。',
      '原本2D人物立绘，变成巨大黑色空间里的纸片人。',
      '镜头继续拉远，露出一个孤零零亮着灯的戏台；台下是无数没有面目的黑色人影。',
      '大王（临川王）：“在这几抹胭脂色的春光里，明月又转过了树梢。”',
      '最终独白：莫笑台中雌雄假，看客同是梦里人。',
      '屏幕黑下，浮现白字：剧终。感谢游玩。'
    ],
    choices: [
      {
        id: 'stage_restart',
        text: '重新开局',
        reset: true,
        next: 'start'
      }
    ]
  }
];
