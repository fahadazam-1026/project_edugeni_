const modes = {
  explain: {
    title: 'Explain a concept',
    description: 'A clear, beginner-friendly explanation, right when you need one.',
    label: 'What would you like to understand?',
    hint: 'A topic is a great place to start.',
    placeholder: 'Try “How does photosynthesis work?”',
    endpoint: '/explain',
    key: 'topic',
    resultTitle: 'A clearer explanation'
  },
  qa: {
    title: 'Ask a question',
    description: 'Get a direct answer, with the context that makes it stick.',
    label: 'What question is on your mind?',
    hint: 'Ask one question at a time for a focused answer.',
    placeholder: 'Try “Why do seasons change?”',
    endpoint: '/qa',
    key: 'question',
    resultTitle: 'Your answer'
  },
  quiz: {
    title: 'Generate a quiz',
    description: 'Practice with three questions and check your understanding.',
    label: 'Enter a topic or paste your study material',
    hint: 'Your quiz will include 3 multiple-choice questions.',
    placeholder: 'Add a topic or paste a section from your notes…',
    endpoint: '/quiz',
    key: 'text',
    resultTitle: 'Your practice quiz'
  },
  summary: {
    title: 'Summarize notes',
    description: 'Turn a big block of study material into revision-ready notes.',
    label: 'Paste the material you want to review',
    hint: 'Include the important context for a useful summary.',
    placeholder: 'Paste a paragraph, lecture notes, or a study passage…',
    endpoint: '/summarize',
    key: 'text',
    resultTitle: 'Your revision notes'
  },
  path: {
    title: 'Build a learning path',
    description: 'Get a useful sequence from the first steps to advanced study.',
    label: 'What would you like to learn?',
    hint: 'We’ll organize it from beginner to advanced.',
    placeholder: 'Try “Python programming” or “World history”',
    endpoint: '/learn/recommendations',
    key: 'topic',
    resultTitle: 'Your learning path'
  }
};

const cards = [...document.querySelectorAll('.tool-card')];
const form = document.querySelector('#learning-form');
const input = document.querySelector('#learning-input');
const resultRegion = document.querySelector('#result-region');
const generateButton = document.querySelector('#generate-button');
let activeMode = 'explain';

function selectMode(modeName) {
  const mode = modes[modeName];
  if (!mode) return;
  activeMode = modeName;
  cards.forEach((card) => {
    const selected = card.dataset.mode === modeName;
    card.classList.toggle('is-active', selected);
    card.setAttribute('aria-selected', String(selected));
    card.tabIndex = selected ? 0 : -1;
  });
  document.querySelector('#active-tool-title').textContent = mode.title;
  document.querySelector('#active-tool-description').textContent = mode.description;
  document.querySelector('#input-label').textContent = mode.label;
  document.querySelector('#input-hint').textContent = mode.hint;
  input.placeholder = mode.placeholder;
  input.maxLength = modeName === 'summary' || modeName === 'quiz' ? 20000 : 4000;
  resultRegion.replaceChildren();
}

cards.forEach((card, index) => {
  card.addEventListener('click', () => selectMode(card.dataset.mode));
  card.addEventListener('keydown', (event) => {
    if (!['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
    event.preventDefault();
    const offset = event.key === 'ArrowRight' ? 1 : -1;
    const nextCard = cards[(index + offset + cards.length) % cards.length];
    nextCard.focus();
    selectMode(nextCard.dataset.mode);
  });
});

function addResultHeading(title) {
  const heading = document.createElement('h3');
  heading.className = 'result-title';
  heading.textContent = title;
  resultRegion.append(heading);
}

function renderFormattedText(text, container) {
  const lines = text.split(/\r?\n/);
  let currentList = null;
  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      currentList = null;
      return;
    }
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    const bulletMatch = line.match(/^(?:[-*•])\s+(.+)/);
    if (headingMatch) {
      const heading = document.createElement('h3');
      heading.textContent = headingMatch[1];
      container.append(heading);
      currentList = null;
    } else if (bulletMatch) {
      if (!currentList) {
        currentList = document.createElement('ul');
        container.append(currentList);
      }
      const item = document.createElement('li');
      item.textContent = bulletMatch[1];
      currentList.append(item);
    } else {
      const paragraph = document.createElement('p');
      paragraph.textContent = line;
      container.append(paragraph);
      currentList = null;
    }
  });
}

function showTextResult(text, title) {
  addResultHeading(title);
  const content = document.createElement('div');
  content.className = 'result-copy';
  renderFormattedText(text, content);
  resultRegion.append(content);
}

function showError(message) {
  resultRegion.replaceChildren();
  const error = document.createElement('div');
  error.className = 'error-message';
  error.setAttribute('role', 'alert');
  error.textContent = message;
  resultRegion.append(error);
}

