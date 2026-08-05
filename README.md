# Test Project - 五子棋网页游戏

纯 HTML/CSS/JavaScript 五子棋人机对战游戏，支持对局结果截图上传至阿里云 OSS。

## 功能

- 15×15 标准棋盘，玩家执黑先手
- 启发式 AI 对手
- 落子音效与动画
- 对局结束后自动截图并上传至 OSS

## 快速开始

1. 复制 OSS 配置：

```bash
cp oss-config.example.js oss-config.js
```

2. 编辑 `oss-config.js`，填入阿里云 OSS 凭证。

3. 启动本地服务：

```bash
npm start
```

4. 浏览器访问 http://localhost:3000

## 项目结构

```
├── index.html          # 主页面
├── css/style.css       # 样式
├── js/                 # 游戏逻辑
├── server.js           # 本地服务 + OSS 上传代理
├── oss-config.js       # OSS 配置（勿提交到 Git）
└── setup-cors.js       # OSS CORS 配置脚本
```
