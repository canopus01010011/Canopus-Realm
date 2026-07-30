const addButton = document.getElementById('add-task');
const clearButton = document.getElementById('clear-all');
const taskInput = document.getElementById('new-task');
const taskDate = document.getElementById('task-date');
const taskList = document.getElementById('task-list');

window.onload = () => {
  const savedTasks = JSON.parse(localStorage.getItem("tasks")) || {};
  for (let date in savedTasks) {
    savedTasks[date].forEach(task => addTaskToUI(task.text, date, task.completed));
  }
};

addButton.onclick = () => {
  const taskText = taskInput.value.trim();
  const dateValue = taskDate.value;
  if (taskText !== "" && dateValue !== "") {
    addTaskToUI(taskText, dateValue);
    saveTasks();
    taskInput.value = "";
    taskDate.value = "";
  }
};

clearButton.onclick = () => {
  taskList.innerHTML = "";
  localStorage.removeItem("tasks");
};

function addTaskToUI(taskText, dateValue, isCompleted = false) {
  let dateSection = document.getElementById(`date-${dateValue}`);
  
  // If no section for this date, create it
  if (!dateSection) {
    dateSection = document.createElement('div');
    dateSection.id = `date-${dateValue}`;

    const heading = document.createElement('h2');
    heading.textContent = dateValue;
    heading.className = 'date-heading';
    dateSection.appendChild(heading);

    taskList.appendChild(dateSection);
  }

  const li = document.createElement('li');
  li.textContent = taskText;
  if (isCompleted) li.classList.add("completed");

  const buttons = document.createElement('div');
  buttons.className = 'task-buttons';

  const completeBtn = document.createElement('button');
  completeBtn.innerHTML = '✔️';
  completeBtn.onclick = () => {
    li.classList.toggle('completed');
    saveTasks();
  };

  const deleteBtn = document.createElement('button');
  deleteBtn.innerHTML = '❌';
  deleteBtn.onclick = () => {
    li.remove();
    if (dateSection.querySelectorAll('li').length === 0) {
      dateSection.remove();
    }
    saveTasks();
  };

  buttons.appendChild(completeBtn);
  buttons.appendChild(deleteBtn);
  li.appendChild(buttons);
  dateSection.appendChild(li);
}

function saveTasks() {
  const tasks = {};
  document.querySelectorAll('#task-list > div').forEach(dateSection => {
    const date = dateSection.id.replace('date-', '');
    const taskArray = [];
    dateSection.querySelectorAll('li').forEach(li => {
      taskArray.push({
        text: li.firstChild.textContent,
        completed: li.classList.contains('completed')
      });
    });
    if (taskArray.length) tasks[date] = taskArray;
  });
  localStorage.setItem("tasks", JSON.stringify(tasks));
}
