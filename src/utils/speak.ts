let cachedEnVoice: SpeechSynthesisVoice | null | undefined = undefined;

// Ordered by quality preference — female voices tend to sound softer
const PREFERRED_EN = [
  'Samantha',        // macOS — чистый, приятный
  'Karen',           // macOS AU
  'Moira',           // macOS IE
  'Victoria',        // macOS
  'Aria',            // Microsoft Edge Natural
  'Jenny',           // Microsoft Edge Natural
  'Ana',             // Microsoft
  'Google US English',
];

function pickBestEnVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const en = voices.filter(v => v.lang.startsWith('en'));
  if (!en.length) return null;

  for (const name of PREFERRED_EN) {
    const v = en.find(v => v.name.includes(name));
    if (v) return v;
  }

  // Fallback: any voice marked as high quality
  const quality = en.find(v => /Premium|Enhanced|Natural|Online/i.test(v.name));
  if (quality) return quality;

  return en.find(v => v.lang === 'en-US') ?? en[0];
}

// Pre-cache as soon as voices are available
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const init = () => { cachedEnVoice = pickBestEnVoice(); };
  if (window.speechSynthesis.getVoices().length) {
    init();
  } else {
    window.speechSynthesis.addEventListener('voiceschanged', init, { once: true });
  }
}

export function speak(text: string, lang = 'en-US') {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.82;
  u.pitch = 1.05;
  u.volume = 1;

  if (lang.startsWith('en')) {
    if (cachedEnVoice === undefined) cachedEnVoice = pickBestEnVoice();
    if (cachedEnVoice) u.voice = cachedEnVoice;
  }

  window.speechSynthesis.speak(u);
}
