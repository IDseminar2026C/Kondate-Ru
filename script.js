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

// 指定した id の料理を消して、保存し直し、一覧を表示し直す
function deleteDish(id) {
  dishes = dishes.filter((dish) => dish.id !== id);
  saveDishes(dishes);
  render();
}

// 料理1件ぶんの行（料理名＋削除ボタン）を作る
function createDishItem(dish) {
  const li = document.createElement('li');

  const nameSpan = document.createElement('span');
  nameSpan.className = 'dish-name';
  nameSpan.textContent = dish.name; // innerHTML を使わず XSS を防ぐ

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'delete-button';
  deleteButton.textContent = '削除';
  deleteButton.addEventListener('click', () => deleteDish(dish.id));

  li.appendChild(nameSpan);
  li.appendChild(deleteButton);
  return li;
}

function render() {
  list.innerHTML = '';
  dishes.forEach((dish) => {
    list.appendChild(createDishItem(dish));
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
