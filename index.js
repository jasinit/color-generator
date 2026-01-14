/**
 * Chroma Artists - Logic
 */

const elements = {
  container: document.getElementById("swatch-container"),
  generateBtn: document.getElementById("generate-btn"),
  harmonyLabel: document.getElementById("harmony-label"),
  toast: document.getElementById("toast"),
  toastMsg: document.getElementById("toast-msg"),
  // Theme
  themeToggle: document.getElementById("theme-toggle"),
  // Chat Elements
  chatToggle: document.getElementById("chat-toggle"),
  chatWidget: document.getElementById("chat-widget"),
  chatInput: document.getElementById("chat-input"),
  sendBtn: document.getElementById("send-btn"),
  chatMessages: document.getElementById("chat-messages"),
  // New: Chips
  chips: document.querySelectorAll(".chip"),
};

// --- Theme Logic ---
const storedTheme = localStorage.getItem("theme");
if (storedTheme) {
  document.documentElement.setAttribute("data-theme", storedTheme);
  updateThemeIcon(storedTheme);
}

elements.themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  updateThemeIcon(next);
});

function updateThemeIcon(theme) {
  const icon = elements.themeToggle.querySelector("span");
  icon.textContent = theme === "dark" ? "light_mode" : "dark_mode";
}

// --- Color Utils ---

function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateHSL(hueOverride = null) {
  // If hue is provided, vary it slightly (+/- 10) for natural feel
  const h =
    hueOverride !== null
      ? (hueOverride + randomInt(-10, 10)) % 360
      : randomInt(0, 360);
  return { h: h, s: randomInt(50, 95), l: randomInt(40, 70) };
}

// --- Harmonies (Restricted to Mono, Analogous, Comp) ---

const harmonies = {
  Analogous: (hueOverride) => {
    const base = generateHSL(hueOverride);
    return Array.from({ length: 5 }, (_, i) => {
      return hslToHex((base.h + i * 30) % 360, base.s, base.l);
    });
  },
  Monochromatic: (hueOverride) => {
    const base = generateHSL(hueOverride);
    return Array.from({ length: 5 }, (_, i) => {
      const l = Math.max(15, Math.min(95, base.l + (i * 15 - 30)));
      return hslToHex(base.h, base.s, l);
    });
  },
  Complementary: (hueOverride) => {
    const base = generateHSL(hueOverride);
    // Base, Base-Light, Compl, Compl-Dark, Compl-Light
    return [0, 0, 180, 180, 180].map((deg, i) => {
      let l = base.l;
      if (i === 1) l += 20;
      if (i === 3) l -= 20;
      if (i === 4) l += 25;
      return hslToHex(
        (base.h + deg) % 360,
        base.s,
        Math.min(95, Math.max(5, l))
      );
    });
  },
};

// --- Render Logic ---

// --- Render Logic ---

// --- Render Logic ---

function renderPalette(hueOverride = null) {
  // 1. Pick Harmony
  const keys = Object.keys(harmonies);
  const harmonyName = keys[randomInt(0, keys.length - 1)];
  const colors = harmonies[harmonyName](hueOverride);

  // 2. Update UI
  elements.harmonyLabel.textContent = harmonyName;

  // Ensure we have exactly 5 cards
  const existingCards = Array.from(
    elements.container.querySelectorAll(".swatch-card")
  );

  // If not enough cards (e.g. init), create them
  if (existingCards.length < 5) {
    for (let i = existingCards.length; i < 5; i++) {
      const card = createCard(colors[i], i);
      elements.container.appendChild(card);
      existingCards.push(card);
    }
  }

  // Update ALL 5 cards
  existingCards.forEach((card, index) => {
    const color = colors[index];
    const preview = card.querySelector(".color-preview");
    const hexCode = card.querySelector(".hex-code");
    const copyBtn = card.querySelector(".copy-icon");

    // Update Styles for CSS Transition (Seamless)
    preview.style.backgroundColor = color;
    hexCode.textContent = color;
    copyBtn.dataset.color = color;

    // Update Click Handler safely
    // We use a property override instead of addEventListener to prevent stacking listeners
    card.onclick = () => copyToClipboard(color);

    // Optional: Trigger a tiny "pulse" animation for feedback
    // But do NOT replace the node, or we lose the background-color transition
    card.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(0.97)" },
        { transform: "scale(1)" },
      ],
      {
        duration: 200,
        easing: "ease-out",
      }
    );
  });
}

