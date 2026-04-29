const imageInput = document.getElementById('imageInput');
const previewArea = document.getElementById('previewArea');
const recognizeButton = document.getElementById('recognizeButton');
const speakButton = document.getElementById('speakButton');
const stopButton = document.getElementById('stopButton');
const copyButton = document.getElementById('copyButton');
const resultText = document.getElementById('resultText');
const speedRange = document.getElementById('speedRange');
const speedLabel = document.getElementById('speedLabel');

let currentText = '';
let speechUtterance = null;
let ocrWorker = null;
let isOCRReady = false;

speedRange.addEventListener('input', () => {
  speedLabel.textContent = parseFloat(speedRange.value).toFixed(1);
});

async function initializeWorker() {
  if (isOCRReady) {
    return;
  }

  resultText.value = 'OCRエンジンを準備中です...';
  
  try {
    resultText.value = '日本語モデルを読み込んでいます...';
    ocrWorker = await Tesseract.createWorker('jpn');
    await ocrWorker.loadLanguage('jpn');
    await ocrWorker.initialize('jpn');
    isOCRReady = true;
    resultText.value = '画像を読み込みました。文字を読み取ってください。';
  } catch (error) {
    console.error('Tesseract initialization:', error);
    resultText.value = '初期化に失敗しました。ページをリロードしてください。';
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
    await initializeWorker();
  }
});

recognizeButton.addEventListener('click', async () => {
  const file = imageInput.files?.[0];
  if (!file) {
    alert('まず写真を選んでください。');
    return;
  }

  resultText.value = 'OCRを実行中です。少しお待ちください...';
  recognizeButton.disabled = true;
  speakButton.disabled = true;
  copyButton.disabled = true;

  try {
    const imageUrl = URL.createObjectURL(file);
    const { data: { text } } = await ocrWorker.recognize(imageUrl, {
      logger: m => {
        if (m.status === 'recognizing text') {
          resultText.value = `認識中: ${Math.round(m.progress * 100)}%`;
        }
      }
    });

    currentText = text.trim();
    resultText.value = currentText || '文字が見つかりませんでした。別の写真で試してください。';
    speakButton.disabled = currentText.length === 0;
    copyButton.disabled = currentText.length === 0;
  } catch (error) {
    console.error(error);
    resultText.value = 'OCRに失敗しました。別の写真で試してください。';
  } finally {
    recognizeButton.disabled = false;
  }
});

copyButton.addEventListener('click', async () => {
  const textToCopy = resultText.value.trim();
  if (!textToCopy) {
    alert('コピーするテキストがありません。');
    return;
  }

  try {
    await navigator.clipboard.writeText(textToCopy);
    alert('OCR結果をクリップボードにコピーしました。ChatGPTアプリに貼り付けて修正してください。');
  } catch (error) {
    console.error('Clipboard error:', error);
    alert('コピーに失敗しました。手動でテキストを選択してください。');
  }
});

speakButton.addEventListener('click', () => {
  const editedText = resultText.value.trim();
  if (!editedText) {
    alert('まず文字を認識してください。');
    return;
  }

  if (!window.speechSynthesis) {
    alert('このブラウザは音声合成をサポートしていません。');
    return;
  }

  speechSynthesis.cancel();
  speechUtterance = new SpeechSynthesisUtterance(editedText);
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

async function preprocessImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const maxSize = 1200;
      const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const adjusted = gray > 200 ? 255 : gray < 80 ? 0 : gray;
        data[i] = data[i + 1] = data[i + 2] = adjusted;
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeWorker();
});
