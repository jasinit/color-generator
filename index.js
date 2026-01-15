/**
 * SwatchIt - Logic
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
const storedTheme = localStorage.getItem("theme"); // Get stored theme
if (storedTheme) { // Apply if exists
  document.documentElement.setAttribute("data-theme", storedTheme); // Set attribute
  updateThemeIcon(storedTheme); // Update icon
}

elements.themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme"); // Get current
  const next = current === "dark" ? "light" : "dark"; // Toggle

  document.documentElement.setAttribute("data-theme", next); // Set attribute
  localStorage.setItem("theme", next); // Store
  updateThemeIcon(next); // Update icon
});

function updateThemeIcon(theme) {
  const icon = elements.themeToggle.querySelector("span");   // Get icon
  icon.textContent = theme === "dark" ? "light_mode" : "dark_mode"; // Update icon
}

// --- Color Utils ---

function hslToHex(h, s, l) {  // Convert HSL to Hex
  l /= 100; // Convert to decimal (0-1)
  const a = (s * Math.min(l, 1 - l)) / 100; // Calculate alpha
  const f = (n) => { // Interpolate color
    const k = (n + h / 30) % 12; // Wrap hue around
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); // Interpolate
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase(); // Return hex
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min; // Random int
}

function generateHSL(hueOverride = null) {
  // If hue is provided, vary it slightly (+/- 10) for natural feel
  const h =   
    hueOverride !== null
      ? (hueOverride + randomInt(-10, 10)) % 360
      : randomInt(0, 360); // Random hue
  return { h: h, s: randomInt(50, 95), l: randomInt(40, 70) };
}

// --- Harmonies (Restricted to Mono, Analogous, Comp) ---

//base, base-light, comp, comp-dark, comp-light are
const harmonies = {
  Analogous: (hueOverride) => {
    const base = generateHSL(hueOverride);
    return Array.from({ length: 5 }, (_, i) => { // this means that the array will have 5 colors and the _ is the index
      return hslToHex((base.h + i * 30) % 360, base.s, base.l); // this means that the hue will be 30 degrees apart
    });
  },
  Monochromatic: (hueOverride) => {
    const base = generateHSL(hueOverride);
    return Array.from({ length: 5 }, (_, i) => { // this means that the array will have 5 colors and the _ is the index
      const l = Math.max(15, Math.min(95, base.l + (i * 15 - 30))); //this means that the lightness value is between 15 and 95
      return hslToHex(base.h, base.s, l); // this means that the saturation will be 15% and the lightness will be 40%
    });
  },
  Complementary: (hueOverride) => {
    const base = generateHSL(hueOverride);
    // Base, Base-Light, Compl, Compl-Dark, Compl-Light
    return [0, 0, 180, 180, 180].map((deg, i) => { // the values are the degrees of the hue and the index is the position of the color
      let l = base.l; // this is the lightness value
      if (i === 1) l += 20; // if the index is 1, add 20 to the lightness value
      if (i === 3) l -= 20; // if the index is 3, subtract 20 from the lightness value
      if (i === 4) l += 25; // if the index is 4, add 25 to the lightness value
      return hslToHex(
        (base.h + deg) % 360,// this is the hue value
        base.s,// this is the saturation value
        Math.min(95, Math.max(5, l))// this is the lightness value
      );
    });
  },
};

// --- Render Logic ---

// --- Render Logic ---

// --- Render Logic ---

//hueOverride is the hue value that is passed to the generateHSL function
//if it is null, it will generate a random hue
function renderPalette(hueOverride = null) { // Render palette
  // 1. Pick Harmony
  const keys = Object.keys(harmonies); // This means that the keys are the names of the harmonies
  const harmonyName = keys[randomInt(0, keys.length - 1)]; // This means that the harmony name is random
  const colors = harmonies[harmonyName](hueOverride); // Get colors

  // 2. Update UI
  elements.harmonyLabel.textContent = harmonyName; // Set label

  // Ensure we have exactly 5 cards
  const existingCards = Array.from(
    elements.container.querySelectorAll(".swatch-card")
  ); // Get existing cards

  // If not enough cards (e.g. init), create them
  if (existingCards.length < 5) {
    for (let i = existingCards.length; i < 5; i++) {
      const card = createCard(colors[i], i); // Create card
      elements.container.appendChild(card); // Add to container
      existingCards.push(card); // Add to list
    }
  }

  // Update ALL 5 cards
  existingCards.forEach((card, index) => {
    const color = colors[index]; // Get color
    const preview = card.querySelector(".color-preview"); // Get preview
    const hexCode = card.querySelector(".hex-code"); // Get hex code
    const copyBtn = card.querySelector(".copy-icon"); // Get copy button

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
        { transform: "scale(1)" }, // this is the initial state
        { transform: "scale(0.97)" }, // this is the middle state
        { transform: "scale(1)" }, // this is the final state
      ],
      {
        duration: 200,
        easing: "ease-out",
      }
    );
  });
}

function createCard(color, index) { // Create card
  const card = document.createElement("div");
  card.className = "swatch-card";
  card.style.animation = `cardEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards ${ 
    index * 0.1 // this means that the animation will start after 0.1 seconds
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
  card.onclick = () => copyToClipboard(color); // Copy color
  return card;
}

// --- Chat Logic & NLP ---

// Dictionary
const moodDict = { // Mood dictionary- it maps moods to hue values
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
  const text = elements.chatInput.value.trim().toLowerCase(); // this means that the text is trimmed and converted to lowercase 
  if (!text) return;

  // 1. Add User Message
  addMessage(elements.chatInput.value, "user");
  elements.chatInput.value = "";

  // 2. Simple NLP Matching
  let matchedHue = null;
  let keywordFound = null;

  for (const [key, hue] of Object.entries(moodDict)) { // Iterate through dictionary
    if (text.includes(key)) { // Check if text contains key
      matchedHue = hue; // Matched hue
      keywordFound = key; // Keyword found
      break;
    }
  }

  // 3. Bot Response & Action
  setTimeout(() => {
    if (matchedHue !== null) {
      renderPalette(matchedHue); // Render palette
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

function addMessage(text, sender) { // Add message to chat
  const div = document.createElement("div");
  div.className = `msg ${sender}`; // Set class
  div.innerHTML = `<p>${text}</p>`; // Set text
  elements.chatMessages.appendChild(div); // Add to chat
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight; // Scroll to bottom
}

// --- Interactions ---

function copyToClipboard(hex) { // Copy to clipboard
  navigator.clipboard.writeText(hex).then(() => {
    showToast(hex); // Show toast
  });
}

function showToast(hex) { // Show toast
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
    renderPalette(); // Render palette
  }
  if (e.key === "Enter" && document.activeElement === elements.chatInput) { // Enter key
    processChat(); // Process chat
  }
});

// Chat Toggles & Chips
elements.chatToggle.addEventListener("click", () => {
  elements.chatWidget.classList.toggle("minimized"); // Toggle chat
});
elements.sendBtn.addEventListener("click", processChat); // Send button

elements.chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    elements.chatInput.value = chip.dataset.val; // Or chip.textContent for nice casing
    processChat();
  });
});

// Init
renderPalette(); // Render palette
