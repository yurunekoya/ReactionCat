# ReactionCat 🐱

YouTube Liveのクイックリアクションに反応するBongo Cat風オーバーレイツールです。

視聴者がリアクション（❤️😍😮💯🎉など）を送ると、猫が机を叩いて絵文字が舞い上がります！

![ReactionCat Demo](demo.gif)

## 特徴

- 🎯 **クイックリアクション専用** - YouTube Liveのリアクション機能に特化
- ⚡ **APIキー不要** - DOM監視によるゼロコンフィグセットアップ
- 🎨 **可愛いBongo Cat** - 白い体、オレンジの耳の伝統的スタイル
- 🚀 **軽量設計** - Vanilla JS、フレームワーク不使用

## クイックスタート

### 1. ファイルをホスティング

このフォルダをGitHub PagesやVercelにデプロイし、公開URLを取得します。

```
https://your-username.github.io/ReactionCat/
```

### 2. OBS設定

1. **OBS Studio**を開く
2. **ソース** → **追加** → **ブラウザ**を選択
3. 以下の設定を入力：

| 項目 | 値 |
|------|-----|
| URL | `https://www.youtube.com/live_chat?v=VIDEO_ID&is_popout=1` |
| 幅 | `400` |
| 高さ | `300` |

4. **カスタムCSS**フィールドに `obs-custom.css` の内容を貼り付け

> **Note**: `VIDEO_ID` は配信のビデオIDに置き換えてください

### 3. 配信開始！

ライブ配信中に視聴者がクイックリアクションを送ると、猫が反応します🎉

## ローカル開発

```bash
# 開発サーバーを起動
npx serve .

# ブラウザで開く
# http://localhost:3000
```

開発モードではテストボタンが表示され、リアクションをシミュレートできます。

## ファイル構成

```
ReactionCat/
├── index.html       # メインHTML
├── styles.css       # スタイル・アニメーション
├── app.js           # リアクション検出・制御ロジック
├── obs-custom.css   # OBS用カスタムCSS
└── README.md        # このファイル
```

## カスタマイズ

### 色の変更

`styles.css` の CSS変数を編集：

```css
:root {
  --cat-body: #ffffff;        /* 体の色 */
  --cat-ear-inner: #ff9b6a;   /* 耳の内側 */
  --desk-color: #8b7355;      /* 机の色 */
}
```

### アニメーション速度

`app.js` の設定を編集：

```javascript
const CONFIG = {
  bangDuration: 150,          // 叩き速度(ms)
  fastBangDuration: 75,       // 高速モード時
  particleDuration: 1200,     // 絵文字表示時間
};
```

## トラブルシューティング

### 猫が反応しない

1. YouTubeのチャットがポップアウトモードで開かれているか確認
2. OBSのブラウザソースURLが正しいか確認
3. カスタムCSSが正しく貼り付けられているか確認

### 絵文字が表示されない

- ブラウザコンソールでエラーを確認
- `CONFIG.debug = true` でログを有効化

## ライセンス

MIT License

---

Made with 💖 for VTubers and streamers
