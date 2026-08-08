window.checkAnswers = function() {
  const mapping = window.__correctAnswers || window.correctAnswers;
  if (!mapping) {
    console.warn('No correct answers mapping found for this quiz.');
    return;
  }

  const keys = Array.isArray(mapping)
    ? mapping.map((_, index) => `q${index + 1}`)
    : Object.keys(mapping);

  let score = 0;
  let answered = 0;

  keys.forEach(key => {
    const selected = document.querySelector(`input[name="${key}"]:checked`);
    if (selected) answered += 1;

    const expected = Array.isArray(mapping)
      ? mapping[parseInt(key.slice(1), 10) - 1]
      : mapping[key];

    if (selected && selected.value === expected) {
      score += 1;
    }
  });

  const resultBox = document.getElementById('result') || document.getElementById('score') || document.querySelector('.result-box');
  if (!resultBox) {
    return score;
  }

  const total = keys.length;
  const percent = Math.round((score / total) * 100);
  const status = percent >= 90
    ? 'Mastery unlocked! 🌟'
    : percent >= 70
      ? 'Great work! 👍'
      : percent >= 50
        ? 'Keep practicing to improve.'
        : 'Review the material and try again.';

  resultBox.classList.add('result-box');
  resultBox.innerHTML = `
    <div class="result-summary">
      <span>${status}</span>
      <strong>${score}/${total}</strong>
      <small>${percent}% correct</small>
    </div>
    ${answered < total ? `<p class="result-hint">${total - answered} question${total - answered === 1 ? '' : 's'} left unanswered.</p>` : ''}
  `;

  return score;
};
