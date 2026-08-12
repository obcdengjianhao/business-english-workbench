# 商务英语词汇工作台

一个基于 React + Vite 的商务英语词汇学习应用，支持卡片学习、生疏词单词本、艾宾浩斯复习提醒等功能。

## 功能

- **概览面板**：查看总词数、已学习、已掌握、今日待复习数量
- **学习模式**：按词频从高到低学习，卡片翻转查看释义、例句
- **单词本**：学习时随时添加生疏词，支持手动添加自定义词汇
- **复习模式**：基于艾宾浩斯遗忘曲线自动安排复习
- **本地持久化**：学习进度、单词本保存在浏览器 localStorage

## 技术栈

- React 19
- Vite 8
- GitHub Pages 部署

## 本地开发

```bash
npm install
npm run dev
```

## 部署

项目已配置 GitHub Actions，推送代码到 `main` 分支后会自动构建并部署到 GitHub Pages。

访问地址：`https://<你的用户名>.github.io/business-english-workbench/`

## 词库

内置 200+ 商务英语高频词，按 frequency 字段从低到高排序（frequency 越小越高频）。
