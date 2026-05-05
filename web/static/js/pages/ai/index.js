import { createElement, clearElement } from '../../utils/dom.js';
import { chatService } from '../../services/index.js';
import { ChatActions } from '../../store/actions.js';
import { store } from '../../store/index.js';
import MockData from '../../services/mockData.js';

export async function renderAIChatPage(container) {
  clearElement(container);

  const existingMessages = store.getState('aiChat.messages');
  if (!existingMessages || existingMessages.length === 0) {
    MockData.aiMessages.forEach((msg) => ChatActions.addMessage(msg));
  }

  renderChat(container);
}

function renderChat(container) {
  const page = createElement('div', { className: 'ai-chat' });

  const sidebar = createElement('aside', { className: 'ai-chat__sidebar' }, [
    createElement('div', { className: 'ai-chat__sidebar-header' }, [
      createElement('h3', { textContent: '🤖 AI Assistant' }),
      createElement('button', {
        className: 'btn btn--ghost btn--sm',
        textContent: '+ New Chat',
        onClick: () => {
          ChatActions.clearMessages();
          ChatActions.addMessage({
            role: 'assistant',
            content: "Hello! I'm your AI learning assistant. How can I help you today?",
          });
          const messagesEl = page.querySelector('.ai-chat__messages');
          if (messagesEl) renderMessages(messagesEl);
        },
      }),
    ]),
    createElement('div', { className: 'ai-chat__sidebar-nav' }, [
      createSidebarItem('💬', 'General Help'),
      createSidebarItem('📝', 'Code Review'),
      createSidebarItem('🎯', 'Study Plan'),
      createSidebarItem('🐛', 'Debug Help'),
      createSidebarItem('💡', 'Concept Explanation'),
    ]),
    createElement('div', { className: 'ai-chat__sidebar-footer' }, [
      createElement('p', { className: 'text-muted text-sm', textContent: 'Powered by OpenAI / Claude API' }),
    ]),
  ]);

  const main = createElement('div', { className: 'ai-chat__main' });

  const header = createElement('div', { className: 'ai-chat__header' }, [
    createElement('h2', { textContent: 'AI Learning Assistant' }),
    createElement('span', { className: 'ai-chat__status', textContent: '● Online' }),
  ]);

  const messagesContainer = createElement('div', { className: 'ai-chat__messages', id: 'chat-messages' });
  renderMessages(messagesContainer);

  const inputArea = createElement('div', { className: 'ai-chat__input-area' }, [
    createElement('form', { className: 'ai-chat__form', id: 'chat-form' }, [
      createElement('textarea', {
        className: 'ai-chat__input form-textarea',
        placeholder: 'Ask me anything about your courses, coding concepts, or learning path...',
        id: 'chat-input',
        rows: '1',
      }),
      createElement('button', {
        className: 'btn btn--primary ai-chat__send',
        type: 'submit',
        innerHTML: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
      }),
    ]),
  ]);

  main.append(header, messagesContainer, inputArea);
  page.append(sidebar, main);
  container.appendChild(page);

  const form = page.querySelector('#chat-form');
  const input = page.querySelector('#chat-input');

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event('submit'));
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    ChatActions.addMessage({ role: 'user', content: message });
    input.value = '';
    input.style.height = 'auto';

    renderMessages(messagesContainer);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    ChatActions.setTyping(true);
    renderMessages(messagesContainer);

    try {
      const conversationId = store.getState('aiChat.conversationId');
      const response = await chatService.sendMessage(message, conversationId);
      ChatActions.addMessage({ role: 'assistant', content: response.content });
      if (response.conversationId) ChatActions.setConversationId(response.conversationId);
    } catch (err) {
      ChatActions.addMessage({ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' });
    }

    ChatActions.setTyping(false);
    renderMessages(messagesContainer);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}

function renderMessages(container) {
  const messages = store.getState('aiChat.messages') || [];
  const isTyping = store.getState('aiChat.isTyping');

  container.innerHTML = '';

  messages.forEach((msg) => {
    const isUser = msg.role === 'user';
    const messageEl = createElement('div', { className: `chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}` }, [
      !isUser && createElement('div', { className: 'chat-message__avatar', textContent: '🤖' }),
      createElement('div', { className: 'chat-message__bubble' }, [
        createElement('div', { className: 'chat-message__content', innerHTML: formatMessageContent(msg.content) }),
        createElement('span', { className: 'chat-message__time', textContent: formatTime(msg.timestamp) }),
      ]),
    ]);
    container.appendChild(messageEl);
  });

  if (isTyping) {
    container.appendChild(
      createElement('div', { className: 'chat-message chat-message--assistant' }, [
        createElement('div', { className: 'chat-message__avatar', textContent: '🤖' }),
        createElement('div', { className: 'chat-message__bubble' }, [
          createElement('div', { className: 'typing-indicator' }, [
            createElement('span'),
            createElement('span'),
            createElement('span'),
          ]),
        ]),
      ])
    );
  }

  container.scrollTop = container.scrollHeight;
}

function formatMessageContent(content) {
  return content
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\n/g, '<br>');
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createSidebarItem(icon, label) {
  return createElement('button', { className: 'ai-chat__sidebar-item' }, [
    createElement('span', { textContent: icon }),
    createElement('span', { textContent: label }),
  ]);
}
