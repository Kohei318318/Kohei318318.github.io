# こうぺいキング | KopeiKing — 自己紹介サイト

GitHub Pages で公開する静的サイトです。YouTube の直近5本の動画は、GitHub Actions が自動で取得します。

## ファイル構成

```
index.html                    サイト本体（文章・構成）
assets/style.css              デザイン（色・レイアウト・アニメーション）
assets/main.js                動き（キャラのタップ演出、電車の路線図、ステッカー、動画スライダーなど）
assets/kopeiking.webp         キャラクターイラスト（背景透過）
assets/kopeiking.jpg          SNS共有用の画像（OGP）
videos.json                   直近5本の動画リスト（自動で更新されます）
scripts/fetch_videos.py       YouTube から最新動画を取得するスクリプト
.github/workflows/deploy.yml  動画の取得とサイト公開を自動で行う設定
```

## 公開手順

1. GitHub で新しいリポジトリを作成します  
   - 名前を `Kohei318318.github.io` にすると、URL は `https://kohei318318.github.io/` になります
2. このフォルダの中身を、フォルダ構成のまま `main` ブランチにアップロード（または push）します  
   - `.github` フォルダは「.」で始まるため、ファイル一覧で見えにくいことがあります。必ず含めてください
3. リポジトリの **Settings → Pages** を開き、**Source** を **GitHub Actions** にします
4. **Actions** タブで「Deploy site」が緑のチェックになれば公開完了です  
   - 初回に動かないときは、Actions タブ →「Deploy site」→ **Run workflow** で手動実行できます

## 動画の自動更新

- push するたび、および6時間ごとに、YouTube の最新5本を取得してサイトを更新します
- 取得に失敗した場合は前回の一覧のまま公開されます
- リポジトリに60日間更新がないと、GitHub の仕様で定期実行が止まることがあります。そのときは Actions タブで再度有効にしてください

## プレビューについて

`index.html` をパソコンで直接開いた場合、動画の一覧は読み込めず「YouTubeで最新動画を見る」というリンクが表示されます。公開後のサイトでは動画が表示されます。

## カスタマイズ

- 文言・実績の追加は `index.html` を編集します（実績は `<article class="ach ...">` を1ブロックコピーして追加）
- 色は `assets/style.css` 冒頭の `:root` の変数で変更できます（ライト／ダーク両方あります）
- アニメーションは「視差効果を減らす」設定のブラウザでは自動的に控えめになります
