const input        = document.getElementById('todoInput');
const addBtn       = document.getElementById('addBtn');
const prioritySel  = document.getElementById('prioritySelect');
const dueDateInput = document.getElementById('dueDateInput');
const todoList     = document.getElementById('todoList');
const footer       = document.getElementById('footer');
const remaining    = document.getElementById('remaining');
const clearBtn     = document.getElementById('clearCompleted');
const darkToggle   = document.getElementById('darkToggle');
const counterBadge = document.getElementById('counterBadge');
const emptyState   = document.getElementById('emptyState');

let todos = JSON.parse(localStorage.getItem('todos') || '[]');
let dragSrcIndex = null;

// ── Dark mode ──
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
darkToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

darkToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  darkToggle.textContent = next === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('theme', next);
});

// ── Helpers ──
function save() { localStorage.setItem('todos', JSON.stringify(todos)); }

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Render ──
function render() {
  todoList.innerHTML = '';

  const done  = todos.filter(t => t.done).length;
  const total = todos.length;
  counterBadge.textContent = `${done} / ${total} done`;

  emptyState.classList.toggle('show', total === 0);
  footer.style.display = total ? 'flex' : 'none';

  const left = todos.filter(t => !t.done).length;
  remaining.textContent = `${left} task${left !== 1 ? 's' : ''} remaining`;

  todos.forEach((todo, i) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');
    li.draggable = true;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => {
      todos[i].done = checkbox.checked;
      save(); render();
    });

    // Text wrap
    const wrap = document.createElement('div');
    wrap.className = 'todo-text-wrap';

    // Editable task text (double-click to edit)
    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = todo.text;
    span.title = 'Double-click to edit';
    span.addEventListener('dblclick', () => {
      span.contentEditable = 'true';
      span.focus();
      const range = document.createRange();
      range.selectNodeContents(span);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    });
    span.addEventListener('blur', () => {
      span.contentEditable = 'false';
      todos[i].text = span.textContent.trim() || todo.text;
      save();
    });
    span.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); span.blur(); }
      if (e.key === 'Escape') { span.textContent = todo.text; span.blur(); }
    });

    // Meta row (badge + due date)
    const meta = document.createElement('div');
    meta.className = 'task-meta';

    const badge = document.createElement('span');
    badge.className = `badge badge-${todo.priority || 'medium'}`;
    badge.textContent = todo.priority || 'medium';
    meta.appendChild(badge);

    if (todo.dueDate) {
      const due = document.createElement('span');
      due.className = 'due-date' + (isOverdue(todo.dueDate) && !todo.done ? ' overdue' : '');
      due.textContent = (isOverdue(todo.dueDate) && !todo.done ? '⚠️ ' : '📅 ') + formatDate(todo.dueDate);
      meta.appendChild(due);
    }

    wrap.appendChild(span);
    wrap.appendChild(meta);

    // Delete
    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.textContent = '×';
    del.addEventListener('click', () => { todos.splice(i, 1); save(); render(); });

    li.appendChild(checkbox);
    li.appendChild(wrap);
    li.appendChild(del);
    todoList.appendChild(li);

    // ── Drag to reorder ──
    li.addEventListener('dragstart', () => { dragSrcIndex = i; li.classList.add('dragging'); });
    li.addEventListener('dragend',   () => li.classList.remove('dragging'));
    li.addEventListener('dragover',  e => { e.preventDefault(); li.classList.add('drag-over'); });
    li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
    li.addEventListener('drop', e => {
      e.preventDefault();
      li.classList.remove('drag-over');
      if (dragSrcIndex === null || dragSrcIndex === i) return;
      const moved = todos.splice(dragSrcIndex, 1)[0];
      todos.splice(i, 0, moved);
      dragSrcIndex = null;
      save(); render();
    });
  });
}

// ── Add task ──
function addTodo() {
  const text = input.value.trim();
  if (!text) return;
  todos.push({ text, done: false, priority: prioritySel.value, dueDate: dueDateInput.value });
  input.value = '';
  dueDateInput.value = '';
  prioritySel.value = 'medium';
  save(); render();
}

addBtn.addEventListener('click', addTodo);
input.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

clearBtn.addEventListener('click', () => {
  if (!confirm('Clear all completed tasks?')) return;
  todos = todos.filter(t => !t.done);
  save(); render();
});

render();
