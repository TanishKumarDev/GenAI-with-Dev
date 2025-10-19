// Frontend script: Handles UI interactions, localStorage persistence, and API calls
// Why? Separates JS logic from HTML for maintainability
// How? Event listeners + async fetch; localStorage for client-side "memory"

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements: Cache for performance
  const chatBox = document.getElementById('chat-box');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const clearButton = document.getElementById('clear-button');

  // Conversation history: Loaded from/saved to localStorage for persistence
  // Why? Allows AI to "remember" across page reloads (sent to backend as context)
  // How? JSON array of {sender, text}; limit to 20 msgs to avoid token overflow
  let conversationHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];

  // Load history into UI on startup
  // Why? Restores previous chat flow
  // How? Loop through history and append messages
  conversationHistory.forEach((msg) => appendMessage(msg.sender, msg.text));

  // Append message to UI (user/bot bubbles)
  // Why? Creates visual chat bubbles with avatars for better UX
  // How? Dynamic HTML with Tailwind classes; auto-scroll to bottom
  function appendMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'user' ? 'justify-end' : 'justify-start');
    
    // Tailwind classes for responsive bubbles: max-w-4/5 for wrapping
    messageDiv.innerHTML = `
      <div class="message-avatar w-8 h-8 rounded-full bg-${sender === 'user' ? 'accent' : 'gray-600'} flex items-center justify-center flex-shrink-0 mr-2 text-sm">
        ${sender === 'user' ? '🧑‍💻' : '🤖'}
      </div>
      <div class="message-bubble max-w-[80%] p-3 rounded-lg ${sender === 'user' ? 'bg-accent text-white ml-auto rounded-br-sm' : 'bg-gray-700 text-gray-200 rounded-bl-sm'}">
        ${text}
      </div>
    `;
    
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;  // Auto-scroll to latest message

    // Persist to localStorage (limit to last 20 for efficiency)
    conversationHistory.push({ sender, text });
    localStorage.setItem('chatHistory', JSON.stringify(conversationHistory.slice(-20)));
  }

  // Show "Thinking..." state
  // Why? Improves perceived performance during API latency
  // How? Temporary bot message; remove on response
  function showThinking() {
    const thinkingDiv = document.createElement('div');
    thinkingDiv.id = 'thinking';
    thinkingDiv.classList.add('message', 'justify-start');
    thinkingDiv.innerHTML = `
      <div class="message-avatar w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 mr-2 text-sm">🤖</div>
      <div class="message-bubble max-w-[80%] p-3 rounded-lg bg-gray-700 text-gray-200 rounded-bl-sm">Thinking...</div>
    `;
    chatBox.appendChild(thinkingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return thinkingDiv;
  }

  function hideThinking() {
    const thinkingEl = document.getElementById('thinking');
    if (thinkingEl) thinkingEl.remove();
  }

  // Send message function: Core handler for user input
  // Why? Centralizes API call + error handling
  // How? Async fetch to backend with history for context; handle thinking state
  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;  // Skip empty messages

    // Add user message immediately for responsive feel
    appendMessage('user', message);
    userInput.value = '';  // Clear input
    const thinkingEl = showThinking();  // Show loading state

    try {
      // Fetch to backend: Send message + recent history for AI memory
      // Why? Backend proxies Groq + adds real-time (date) context
      // How? JSON body; error if backend down
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message, 
          history: conversationHistory.slice(-10)  // Send last 10 for context (parallel processing in backend)
        })
      });

      if (!response.ok) throw new Error('Backend error');

      const { reply } = await response.json();
      hideThinking();
      appendMessage('bot', reply || 'No response from AI.');
    } catch (error) {
      hideThinking();
      appendMessage('bot', 'Error: Could not connect to server. Check console.');
      console.error('Send error:', error);
    }
  }

  // Event listeners: Button click + Enter key for send
  // Why? Dual input methods for better UX (keyboard warriors love Enter)
  // How? addEventListener; preventDefault on Enter to avoid newline
  sendButton.addEventListener('click', sendMessage);

  userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();  // Prevent input newline
      sendMessage();
    }
  });

  clearButton.addEventListener('click', () => {
    localStorage.removeItem('chatHistory');
    chatBox.innerHTML = '';  // Clear UI
    conversationHistory = [];  // Reset array
  });
  
  // Optional: Clear chat (add <button id="clear">Clear Chat</button> to input div if wanted)
  // document.getElementById('clear').addEventListener('click', () => {
  //   localStorage.removeItem('chatHistory');
  //   chatBox.innerHTML = '';
  //   conversationHistory = [];
  // });
});