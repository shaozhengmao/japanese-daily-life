# 📖 生活情境日语图解大百科 · 学习平台

《生活情境日语图解大百科》配套音频学习网站，支持一键部署到 **GitHub Pages**。

**功能：** 210 课音频在线播放 · 三栏对照（日语 / 罗马音 / 中文）· 词汇注释 · 文化背景 · 实用对话 · 分类筛选 · 移动端友好

---

## ⚠️ 版权声明与免责说明

本项目基于《生活情境日语图解大百科》（*Illustrated Japanese Words and Conversations for Every Day*）一书制作，**仅供个人学习与研究使用，严禁任何形式的商业用途**。

- 本书版权归原作者及出版社所有，书中文字、图片、音频等内容的著作权受法律保护。
- 本项目中的音频文件、PDF 教材及文字内容均来源于原版图书，**本项目不主张对上述内容拥有任何权利**。
- 如果您喜欢这本书，请支持正版，购买实体书或正版电子版。

原版音频由出版社官方提供下载：[中国宇航出版社 · 生活情境日语图解大百科](http://down.caphbook.com/YH/DownloadDetail.aspx?ID=b7ae493a5c9a4337912839edd7608bc5&type=0)

如原作者或出版社认为本项目侵犯了相关权益，请通过 GitHub Issues 联系，本人将立即删除相关内容。

---

## 部署到 GitHub Pages

1. 点击右上角 **Fork** 将本仓库 fork 到你自己的账号
2. 进入 fork 后的仓库，点击 **Settings** → **Pages**
3. Source 选择 **GitHub Actions**，保存
4. 约 1 分钟后自动部署完成，访问地址为：

```
https://你的用户名.github.io/japanese-daily-life/
```

### 关于音频文件

音频文件已包含在仓库中，fork 后直接可以播放。

### 关于 PDF 教材

PDF 通过 Releases 分发，可在仓库的 [Releases](../../releases) 页面下载。

---

## 项目结构

```
japanese-daily-life/
├── index.html                    # 主页面
├── css/main.css                  # 样式
├── js/app.js                     # 前端逻辑
├── data/
│   ├── tracks_index.json         # 列表索引（轻量，供卡片列表使用）
│   └── tracks_full.json          # 完整数据（含词汇、对话、文化注释）
├── audio/
│   └── Track 001.mp3 … (210 个)
└── .github/workflows/
    └── deploy.yml                # GitHub Actions 自动部署
```

---

## 数据统计

| 分类 | 课数 |
|------|------|
| 家居生活 | 56 |
| 节日庆典 | 39 |
| 购物消费 | 23 |
| 娱乐休闲 | 21 |
| 户外运动 | 15 |
| 观光旅游 | 12 |
| 交通出行 | 12 |
| 医疗健康 | 7 |
| 日常生活 | 6 |
| 学校生活 | 6 |
| 旅行住宿 | 4 |
| 传统艺能 | 3 |
| 职场工作 | 3 |
| 外貌身体 | 2 |
| 其他 | 1 |
| **合计** | **210 课** |

