# StoryEngine 结构

## 分层
- `public/engine/story-engine.js`: 通用剧情状态机（与具体剧本无关）
- `data/shenlong-pack.json`: 《男皇后》内容包（标题、属性、初始状态、节点）
- `data/manual-line-cues.json`: 全量逐行渲染配置（样式/说话人/文本/速度/立绘）
- `public/game/stage-renderer.js`: 当前项目的舞台风格渲染器
- `public/main.js`: 启动器，只负责串联引擎与渲染器
- `public/editor.html`: 台词配置编辑器（本地草稿 + 存服务器）

## 内容包格式
```json
{
  "id": "pack-id",
  "title": "标题",
  "stats": { "key": "显示名" },
  "statOrder": ["key1", "key2"],
  "initialState": { "currentNode": "start", "key1": 0, "key2": 0 },
  "nodes": [
    {
      "id": "start",
      "act": "第一折",
      "title": "节点名",
      "lines": ["叙事行1", "叙事行2"],
      "enterEffects": { "key1": 5 },
      "autoNext": [{ "if": { "stat": "key1", "gte": 10 }, "next": "x" }, { "next": "y" }],
      "choices": [
        { "id": "c1", "text": "选项文案", "effects": { "key2": 3 }, "next": "next-id" },
        { "id": "c2", "text": "重开", "reset": true, "next": "start" }
      ]
    }
  ]
}
```

## 复用方式
1. 新增一个 `data/<your-pack>.json`，按上述格式维护内容包。
2. 后端接口改为返回该内容包。
3. 前端无需改引擎，只替换渲染主题或文案映射即可。
