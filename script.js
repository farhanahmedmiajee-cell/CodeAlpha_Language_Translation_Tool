const fromText = document.querySelector("#from-text");
const toText = document.querySelector("#to-text");
const fromLangSelect = document.querySelector("#from-lang");
const toLangSelect = document.querySelector("#to-lang");
const translateBtn = document.querySelector("#translate-btn");
const btnText = document.querySelector("#btn-text");
const spinner = document.querySelector("#spinner");
const detectedBadge = document.querySelector("#detected-lang");
const charCount = document.querySelector("#char-count");
const icons = document.querySelectorAll(".icons i");
const recentList = document.querySelector("#recent-list");
const clearRecentBtn = document.querySelector("#clear-recent");

const languages = {
  "auto": "Auto Detect",
  "bn-IN": "Bengali",
  "en-GB": "English",
  "hi-IN": "Hindi",
  "es-ES": "Spanish",
  "fr-FR": "French",
  "de-DE": "German",
  "ar-SA": "Arabic",
  "zh-CN": "Chinese",
  "ja-JP": "Japanese",
  "pt-PT": "Portuguese",
  "ru-RU": "Russian",
  "it-IT": "Italian",
  "ko-KR": "Korean",
  "tr-TR": "Turkish",
  "vi-VN": "Vietnamese",
  "id-ID": "Indonesian",
  "th-TH": "Thai",
  "ur-PK": "Urdu"
};

Object.keys(languages).forEach(code => {
  let option = `<option value="${code}">${languages[code]}</option>`;
  fromLangSelect.insertAdjacentHTML("beforeend", option);
  if (code !== "auto") {
    toLangSelect.insertAdjacentHTML("beforeend", `<option value="${code}">${languages[code]}</option>`);
  }
});

fromLangSelect.value = "auto";
toLangSelect.value = "en-GB";

let recentTranslations = [];
try {
  recentTranslations = JSON.parse(localStorage.getItem("recentTranslations") || "[]");
} catch (error) {
  recentTranslations = [];
  localStorage.removeItem("recentTranslations");
  console.warn("Cleared corrupted recent translations storage.", error);
}

function renderRecent() {
  recentList.innerHTML = "";

  if (!recentTranslations.length) {
    recentList.innerHTML = `<p class="recent-empty">No recent translations yet.</p>`;
    return;
  }

  recentTranslations.slice(0, 6).forEach(entry => {
    let card = document.createElement("button");
    card.type = "button";
    card.className = "recent-item";
    card.innerHTML = `
      <div class="recent-content">
        <strong>${entry.sourceText}</strong>
        <span>${entry.translatedText}</span>
      </div>
      <div class="recent-meta">${languages[entry.sourceLang] || entry.sourceLang} → ${languages[entry.targetLang] || entry.targetLang}</div>
    `;
    card.addEventListener("click", () => {
      fromText.value = entry.sourceText;
      toText.value = entry.translatedText;
      fromLangSelect.value = entry.sourceLang;
      toLangSelect.value = entry.targetLang;
      detectedBadge.textContent = entry.detectedLabel || "Recent Text";
      charCount.textContent = entry.sourceText.length;
    });
    recentList.appendChild(card);
  });
}

function saveRecent(entry) {
  recentTranslations = [entry, ...recentTranslations].filter((_, idx) => idx < 10);
  localStorage.setItem("recentTranslations", JSON.stringify(recentTranslations));
  renderRecent();
}

clearRecentBtn.addEventListener("click", () => {
  recentTranslations = [];
  localStorage.removeItem("recentTranslations");
  renderRecent();
});

renderRecent();

fromText.addEventListener("input", () => {
  charCount.textContent = fromText.value.length;
});

translateBtn.addEventListener("click", async () => {
  let text = fromText.value.trim();
  let sourceLang = fromLangSelect.value;
  let targetLang = toLangSelect.value;

  if (!text) return;
  btnText.textContent = "AI Processing...";
  spinner.style.display = "block";
  translateBtn.disabled = true;

  try {
    let langPair = sourceLang === "auto" ? `autodetect|${targetLang}` : `${sourceLang}|${targetLang}`;
    let apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
    
    let response = await fetch(apiUrl);
    let data = await response.json();

    if (data.responseData) {
      toText.value = data.responseData.translatedText;
      let detectedCode = data.responseData.detectedLanguage || "Auto";
      detectedBadge.textContent = sourceLang === "auto"
        ? `AI Detected: ${detectedCode.toUpperCase()}`
        : `Source: ${languages[sourceLang] || detectedCode}`;

      saveRecent({
        sourceText: text,
        translatedText: data.responseData.translatedText,
        sourceLang,
        targetLang,
        detectedLabel: detectedBadge.textContent,
        timestamp: Date.now()
      });
    } else {
      toText.value = "Translation error!";
    }
  } catch (error) {
    toText.value = "Network or API Error!";
    console.error("AI Model Error:", error);
  } finally {
    btnText.textContent = "Translate with AI";
    spinner.style.display = "none";
    translateBtn.disabled = false;
  }
});
icons.forEach(icon => {
  icon.addEventListener("click", ({ target }) => {
    if (target.classList.contains("fa-copy")) {
      let textToCopy = target.id === "from-copy" ? fromText.value : toText.value;
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy);
        alert("Text copied to clipboard!");
      }
    } else if (target.classList.contains("fa-volume-up")) {
      let textToSpeak = target.id === "from-volume" ? fromText.value : toText.value;
      if (textToSpeak) {
        let utterance = new SpeechSynthesisUtterance(textToSpeak);
        speechSynthesis.speak(utterance);
      }
    }
  });
});