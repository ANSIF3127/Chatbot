// this for lodding affect
window.addEventListener("load", function () {
  const loader = document.getElementById("loader");
  const mainContent = document.getElementById("main-content");

  loader.style.display = "none";
  mainContent.style.display = "block";
});
// Theme Toggle Function
const themeToggle = document.getElementById("theme-switch");
const body = document.body;

// Check for saved theme preference - removed localStorage usage
let currentTheme = "light";

// Theme toggle event listener
themeToggle.addEventListener("change", function () {
  if (this.checked) {
    body.classList.add("dark-mode");
    currentTheme = "dark";
  } else {
    body.classList.remove("dark-mode");
    currentTheme = "light";
  }
});

// Chat functionality
const messagesArea = document.getElementById("messages-area");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");

// Auto-resize textarea
userInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 120) + "px";

  // Enable/disable send button based on input
  if (this.value.trim()) {
    sendButton.disabled = false;
  } else {
    sendButton.disabled = true;
  }
});

// Send message on Enter key (without Shift)
userInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Sending button click event
sendButton.addEventListener("click", sendMessage);

function addMessage(content, isUser = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user-message" : "ai-message"}`;

  const currentTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Remove welcome message if it exists
  const welcomeMessage = messagesArea.querySelector(".welcome-message");
  if (welcomeMessage) {
    welcomeMessage.remove();
  }

  if (isUser) {
    messageDiv.innerHTML = `
                    <div class="message-content">
                        <div class="message-bubble user-bubble">
                            <p>${content}</p>
                        </div>
                        <div class="message-time">${currentTime}</div>
                    </div>
                    <div class="message-avatar user-avatar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                `;
  } else {
    messageDiv.innerHTML = `
                    <div class="message-avatar">
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="8" width="18" height="13" rx="2" ry="2"/>
        <circle cx="7" cy="13" r="1"/>
        <circle cx="17" cy="13" r="1"/>
        <path d="M12 2v4M8 2h8"/>
      </svg>
                    </div>
                    <div class="message-content">
                        <div class="message-bubble ai-bubble">
                            <p>${content}</p>
                        </div>
                        <div class="message-time">${currentTime}</div>
                    </div>
                `;
  }

  messagesArea.appendChild(messageDiv);
  scrollToBottom();
}

function showTypingIndicator() {
  const typingDiv = document.createElement("div");
  typingDiv.className = "message ai-message typing-indicator";
  typingDiv.id = "typing-indicator";
  typingDiv.innerHTML = `
                <div class="message-avatar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="8" width="18" height="13" rx="2" ry="2"/>
        <circle cx="7" cy="13" r="1"/>
        <circle cx="17" cy="13" r="1"/>
        <path d="M12 2v4M8 2h8"/>
      </svg>
                </div>
                <div class="message-content">
                    <div class="message-bubble ai-bubble">
                        <div class="typing-dots">
                            <div class="dot"></div>
                            <div class="dot"></div>
                            <div class="dot"></div>
                        </div>
                    </div>
                </div>
            `;

  messagesArea.appendChild(typingDiv);
  scrollToBottom();
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (message === "") return;

  // Disable input and button during processing
  userInput.disabled = true;
  sendButton.disabled = true;
  sendButton.innerHTML = '<span style="font-size: 20px;">⋯</span>';

  // Add user message
  addMessage(message, true);
  userInput.value = "";
  userInput.style.height = "auto";

  // Show typing indicator
  showTypingIndicator();

  try {
    const response = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Hide typing indicator
    hideTypingIndicator();

    // Add bot response
    addMessage(data.reply);
  } catch (error) {
    console.error("Error:", error);
    hideTypingIndicator();
    addMessage(
      "Sorry, I'm having trouble connecting right now. Please try again."
    );
  } finally {
    // Re-enable input and button
    userInput.disabled = false;
    sendButton.disabled = true; // Will be enabled when user types
    sendButton.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                `;
    userInput.focus();
  }
}

// Scroll to bottom of messages
function scrollToBottom() {
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Initialize send button state
sendButton.disabled = true;

// Focus on input when page loads
window.addEventListener("load", function () {
  userInput.focus();
});