function renderQuiz(quiz) {
  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length !== 3) {
    throw new Error('The quiz response was incomplete. Please try generating it again.');
  }
  addResultHeading(modes.quiz.resultTitle);
  const quizForm = document.createElement('form');
  quizForm.id = 'quiz-answer-form';
  quiz.questions.forEach((question, questionIndex) => {
    if (!question || typeof question.question !== 'string' || !Array.isArray(question.options) || question.options.length !== 4) {
      throw new Error('One of the quiz questions could not be displayed. Please try again.');
    }
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'quiz-question';
    const legend = document.createElement('legend');
    legend.textContent = `${questionIndex + 1}. ${question.question}`;
    fieldset.append(legend);
    question.options.forEach((option, optionIndex) => {
      const label = document.createElement('label');
      label.className = 'quiz-option';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = `question-${questionIndex}`;
      radio.value = option;
      radio.id = `question-${questionIndex}-option-${optionIndex}`;
      const text = document.createElement('span');
      text.textContent = option;
      label.append(radio, text);
      fieldset.append(label);
    });
    quizForm.append(fieldset);
  });
  const submit = document.createElement('button');
  submit.className = 'generate-button submit-quiz';
  submit.type = 'submit';
  submit.textContent = 'Check my answers';
  quizForm.append(submit);
  quizForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const score = quiz.questions.reduce((total, question, index) => {
      const selected = quizForm.querySelector(`input[name="question-${index}"]:checked`);
      return total + (selected?.value === question.answer ? 1 : 0);
    }, 0);
    const previousScore = quizForm.querySelector('.quiz-score');
    if (previousScore) previousScore.remove();
    const scoreMessage = document.createElement('p');
    scoreMessage.className = 'quiz-score';
    scoreMessage.setAttribute('role', 'status');
    scoreMessage.textContent = `Your Score: ${score} / ${quiz.questions.length}`;
    quizForm.prepend(scoreMessage);

    quiz.questions.forEach((question, index) => {
      const fieldset = quizForm.querySelectorAll('.quiz-question')[index];
      fieldset.querySelectorAll('.quiz-option').forEach((label) => {
        const radio = label.querySelector('input');
        if (radio.value === question.answer) label.classList.add('is-correct');
        else if (radio.checked) label.classList.add('is-wrong');
      });
      const feedback = document.createElement('p');
      feedback.className = 'quiz-feedback';
      feedback.textContent = `Answer: ${question.answer}. ${question.explanation}`;
      fieldset.append(feedback);
    });
    submit.disabled = true;
  });
  resultRegion.append(quizForm);
}

function renderLearningPath(data) {
  if (!data || !Array.isArray(data.levels) || data.levels.length !== 3) {
    throw new Error('The learning path response was incomplete. Please try again.');
  }
  addResultHeading(modes.path.resultTitle);
  const levels = document.createElement('div');
  levels.className = 'learning-levels';
  data.levels.forEach((level, index) => {
    const card = document.createElement('article');
    card.className = 'level-card';
    const step = document.createElement('span');
    step.className = 'level-step';
    step.textContent = `STEP 0${index + 1}`;
    const title = document.createElement('h3');
    title.textContent = level.level;
    const description = document.createElement('p');
    description.textContent = level.description;
    card.append(step, title, description);
    const topicList = document.createElement('ul');
    (level.topics || []).forEach((topic) => {
      const item = document.createElement('li');
      item.textContent = topic;
      topicList.append(item);
    });
    card.append(topicList);
    if (Array.isArray(level.resources) && level.resources.length) {
      const resourceHeading = document.createElement('p');
      resourceHeading.className = 'resource-title';
      resourceHeading.textContent = 'SUGGESTED RESOURCES';
      const resourceList = document.createElement('ul');
      resourceList.className = 'resource-list';
      level.resources.forEach((resource) => {
        const item = document.createElement('li');
        item.textContent = resource;
        resourceList.append(item);
      });
      card.append(resourceHeading, resourceList);
    }
    levels.append(card);
  });
  resultRegion.append(levels);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const mode = modes[activeMode];
  const value = input.value.trim();
  if (!value) {
    input.setCustomValidity('Please enter some text to get started.');
    input.reportValidity();
    return;
  }
  input.setCustomValidity('');
  resultRegion.replaceChildren();
  const loading = document.createElement('p');
  loading.className = 'result-copy';
  loading.setAttribute('role', 'status');
  loading.textContent = 'Thinking...';
  resultRegion.append(loading);
  generateButton.disabled = true;
  generateButton.querySelector('span:first-child').textContent = 'Working on it…';

  try {
    const response = await fetch(mode.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [mode.key]: value })
    });
    const data = await response.json();
    if (!response.ok) {
      const detail = typeof data.detail === 'string' ? data.detail : 'Please check your input and try again.';
      throw new Error(detail);
    }
    resultRegion.replaceChildren();
    if (activeMode === 'quiz') renderQuiz(data);
    else if (activeMode === 'path') renderLearningPath(data);
    else if (typeof data.result === 'string') showTextResult(data.result, mode.resultTitle);
    else throw new Error('The response was not in the expected format. Please try again.');
  } catch (error) {
    showError(error instanceof TypeError ? 'Could not reach EduGenie. Check your connection and try again.' : error.message);
  } finally {
    generateButton.disabled = false;
    generateButton.querySelector('span:first-child').textContent = 'Generate with Gemini';
  }
});

input.addEventListener('input', () => input.setCustomValidity(''));