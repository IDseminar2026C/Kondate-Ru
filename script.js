const STORAGE_KEY = 'kondateru_dishes';

const form = document.getElementById('dish-form');
const nameInput = document.getElementById('dish-name');
const tagInput = document.getElementById('dish-tags'); // タグの入力欄
const formError = document.getElementById('form-error');
const list = document.getElementById('dish-list');
const emptyMessage = document.getElementById('empty-message');
const pickButton = document.getElementById('pick-button'); // 「献立を決める！」ボタン
const pickResult = document.getElementById('pick-result'); // 選ばれた料理名を出す場所
const pickError = document.getElementById('pick-error'); // 料理が0件のときのお知らせ
const tagFilter = document.getElementById('tag-filter'); // 絞り込み用のチェックボックスを並べる場所
const pickNoMatch = document.getElementById('pick-no-match'); // 条件に合う料理がないときのお知らせ
let lastPickedId = null; // 前回選ばれた料理の id（二連続で同じ料理を出さないために覚えておく）

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

// タグ欄の文字を「、」「,」スペースで区切って、タグの配列にする
function parseTags(text) {
  const tags = text
    .split(/[、,，\s]+/) // 区切り文字で分ける
    .map((tag) => tag.trim())
    .filter((tag) => tag !== ''); // 空のタグは取り除く
  // 同じタグが2回書かれていたら、1つだけ残す
  return tags.filter((tag, index) => tags.indexOf(tag) === index);
}

// タグを小さなラベルとして並べた部分を作る
function createTagList(tags) {
  const tagList = document.createElement('div');
  tagList.className = 'tag-list';
  tags.forEach((tag) => {
    const tagSpan = document.createElement('span');
    tagSpan.className = 'tag';
    tagSpan.textContent = tag; // innerHTML を使わず XSS を防ぐ
    tagList.appendChild(tagSpan);
  });
  return tagList;
}

// 料理1件ぶんの行（料理名＋タグ＋削除ボタン）を作る
function createDishItem(dish) {
  const li = document.createElement('li');

  // 料理名とタグをまとめる入れ物（タグは料理名の下に出る）
  const info = document.createElement('div');
  info.className = 'dish-info';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'dish-name';
  nameSpan.textContent = dish.name; // innerHTML を使わず XSS を防ぐ
  info.appendChild(nameSpan);

  // 前に登録した料理にはタグが無いことがあるので、そのときは空として扱う
  const tags = Array.isArray(dish.tags) ? dish.tags : [];
  if (tags.length > 0) {
    info.appendChild(createTagList(tags));
  }

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'delete-button';
  deleteButton.textContent = '削除';
  deleteButton.addEventListener('click', () => deleteDish(dish.id));

  li.appendChild(info);
  li.appendChild(deleteButton);
  return li;
}

// 料理のタグを取り出す（前に登録した料理でタグが無いときは空にする）
function getTags(dish) {
  return Array.isArray(dish.tags) ? dish.tags : [];
}

// 登録済みの料理に付いているタグを、重なりなしで集める
function getAllTags() {
  const allTags = []; // 集めたタグを入れていくリスト
  dishes.forEach((dish) => {
    getTags(dish).forEach((tag) => {
      if (!allTags.includes(tag)) {
        allTags.push(tag);
      }
    });
  });
  return allTags;
}

// 今チェックが付いているタグの一覧を返す
function getCheckedTags() {
  const checkedBoxes = tagFilter.querySelectorAll('input:checked');
  return Array.from(checkedBoxes).map((box) => box.value);
}

// タグ1つぶんのチェックボックス（押しやすいように文字ごと label で包む）を作る
function createTagCheckbox(tag, isChecked) {
  const label = document.createElement('label');
  label.className = 'tag-option';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = tag;
  checkbox.checked = isChecked;

  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(tag)); // innerHTML を使わず XSS を防ぐ
  return label;
}

// 絞り込み用のチェックボックスを作り直す（残っているタグのチェックはそのまま）
function renderTagFilter() {
  const checkedTags = getCheckedTags(); // 作り直す前のチェック状態を覚えておく
  tagFilter.innerHTML = '';
  getAllTags().forEach((tag) => {
    tagFilter.appendChild(createTagCheckbox(tag, checkedTags.includes(tag)));
  });
}

function render() {
  list.innerHTML = '';
  dishes.forEach((dish) => {
    list.appendChild(createDishItem(dish));
  });
  emptyMessage.hidden = dishes.length > 0;
  renderTagFilter();
}

// チェックしたタグが全部付いている料理だけを返す（チェックなしなら全部の料理）
function filterByTags(checkedTags) {
  return dishes.filter((dish) => {
    return checkedTags.every((tag) => getTags(dish).includes(tag));
  });
}

// 登録済みの料理からランダムに1つ選んで表示する
function pickRandomDish() {
  // 料理が1件もないときは、お知らせ文を出して終わる
  if (dishes.length === 0) {
    pickResult.hidden = true;
    pickNoMatch.hidden = true;
    pickError.hidden = false;
    return;
  }
  pickError.hidden = true;

  // チェックしたタグで絞り込む。1件も合わなければ、お知らせ文を出して終わる
  const matchedDishes = filterByTags(getCheckedTags());
  if (matchedDishes.length === 0) {
    pickResult.hidden = true;
    pickNoMatch.hidden = false;
    return;
  }
  pickNoMatch.hidden = true;

  // 前回選ばれた料理を除いた候補を作る（候補が1件だけのときは、その1件を候補にする）
  let candidates = matchedDishes.filter((dish) => dish.id !== lastPickedId);
  if (candidates.length === 0) {
    candidates = matchedDishes;
  }

  // 0 〜（候補の数 - 1）の中から、ランダムな番号を1つ決める
  const index = Math.floor(Math.random() * candidates.length);
  const picked = candidates[index]; // 今回選ばれた料理
  lastPickedId = picked.id;
  pickResult.textContent = picked.name;
  pickResult.hidden = false;
}

pickButton.addEventListener('click', pickRandomDish);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();

  if (name === '') {
    formError.hidden = false;
    return;
  }
  formError.hidden = true;

  const tags = parseTags(tagInput.value); // 入力されたタグの配列
  dishes.push({ id: Date.now().toString(), name: name, tags: tags });
  saveDishes(dishes);
  render();

  nameInput.value = '';
  tagInput.value = '';
  nameInput.focus();
});

render();
