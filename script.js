const tableBody = document.getElementById('tableBody');
const totalSizeEl = document.getElementById('totalSize');
const addBtn = document.getElementById('addBtn');
const exportBtn = document.getElementById('exportBtn');
const importInput = document.getElementById('importInput');

let draggedRow = null;

// Storage units (base 1024)
const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB', 'BB'];

// Persistence
function saveData() {
  const rows = [...document.querySelectorAll('.row')].map(row => ({
    name: row.querySelector('.name').value,
    link: row.querySelector('.link').value,
    size: parseFloat(row.querySelector('.size').value) || 0,
    unit: row.querySelector('.unit').value
  }));

  localStorage.setItem('torrents', JSON.stringify(rows));
}

function loadData() {
  const raw = localStorage.getItem('torrents');
  const data = raw ? JSON.parse(raw) : [];

  if (!Array.isArray(data) || data.length === 0) {
    addRow();
    return;
  }

  data.forEach(addRow);
  calculateTotal();
}

// Row handling
function addRow(data = {}) {
  const row = document.createElement('div');
  row.className = 'row grid grid-cols-12 gap-2 items-center p-3 border-b text-sm transition-all duration-200';
  row.draggable = false;

  row.innerHTML = `
    <div class="col-span-1 flex justify-center">
      <span class="drag-handle cursor-grab text-gray-400 select-none" title="Drag">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </span>
    </div>

    <input class="name col-span-2 border rounded px-2 py-1" value="${data.name || ''}" />
    <input class="link col-span-4 border rounded px-2 py-1" value="${data.link || ''}" />

    <div class="col-span-3 flex gap-1">
      <input type="number" min="0" class="size w-full border rounded px-2 py-1" value="${data.size || ''}" />
      <select class="unit border rounded px-1">
        ${UNITS.map(u => `<option ${data.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
      </select>
    </div>

    <div class="col-span-2 flex gap-2">
      <!-- Run -->
      <button class="run bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600" title="Remove">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>
      </button>

      <!-- Duplicate -->
      <button class="duplicate bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600" title="Duplicate">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
      </button>

      <!-- Remove -->
      <button class="remove bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600" title="Remove">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
      </button>

    </div>
  `;

  const nameInput = row.querySelector('.name');
  const handle = row.querySelector('.drag-handle');

  // Drag handle behavior
  handle.addEventListener('mousedown', () => {
    row.draggable = true;
    handle.classList.replace('cursor-grab', 'cursor-grabbing');
  });

  handle.addEventListener('mouseup', () => {
    row.draggable = false;
    handle.classList.replace('cursor-grabbing', 'cursor-grab');
  });

  // Drag events
  row.addEventListener('dragstart', () => {
    draggedRow = row;
    row.classList.add('opacity-50');
  });

  row.addEventListener('dragend', () => {
    row.classList.remove('opacity-50');
    row.draggable = false;
    draggedRow = null;
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    saveData();
  });

  row.addEventListener('dragover', e => {
    e.preventDefault();
    if (!draggedRow || draggedRow === row) return;

    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());

    const indicator = document.createElement('div');
    indicator.className = 'drop-indicator h-0.5 bg-blue-500 col-span-12';

    const rect = row.getBoundingClientRect();
    const offset = e.clientY - rect.top;

    if (offset > rect.height / 2) {
      row.after(indicator);
      row.after(draggedRow);
    } else {
      row.before(indicator);
      row.before(draggedRow);
    }

    // Auto-scroll
    const container = tableBody.getBoundingClientRect();
    if (e.clientY < container.top + 40) tableBody.scrollTop -= 10;
    if (e.clientY > container.bottom - 40) tableBody.scrollTop += 10;
  });

  // Buttons
  row.querySelector('.run').onclick = () => {
    window.open(row.querySelector('.link').value, "_self");
  };

  row.querySelector('.duplicate').onclick = () => {
    addRow({
      name: row.querySelector('.name').value,
      link: row.querySelector('.link').value,
      size: row.querySelector('.size').value,
      unit: row.querySelector('.unit').value
    });
  };

  row.querySelector('.remove').onclick = () => {
    row.remove();
    calculateTotal();
    saveData();
  };

  // Inputs & keyboard
  row.querySelectorAll('input, select').forEach(el => {
    el.oninput = () => {
      calculateTotal();
      saveData();
    };

    el.onkeydown = e => {
      const isAltUp = e.altKey && e.key === 'ArrowUp';
      const isAltDown = e.altKey && e.key === 'ArrowDown';

      if (!isAltUp && !isAltDown) return;

      e.preventDefault();

      const focusedEl = document.activeElement;
      const cursorPos = focusedEl.selectionStart;

      if (isAltUp && row.previousElementSibling) {
        tableBody.insertBefore(row, row.previousElementSibling);
      }

      if (isAltDown && row.nextElementSibling) {
        tableBody.insertBefore(row.nextElementSibling, row);
      }

      // Restore focus AFTER DOM move
      requestAnimationFrame(() => {
        focusedEl.focus();

        // Restore cursor position for inputs
        if (focusedEl.setSelectionRange && cursorPos !== null) {
          focusedEl.setSelectionRange(cursorPos, cursorPos);
        }
      });

      saveData();
    };
  });

  tableBody.appendChild(row);
  calculateTotal();
  saveData();
}

// Size calculation
function toBytes(size, unit) {
  return size * Math.pow(1024, UNITS.indexOf(unit));
}

function calculateTotal() {
  let totalBytes = 0;

  document.querySelectorAll('.row').forEach(row => {
    const size = parseFloat(row.querySelector('.size').value) || 0;
    const unit = row.querySelector('.unit').value;
    totalBytes += toBytes(size, unit);
  });

  let unitIndex = 0;
  let value = totalBytes;

  while (value >= 1024 && unitIndex < UNITS.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  totalSizeEl.textContent = `${value.toFixed(2)} ${UNITS[unitIndex]}`;
}

// Import / Export
exportBtn.onclick = () => {
  const data = localStorage.getItem('torrents') || '[]';
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'torrents.json';
  a.click();
};

importInput.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    localStorage.setItem('torrents', reader.result);
    tableBody.innerHTML = '';
    loadData();
  };
  reader.readAsText(file);
};

// Init
addBtn.onclick = () => addRow();
loadData();