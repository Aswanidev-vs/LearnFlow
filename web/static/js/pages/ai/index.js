import { createElement, clearElement, escapeHtml } from '../../utils/dom.js';
import { chatService } from '../../services/index.js';
import { ChatActions } from '../../store/actions.js';
import { store } from '../../store/index.js';
import MockData from '../../services/mockData.js';
import { icon } from '../../utils/icons.js';

export async function renderAIChatPage(container) {
  clearElement(container);

  const existingMessages = store.getState('aiChat.messages');
  if (!existingMessages || existingMessages.length === 0) {
    MockData.aiMessages.forEach((msg) => ChatActions.addMessage(msg));
  }

  renderChat(container);
}

function renderChat(container) {
  const page = createElement('div', { className: 'chat-page' });

  // --- Sidebar ---
  const sidebar = createElement('aside', {
    className: 'sidebar',
    role: 'navigation',
    'aria-label': 'AI chat categories',
    style: 'padding-top: var(--sp-6);',
  }, [
    createElement('div', { className: 'px-4 mb-6' }, [
      createElement('h3', { className: 'font-display font-semibold text-sm flex items-center gap-2' }, [
        createElement('span', { innerHTML: icon('robot'), 'aria-hidden': 'true' }),
        createElement('span', { textContent: 'AI Assistant' }),
      ]),
      createElement('button', {
        className: 'btn btn--glass btn--sm mt-4 w-full',
        textContent: '+ New Chat',
        onClick: () => {
          ChatActions.clearMessages();
          ChatActions.addMessage({
            role: 'assistant',
            content: "Hello! I'm your AI learning assistant. How can I help you today?",
          });
          const messagesEl = page.querySelector('#chat-messages');
          if (messagesEl) renderMessages(messagesEl);
        },
      }),
    ]),
    createElement('nav', { className: 'sidebar__nav' }, [
      createElement('ul', { className: 'sidebar__list' }, [
        createSidebarItem(icon('messageSquare') || '💬', 'General Help'),
        createSidebarItem(icon('pen'), 'Code Review'),
        createSidebarItem(icon('target'), 'Study Plan'),
        createSidebarItem(icon('bug') || '🐛', 'Debug Help'),
        createSidebarItem(icon('lightbulb') || '💡', 'Concept Explanation'),
      ]),
    ]),
    createElement('div', { className: 'sidebar__footer' }, [
      createElement('p', { className: 'text-muted text-xs', textContent: 'Powered by OpenAI / Claude API' }),
    ]),
  ]);

  // --- Main Chat Area ---
  const main = createElement('div', { className: 'app__content' });

  const header = createElement('div', {
    className: 'flex items-center justify-between px-6 py-4',
    style: 'border-bottom: 1px solid var(--border-default); background: var(--bg-surface);',
  }, [
    createElement('h2', { className: 'font-display font-semibold', textContent: 'AI Learning Assistant' }),
    createElement('span', { className: 'badge badge--success', textContent: '● Online' }),
  ]);

  const messagesContainer = createElement('div', {
    className: 'chat-messages',
    id: 'chat-messages',
    role: 'log',
    'aria-label': 'Chat messages',
    'aria-live': 'polite',
  });
  renderMessages(messagesContainer);

  const inputArea = createElement('div', { className: 'chat-input' }, [
    createElement('form', { className: 'chat-input__form', id: 'chat-form', role: 'search' }, [
      createElement('textarea', {
        className: 'chat-input__field',
        placeholder: 'Ask me anything about your courses, coding concepts, or learning path...',
        id: 'chat-input',
        rows: '1',
        'aria-label': 'Type your message',
      }),
      createElement('button', {
        className: 'btn btn--primary',
        type: 'submit',
        'aria-label': 'Send message',
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
    const messageEl = createElement('div', {
      className: `chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`,
    }, [
      !isUser && createElement('div', {
        className: 'chat-message__avatar',
        innerHTML: icon('robot'),
        'aria-hidden': 'true',
      }),
      createElement('div', { className: 'chat-message__content' }, [
        createElement('div', { className: 'chat-message__text prose', innerHTML: formatMessageContent(msg.content) }),
        createElement('span', { className: 'chat-message__time text-muted text-xs mt-1', textContent: formatTime(msg.timestamp) }),
      ]),
    ]);
    container.appendChild(messageEl);
  });

  if (isTyping) {
    container.appendChild(
      createElement('div', { className: 'chat-message chat-message--assistant' }, [
        createElement('div', {
          className: 'chat-message__avatar',
          innerHTML: icon('robot'),
          'aria-hidden': 'true',
        }),
        createElement('div', { className: 'chat-message__content' }, [
          createElement('div', { className: 'typing-indicator', 'aria-label': 'AI is typing' }, [
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
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => `<pre class="code-block"><code>${escapeHtml(code)}</code></pre>`)
    .replace(/`([^`]+)`/g, (_, code) => `<code class="inline-code">${escapeHtml(code)}</code>`)
    .split('\n')
    .map((line) => escapeHtml(line))
    .join('<br>');
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createSidebarItem(iconContent, label) {
  return createElement('li', {}, [
    createElement('button', {
      className: 'sidebar__link w-full',
      'aria-label': label,
    }, [
      createElement('span', { className: 'sidebar__icon', innerHTML: iconContent, 'aria-hidden': 'true' }),
      createElement('span', { textContent: label }),
    ]),
  ]);
}
