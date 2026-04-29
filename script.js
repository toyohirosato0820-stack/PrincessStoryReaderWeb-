const imageInput = document.getElementById('imageInput');
const previewArea = document.getElementById('previewArea');
const recognizeButton = document.getElementById('recognizeButton');
const speakButton = document.getElementById('speakButton');
const stopButton = document.getElementById('stopButton');
const resultText = document.getElementById('resultText');
const speedRange = document.getElementById('speedRange');
const speedLabel = document.getElementById('speedLabel');

let currentText = '';
let speechUtterance = null;
let paddleOCR = null;
let isOCRReady = false;

speedRange.addEventListener('input', () => {
  speedLabel.textContent = parseFloat(speedRange.value).toFixed(1);
});

async function initializePaddleOCR() {
  if (paddleOCR) {
    return;
  }

  try {
    resultText.value = 'PaddleOCRの初期化中です。少しお待ちください...';
    paddleOCR = await paddleocr.PaddleOCR({
      ocr_version: 'PP-OCRv4',
      use_gpu: false,
      enable_mkldnn: true
    });
    isOCRReady = true;
    resultText.value = '画像を読み込みました。文字を読み取ってください。';
  } catch (error) {
    console.error('PaddleOCR initialization error:', error);
    resultText.value = 'PaddleOCRの初期化に失敗しました。ページを再読み込みしてください。';
  }
}

imageInput.addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const url = URL.createObjectURL(file);
  previewArea.innerHTML = `<img src="${url}" alt="Selected image" />`;
  resultText.value = '画像を読み込みました。文字を読み取ってください。';
  currentText = '';

  if (!isOCRReady) {
    await initializePaddleOCR();
  }
});

recognizeButton.addEventListener('click', async () => {
  const file = imageInput.files?.[0];
  if (!file) {
    alert('まず写真を選んでください。');
    return;
  }

  if (!isOCRReady) {
    await initializePaddleOCR();
  }

  resultText.value = 'OCRを実行中です。少しお待ちください...';
  recognizeButton.disabled = true;
  speakButton.disabled = true;

  try {
    const imageUrl = URL.createObjectURL(file);
    const result = await paddleOCR.ocr(imageUrl);

    if (result && result.length > 0) {
      currentText = result
        .map(line => line.map(block => block[0]).join(''))
        .join('\n')
        .trim();
    } else {
      currentText = '';
    }

    resultText.value = currentText || '文字が見つかりませんでした。別の写真で試してください。';
    speakButton.disabled = currentText.length === 0;
  } catch (error) {
    console.error(error);
    resultText.value = 'OCRに失敗しました。別の写真で試してください。';
  } finally {
    recognizeButton.disabled = false;
  }
});

speakButton.addEventListener('click', () => {
  if (!currentText) {
    alert('まず文字を認識してください。');
    return;
  }

  if (!window.speechSynthesis) {
    alert('このブラウザは音声合成をサポートしていません。');
    return;
  }

  speechSynthesis.cancel();
  speechUtterance = new SpeechSynthesisUtterance(currentText);
  speechUtterance.lang = 'ja-JP';
  speechUtterance.rate = parseFloat(speedRange.value);
  speechUtterance.pitch = 1.0;
  speechSynthesis.speak(speechUtterance);
});

stopButton.addEventListener('click', () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  initializePaddleOCR();
});