function createCard(color, index) {
  const card = document.createElement("div");
  card.className = "swatch-card";
  card.style.animation = `cardEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards ${
    index * 0.1
  }s`;

  card.innerHTML = `
        <div class="color-preview" style="background-color: ${color};"></div>
        <div class="color-details">
            <span class="hex-code">${color}</span>
            <button class="copy-icon" data-color="${color}" title="Copy Code">
                <span class="material-symbols-rounded">content_copy</span>
            </button>
        </div>
    `;
  // Initial listener
  card.onclick = () => copyToClipboard(color);
  return card;
}

// --- Chat Logic & NLP ---

// Dictionary
const moodDict = {
  red: 0,
  fire: 10,
  passion: 350,
  anger: 0,
  orange: 30,
  sunset: 25,
  warm: 35,
  autumn: 20,
  yellow: 50,
  happy: 55,
  sun: 45,
  bright: 50,
  green: 120,
  nature: 100,
  forest: 130,
  fresh: 110,
  cyan: 180,
  teal: 170,
  beach: 180,
  blue: 220,
  ocean: 210,
  calm: 200,
  sky: 200,
  sad: 230,
  purple: 270,
  royal: 260,
  magic: 280,
  luxury: 270,
  pink: 320,
  love: 330,
  candy: 310,
  flower: 300,
};

function processChat() {
  const text = elements.chatInput.value.trim().toLowerCase();
  if (!text) return;

  // 1. Add User Message
  addMessage(elements.chatInput.value, "user");
  elements.chatInput.value = "";

  // 2. Simple NLP Matching
  let matchedHue = null;
  let keywordFound = null;

  for (const [key, hue] of Object.entries(moodDict)) {
    if (text.includes(key)) {
      matchedHue = hue;
      keywordFound = key;
      break;
    }
  }

  // 3. Bot Response & Action
  setTimeout(() => {
    if (matchedHue !== null) {
      renderPalette(matchedHue);
      addMessage(
        `I love the vibe of "${keywordFound}"! Here's a palette inspired by that.`
      );
    } else {
      renderPalette(); // Random
      addMessage(
        `That's an interesting mood. Here's a random artistic palette for you!`
      );
    }
  }, 600);
}

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = `msg ${sender}`;
  div.innerHTML = `<p>${text}</p>`;
  elements.chatMessages.appendChild(div);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// --- Interactions ---

function copyToClipboard(hex) {
  navigator.clipboard.writeText(hex).then(() => {
    showToast(hex);
  });
}

function showToast(hex) {
  elements.toastMsg.textContent = `${hex} Copied!`;
  elements.toast.classList.remove("hidden");
  if (window.toastTimer) clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    elements.toast.classList.add("hidden");
  }, 2000);
}

// Event Listeners
elements.generateBtn.addEventListener("click", () => {
  const icon = elements.generateBtn.querySelector(".material-symbols-rounded");
  icon.style.transform = `rotate(${Math.random() * 360 + 360}deg)`;
  renderPalette();
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.activeElement !== elements.chatInput) {
    e.preventDefault(); // prevent scrolling
    renderPalette();
  }
  if (e.key === "Enter" && document.activeElement === elements.chatInput) {
    processChat();
  }
});

// Chat Toggles & Chips
elements.chatToggle.addEventListener("click", () => {
  elements.chatWidget.classList.toggle("minimized");
});
elements.sendBtn.addEventListener("click", processChat);

elements.chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    elements.chatInput.value = chip.dataset.val; // Or chip.textContent for nice casing
    processChat();
  });
});

// Init
renderPalette();
