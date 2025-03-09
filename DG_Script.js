// Размеры игрового поля
const gridWidth = 7;  // Ширина в блоках
const gridHeight = 10; // Высота в блоках

// Получаем элемент игрового поля
const gameBoard = document.getElementById('game-board');

// Инициализация переменных игры
let baseHP = 30;
let buildPoints = 50;
let structures = {};  // Структуры на поле (генераторы, стены и т.п.)
let enemies = [];  // Враги на поле
let basePosition = (gridWidth * (gridHeight - 1)) + Math.floor(gridWidth / 2);  // Начальная позиция базы
let enemyDamage = 2;  // Урон, который враг наносит базе

// Переменные для построек и отмены
let currentStructure = null; // Текущая структура, которую строим
let selectedCell = null; // Выбранная ячейка для постройки

// Создание игрового поля
for (let i = 0; i < gridWidth * gridHeight; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.id = `cell-${i}`;
    cell.setAttribute("data-id", i);

    // Если это база, то изменяем ее стили
    if (i === basePosition) {
        cell.classList.add('base');
        cell.innerText = 'BASE';  // Текст базы
    }

    // Добавляем ячейку на поле
    gameBoard.appendChild(cell);
}

// Функция для обновления статуса
function updateStatus() {
    document.getElementById('status').innerText = `HP: ${baseHP} | Build Points: ${buildPoints} | ${currentStructure ? 'Current structure: ' + currentStructure : 'No structure selected'}`;
}

// Обработчик события для выбора структуры
function selectStructure(type) {
    currentStructure = type;
    document.getElementById('status').innerText = `HP: ${baseHP} | Build Points: ${buildPoints} | Current structure: ${type}`;
}

// Функция для построения структуры с помощью мыши
gameBoard.addEventListener('click', (e) => {
    if (currentStructure && selectedCell !== null) {
        let index = selectedCell.getAttribute('data-id');
        let cost, hp, structureText;

        // Определяем стоимость, здоровье и текст для структуры в зависимости от типа
        if (currentStructure === 'spikeWall') {
            cost = 10;
            hp = 50;
            structureText = 'Spike Wall';
        } else if (currentStructure === 'generator') {
            cost = 10;
            hp = 30;
            structureText = 'Generator';
        } else if (currentStructure === 'wall') {
            cost = 5;
            hp = 50;
            structureText = 'Wall';
        }

        // Если хватает очков и клетка не занята, строим структуру
        if (buildPoints >= cost) {
            if (!structures[index] && index != basePosition) {
                structures[index] = { type: currentStructure, hp: hp || 30 };
                buildPoints -= cost;

                // Обновляем внешний вид клетки
                selectedCell.classList.add(currentStructure);
                selectedCell.innerText = structureText;  // Добавляем текст для структуры
                updateStatus();  // Обновляем статус игры
            } else {
                alert('Invalid cell or already occupied!');
            }
        } else {
            alert('Not enough points!');
        }
    }
});

// Функция для выделения клетки
gameBoard.addEventListener('mouseover', (e) => {
    if (!currentStructure) return;

    const target = e.target;
    if (target.classList.contains('cell')) {
        if (selectedCell) {
            selectedCell.classList.remove('highlight');
        }

        selectedCell = target;
        selectedCell.classList.add('highlight');
    }
});

// Функция для отмены постройки (нажать клавишу '5')
function cancelBuild() {
    if (selectedCell) {
        selectedCell.classList.remove('highlight');
        selectedCell = null;
    }
    currentStructure = null;
    document.getElementById('status').innerText = `HP: ${baseHP} | Build Points: ${buildPoints} | No structure selected`;
}

// Обработка нажатий клавиш
document.addEventListener('keydown', (e) => {
    if (e.key === '1') {
        selectStructure('generator');
    } else if (e.key === '2') {
        selectStructure('wall');
    } else if (e.key === '3') {
        selectStructure('spikeWall');
    } else if (e.key === '5') {
        cancelBuild();
    }
});

// Запуск игры
function startGame() {
    // Интервал для спавна врагов
    setInterval(() => {
        spawnEnemy();
        moveEnemies();
        updateStatus();
        if (baseHP <= 0) {
            alert('Game Over!');
        }
    }, 5000);  // 5 секунд для спавна врагов

    // Интервал для генерации очков
    setInterval(() => {
        generatePoints();
    }, 2000);  // Генерация очков каждые 2 секунды
}

// Спавн врага
function spawnEnemy() {
    let spawnPosition = Math.floor(Math.random() * gridWidth);
    if (!structures[spawnPosition]) {
        enemies.push({ position: spawnPosition, hp: 3 });
        const enemyCell = document.getElementById(`cell-${spawnPosition}`);
        enemyCell.classList.add('enemy');
        enemyCell.innerText = 'Enemy';  // Отображаем текст "Enemy"
    }
}

// Движение врагов
function moveEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        let currentCell = enemy.position;
        let nextCell = currentCell + gridWidth;

        // Если враг не вышел за пределы поля
        if (nextCell < gridWidth * gridHeight) {
            const nextCellElement = document.getElementById(`cell-${nextCell}`);
            const currentCellElement = document.getElementById(`cell-${currentCell}`);

            // Если в следующей клетке нет структуры, враг перемещается
            if (!structures[nextCell]) {
                currentCellElement.classList.remove('enemy');
                currentCellElement.innerText = '';  // Убираем текст из старой ячейки
                enemy.position = nextCell;
                nextCellElement.classList.add('enemy');
                nextCellElement.innerText = 'Enemy';  // Отображаем текст "Enemy"
            } else {
                // Если враг встретил структуру, он наносит урон
                if (structures[nextCell]) {
                    structures[nextCell].hp -= enemyDamage;  // Урон структуре
                    if (structures[nextCell].hp <= 0) {
                        // Удаляем разрушенную структуру
                        delete structures[nextCell];
                        nextCellElement.classList.remove('spikeWall', 'generator', 'wall');
                        nextCellElement.innerText = '';  // Убираем текст из ячейки
                    }
                    // Враг уничтожен
                    enemies.splice(i, 1);
                    updateStatus();  // Обновляем статус
                }
            }
        } else {
            // Если враг достиг базы, то удаляем его
            enemies.splice(i, 1);
            baseHP -= enemyDamage;  // Урон базе
            updateStatus();  // Обновляем статус
        }
    }
}

// Генерация очков
function generatePoints() {
    buildPoints += 2;
    updateStatus();  // Обновляем статус
}

// Запуск игры
startGame();
