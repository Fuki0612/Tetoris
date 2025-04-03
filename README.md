# テトリス

HTMLとJavaScriptで実装されたシンプルなテトリスゲームです。

## 機能

- クラシックなテトリスゲームプレイ
- スコア、レベル、消去したライン数の表示
- 次のピースのプレビュー
- レベルに応じたスピードアップ
- ゲームの一時停止と再開

## 操作方法

- ←/→ : ピースを左右に移動
- ↓ : ピースを下に移動（ソフトドロップ）
- ↑ : ピースを回転
- スペースキー : ハードドロップ（一気に下まで落とす）
- P : ゲームの一時停止/再開

## 遊び方

1. 「スタート」ボタンをクリックしてゲームを開始します
2. ブロックを操作して横一列を揃えると消去されてスコアが加算されます
3. 10ラインごとにレベルアップし、ブロックの落下速度が上がります
4. ブロックが画面上部に積み上がるとゲームオーバーです

## 技術情報

- HTML5 Canvas APIを使用したレンダリング
- 純粋なJavaScriptによる実装（外部ライブラリなし）
- レスポンシブデザイン

## 作者

Fuki0612