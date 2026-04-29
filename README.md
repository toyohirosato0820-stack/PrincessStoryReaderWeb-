# Princess Story Reader Web

Windows環境でも無料で作成できる、ブラウザベースの読み上げアプリです。スマホでも動作します。

## 使い方
1. `index.html` をブラウザで開きます。
2. 画面の「写真を選択」ボタンで写真を読み込みます。スマホならカメラ撮影ができます。
3. OCR で文字を認識し、「読み上げ」ボタンで音声再生します。
4. 速度スライダーで読み上げ速度を調整します。

## 仕様
- OCR: Tesseract.js（ブラウザ内処理、無料）
- 読み上げ: Web Speech API
- カメラ / 画像選択: `<input type="file" accept="image/*" capture="environment">`

## 注意
- Chrome / Edge / iPhone Safari などの最新ブラウザで動作します。
- 画像認識は端末性能に依存します。大きな画像は処理が重くなる場合があります。
