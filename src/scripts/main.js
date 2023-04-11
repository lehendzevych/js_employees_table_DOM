'use strict';

const employeesTable = {
  table: document.querySelector('table'),
  form: document.createElement('form'),
  sortBy: '',
  selectedRow: null,
  initialized: false,
  fields: {
    name: {
      title: 'Name',
      type: 'input',
      input: {
        name: 'name',
        type: 'text',
      },

      validate(value) {
        if (!value) {
          return `Employee's name is required!`;
        }

        if (value.length < 4) {
          return `Employee's name has less than 4 letters!`;
        }

        return true;
      },

      sort: (a, b) => a.localeCompare(b),
    },

    position: {
      title: 'Position',
      type: 'input',
      input: {
        name: 'position',
        type: 'text',
      },

      validate(value) {
        if (!value) {
          return `Employee's position is required!`;
        }

        return true;
      },

      sort: (a, b) => a.localeCompare(b),
    },

    office: {
      title: 'Office',
      type: 'select',
      select: {
        name: 'office',
      },
      options: [
        'Tokyo',
        'Singapore',
        'London',
        'New York',
        'Edinburgh',
        'San Francisco',
      ],

      validate(value) {
        if (!value) {
          return `Employee's office is required!`;
        }

        return true;
      },

      sort: (a, b) => a.localeCompare(b),
    },

    age: {
      title: 'Age',
      type: 'input',
      input: {
        name: 'age',
        type: 'number',
      },

      validate(value) {
        if (!value) {
          return `Employee's age is required!`;
        }

        if (value < 18 || value > 90) {
          return `Employee's age must be from 18 to 90 years old!`;
        }

        return true;
      },

      sort: (a, b) => a - b,
    },

    salary: {
      title: 'Salary',
      type: 'input',
      input: {
        name: 'salary',
        type: 'number',
      },

      formatForView(value) {
        return `$${Number(value).toLocaleString('en-US')}`;
      },

      formatForEdit(value) {
        return value.replace(/[,$]/g, '');
      },

      validate(value) {
        if (!value) {
          return `Employee's salary is required!`;
        }

        if (value < 1) {
          return `Employee's salary must be positive!`;
        }

        return true;
      },

      sort(a, b) {
        return this.formatForEdit(a) - this.formatForEdit(b);
      },
    },
  },

  validateData(data) {
    for (const key in data) {
      if (!this.fields.hasOwnProperty(key)) {
        return false;
      }

      const result = this.fields[key].validate(data[key]);

      if (result !== true) {
        pushNotification(`Invalid ${key}!`, result, true);

        return false;
      }
    }

    return true;
  },

  sortInASC(cellText, cellIndex) {
    return [...this.rows].sort((a, b) => {
      const aText = a.cells[cellIndex].innerText;
      const bText = b.cells[cellIndex].innerText;

      return this.fields[cellText.toLowerCase()].sort(aText, bText);
    });
  },

  init() {
    if (this.initialized) {
      return;
    }

    this.form.className = 'new-employee-form';

    for (const key in this.fields) {
      const label = document.createElement('label');
      const input = createInput(this.fields[key]);

      input.dataset.qa = key;

      label.innerText = this.fields[key].title + ':';
      label.append(input);

      this.form.append(label);
    }

    this.form.insertAdjacentHTML('beforeend', `
      <button type="submit">Save to table</button>
    `);

    this.table.after(this.form);

    this.head.addEventListener('click', (e) => {
      const head = e.target.closest('th');

      if (!head || !this.head.contains(head)) {
        return;
      }

      const { innerText, cellIndex } = head;

      const sortedRows = (this.sortBy !== innerText)
        ? this.sortInASC(innerText, cellIndex)
        : [...this.rows].reverse();

      this.sortBy = innerText;

      this.body.append(...sortedRows);
    });

    this.body.addEventListener('click', (e) => {
      const row = e.target.closest('tr');

      if (!row || !this.body.contains(row)) {
        return;
      }

      if (this.selectedRow && this.selectedRow !== row) {
        this.selectedRow.classList.remove('active');
      }

      row.classList.toggle('active');

      this.selectedRow = row;
    });

    this.body.addEventListener('dblclick', (e) => {
      const cell = e.target.closest('td');

      if (!cell || !this.body.contains(cell)) {
        return;
      }

      e.target.closest('tr').classList.add('active');

      const cellName = this.headCells[cell.cellIndex].innerText.toLowerCase();
      const currentValue = cell.innerText;

      const input = createInput(this.fields[cellName]);

      input.className = 'cell-input';

      input.value = this.fields[cellName].formatForEdit
        ? this.fields[cellName].formatForEdit(currentValue)
        : currentValue;

      cell.innerText = '';
      cell.append(input);

      input.focus();

      input.addEventListener('keyup', ({ code }) => {
        if (code === 'Enter' || code === 'NumpadEnter') {
          input.blur();
        }
      });

      input.addEventListener('blur', ({ target }) => {
        const value = this.fields[cellName].formatForView
          ? this.fields[cellName].formatForView(target.value)
          : target.value;

        if (this.validateData({ [target.name]: target.value })) {
          cell.innerHTML = value;

          this.sortBy = '';

          if (value !== currentValue) {
            pushNotification('Success!', `Employee's ${cellName} was chenged!`);
          }
        } else {
          cell.innerHTML = currentValue;
        }
      });
    });

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();

      const data = new FormData(e.target);
      const dataObj = Object.fromEntries(data);

      if (this.validateData(dataObj)) {
        const row = document.createElement('tr');

        for (const key in dataObj) {
          const value = this.fields[key].formatForView
            ? this.fields[key].formatForView(dataObj[key])
            : dataObj[key];

          row.insertAdjacentHTML('beforeend', `
            <td>${value}</td>
          `);
        }

        this.body.append(row);
        this.sortBy = '';

        pushNotification('Success!', `Employee's was added!`);
      }
    });

    this.initialized = true;
  },

  get head() {
    return this.table.tHead;
  },

  get body() {
    return this.table.tBodies[0];
  },

  get headCells() {
    return [...this.head.rows[0].cells];
  },

  get rows() {
    return this.body.rows;
  },
};

employeesTable.init();

function pushNotification(title, message, isError) {
  const current = document.querySelector('.notification');
  const notification = document.createElement('div');

  notification.className = `notification ${isError ? 'error' : 'success'}`;

  notification.innerHTML = `
    <h2>${title}</h2>
    <p>${message}</p>
  `;

  if (current) {
    current.remove();
  }

  document.body.append(notification);

  notification.scrollIntoView();

  setTimeout(() => notification.remove(), 3000);
}

function createInput(field) {
  switch (field.type) {
    case 'input': {
      const input = document.createElement('input');

      Object.assign(input, field.input);

      return input;
    }

    case 'select': {
      const select = document.createElement('select');

      Object.assign(select, field.select);

      field.options.forEach(option => {
        select.insertAdjacentHTML('beforeend', `
          <option value="${option}">
            ${option}
          </option>
        `);
      });

      return select;
    }
  }
}
