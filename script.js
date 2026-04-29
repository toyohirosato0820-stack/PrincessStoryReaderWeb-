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

speedRange.addEventListener('input', () => {
  speedLabel.textContent = parseFloat(speedRange.value).toFixed(1);
});

imageInput.addEventListener('change', event => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const url = URL.createObjectURL(file);
  previewArea.innerHTML = `<img src="${url}" alt="Selected image" />`;
  resultText.value = '画像を読み込みました。文字を読み取ってください。';
  currentText = '';
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

  try {
    const { data } = await Tesseract.recognize(file, 'jpn', {
      logger: m => {
        if (m.status === 'recognizing text') {
          resultText.value = `認識中: ${Math.round(m.progress * 100)}%`;
        }
      }
    });

    currentText = data.text.trim();
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
