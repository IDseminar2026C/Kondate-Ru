const STORAGE_KEY = 'kondateru_dishes';

const form = document.getElementById('dish-form');
const nameInput = document.getElementById('dish-name');
const formError = document.getElementById('form-error');
const list = document.getElementById('dish-list');
const emptyMessage = document.getElementById('empty-message');

// localStorage から料理一覧を読み込む（壊れていたら空にする）
function loadDishes() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function saveDishes(dishes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dishes));
}

let dishes = loadDishes();

function render() {
  list.innerHTML = '';
  dishes.forEach((dish) => {
    const li = document.createElement('li');
    li.textContent = dish.name; // innerHTML を使わず XSS を防ぐ
    list.appendChild(li);
  });
  emptyMessage.hidden = dishes.length > 0;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();

  if (name === '') {
    formError.hidden = false;
    return;
  }
  formError.hidden = true;

  // tags は後でタグ機能を追加するときのために空配列で持っておく
  dishes.push({ id: Date.now().toString(), name: name, tags: [] });
  saveDishes(dishes);
  render();

  nameInput.value = '';
  nameInput.focus();
});

render();
