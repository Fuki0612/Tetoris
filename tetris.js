// テトリスゲーム実装

// キャンバスとコンテキストの取得
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextContext = nextCanvas.getContext('2d');

// ブロックのサイズとボードの寸法
const BLOCK_SIZE = 30;
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// ゲーム関連の変数
let score = 0;
let level = 1;
let lines = 0;
let dropInterval = 1000; // ミリ秒単位の落下速度
let lastTime = 0;
let dropCounter = 0;
let paused = true;
let gameOver = false;

// スコア表示要素
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');

// ボタン要素
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

// ゲームボード（20x10の二次元配列）
const gameBoard = createMatrix(BOARD_WIDTH, BOARD_HEIGHT);

// 現在のピースと次のピース
let currentPiece = null;
let nextPiece = null;

// テトリスのピース定義
const PIECES = [
    // Iピース（水色）
    {
        matrix: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#00FFFF'
    },
    // Jピース（青）
    {
        matrix: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#0000FF'
    },
    // Lピース（オレンジ）
    {
        matrix: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#FF7F00'
    },
    // Oピース（黄色）
    {
        matrix: [
            [1, 1],
            [1, 1]
        ],
        color: '#FFFF00'
    },
    // Sピース（緑）
    {
        matrix: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        color: '#00FF00'
    },
    // Tピース（紫）
    {
        matrix: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#800080'
    },
    // Zピース（赤）
    {
        matrix: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        color: '#FF0000'
    }
];

// 行列（配列）作成関数
function createMatrix(width, height) {
    const matrix = [];
    for (let y = 0; y < height; y++) {
        matrix.push(new Array(width).fill(0));
    }
    return matrix;
}

// ピースをランダムに生成する関数
function createRandomPiece() {
    const index = Math.floor(Math.random() * PIECES.length);
    const piece = PIECES[index];
    
    return {
        matrix: piece.matrix,
        color: piece.color,
        pos: {
            x: Math.floor(BOARD_WIDTH / 2) - Math.floor(piece.matrix.length / 2),
            y: 0
        }
    };
}

// ゲームを初期化する関数
function initGame() {
    // ゲームボードのクリア
    gameBoard.forEach(row => row.fill(0));
    
    // スコアのリセット
    score = 0;
    level = 1;
    lines = 0;
    
    // スコア表示の更新
    updateScore();
    
    // ピースの生成
    if (!currentPiece) currentPiece = createRandomPiece();
    if (!nextPiece) nextPiece = createRandomPiece();
    
    // ゲームオーバーフラグのリセット
    gameOver = false;
    
    // ボタンの状態更新
    updateButtons();
    
    // 画面の描画
    draw();
}

// ゲームを開始する関数
function startGame() {
    if (gameOver) {
        initGame();
    }
    paused = false;
    updateButtons();
    
    // アニメーションの開始
    if (!lastTime) {
        lastTime = performance.now();
        animate();
    }
}

// ゲームを一時停止・再開する関数
function togglePause() {
    paused = !paused;
    updateButtons();
    
    // 一時停止解除時にアニメーション再開
    if (!paused && !lastTime) {
        lastTime = performance.now();
        animate();
    }
}

// ボタンの状態を更新する関数
function updateButtons() {
    startBtn.disabled = !paused || !gameOver;
    pauseBtn.textContent = paused ? '再開' : '一時停止';
}

// スコア表示を更新する関数
function updateScore() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
}

// 衝突判定を行う関数
function collide(gameBoard, piece) {
    const matrix = piece.matrix;
    const pos = piece.pos;
    
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] !== 0 &&
                (gameBoard[y + pos.y] === undefined ||
                 gameBoard[y + pos.y][x + pos.x] === undefined ||
                 gameBoard[y + pos.y][x + pos.x] !== 0)) {
                return true;
            }
        }
    }
    
    return false;
}

// ピースをボードに固定する関数
function merge(gameBoard, piece) {
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // 0でない場合のみボードに色をセット
                gameBoard[y + piece.pos.y][x + piece.pos.x] = piece.color;
            }
        });
    });
}

// ピースを回転させる関数
function rotate(matrix) {
    // 行列を転置する
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < y; x++) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    
    // 各行を反転させる
    matrix.forEach(row => row.reverse());
}

// ピースを回転させる関数（衝突判定つき）
function rotatePiece() {
    if (paused || gameOver) return;
    
    const originalMatrix = JSON.parse(JSON.stringify(currentPiece.matrix));
    const pos = currentPiece.pos;
    
    // ピースを回転
    rotate(currentPiece.matrix);
    
    // 回転後に衝突する場合、元に戻す
    let offset = 0;
    // 回転後に壁に埋まる場合、少しずらしてみる
    while (collide(gameBoard, currentPiece)) {
        currentPiece.pos.x += offset > 0 ? -offset : offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        
        // 4マスずらしても駄目なら元に戻す
        if (offset > currentPiece.matrix.length) {
            currentPiece.matrix = originalMatrix;
            currentPiece.pos = { ...pos };
            return;
        }
    }
    
    draw();
}

// ピースを左右に移動する関数
function moveHorizontal(direction) {
    if (paused || gameOver) return;
    
    currentPiece.pos.x += direction;
    
    if (collide(gameBoard, currentPiece)) {
        currentPiece.pos.x -= direction;
    } else {
        draw();
    }
}

// ピースを下に移動する関数
function moveDown() {
    if (paused || gameOver) return;
    
    currentPiece.pos.y++;
    
    if (collide(gameBoard, currentPiece)) {
        currentPiece.pos.y--;
        
        // ボードにピースを固定
        merge(gameBoard, currentPiece);
        
        // 新しいピースを生成
        currentPiece = nextPiece;
        nextPiece = createRandomPiece();
        
        // ライン消去とスコア計算
        clearLines();
        
        // ゲームオーバー判定
        if (collide(gameBoard, currentPiece)) {
            gameOver = true;
            paused = true;
            updateButtons();
        }
    }
    
    draw();
}

// ハードドロップ（一気に落とす）関数
function hardDrop() {
    if (paused || gameOver) return;
    
    while (!collide(gameBoard, currentPiece)) {
        currentPiece.pos.y++;
    }
    
    currentPiece.pos.y--;
    moveDown();
}

// 揃ったラインを消去する関数
function clearLines() {
    // 下から順にチェック
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        // 一行が全て埋まっているか確認
        if (gameBoard[y].every(value => value !== 0)) {
            // 一行消去
            gameBoard.splice(y, 1);
            // 上に新しい行を追加
            gameBoard.unshift(new Array(BOARD_WIDTH).fill(0));
            
            // スコア加算
            lines++;
            score += level * 100;
            
            // 10ライン消去ごとにレベルアップ
            if (lines % 10 === 0) {
                level++;
                // 落下速度を上げる
                dropInterval = Math.max(100, 1000 - (level - 1) * 100);
            }
            
            // 同じ行をもう一度チェックするためにインデックスを戻す
            y++;
            
            // スコア表示の更新
            updateScore();
        }
    }
}

// 画面を描画する関数
function draw() {
    // メインキャンバスのクリア
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // ボードの描画
    drawBoard();
    
    // 現在のピースの描画
    drawPiece(context, currentPiece);
    
    // 次のピースの描画（中央に配置）
    nextContext.fillStyle = '#111';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    const nextPieceCopy = {
        matrix: nextPiece.matrix,
        color: nextPiece.color,
        pos: {
            x: (nextCanvas.width / BLOCK_SIZE - nextPiece.matrix.length) / 2,
            y: (nextCanvas.height / BLOCK_SIZE - nextPiece.matrix.length) / 2
        }
    };
    
    drawPiece(nextContext, nextPieceCopy);
    
    // ゲームオーバー表示
    if (gameOver) {
        context.fillStyle = 'rgba(0, 0, 0, 0.75)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = '36px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        
        context.font = '20px Arial';
        context.fillText('Press START to play again', canvas.width / 2, canvas.height / 2 + 40);
    }
    // 一時停止表示
    else if (paused && !gameOver) {
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = '36px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
}

// ゲームボードを描画する関数
function drawBoard() {
    gameBoard.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // 埋まっているマスを描画
                context.fillStyle = value;
                context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                
                // マスの枠線
                context.strokeStyle = '#000';
                context.lineWidth = 1;
                context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
    
    // グリッド線を描画（オプション）
    context.strokeStyle = '#333';
    context.lineWidth = 0.5;
    
    for (let x = 0; x <= BOARD_WIDTH; x++) {
        context.beginPath();
        context.moveTo(x * BLOCK_SIZE, 0);
        context.lineTo(x * BLOCK_SIZE, canvas.height);
        context.stroke();
    }
    
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
        context.beginPath();
        context.moveTo(0, y * BLOCK_SIZE);
        context.lineTo(canvas.width, y * BLOCK_SIZE);
        context.stroke();
    }
}

// ピースを描画する関数
function drawPiece(ctx, piece) {
    if (!piece) return;
    
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // ブロックを描画
                ctx.fillStyle = piece.color;
                ctx.fillRect(
                    (x + piece.pos.x) * BLOCK_SIZE,
                    (y + piece.pos.y) * BLOCK_SIZE,
                    BLOCK_SIZE, BLOCK_SIZE
                );
                
                // ブロックの枠線
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(
                    (x + piece.pos.x) * BLOCK_SIZE,
                    (y + piece.pos.y) * BLOCK_SIZE,
                    BLOCK_SIZE, BLOCK_SIZE
                );
            }
        });
    });
}

// アニメーションループ
function animate(time = 0) {
    if (lastTime) {
        const deltaTime = time - lastTime;
        
        if (!paused && !gameOver) {
            dropCounter += deltaTime;
            
            if (dropCounter > dropInterval) {
                moveDown();
                dropCounter = 0;
            }
        }
    }
    
    lastTime = paused ? 0 : time;
    
    if (!paused || !lastTime) {
        draw();
    }
    
    requestAnimationFrame(animate);
}

// イベントリスナー
document.addEventListener('keydown', event => {
    switch (event.code) {
        case 'ArrowLeft':
            moveHorizontal(-1);
            break;
        case 'ArrowRight':
            moveHorizontal(1);
            break;
        case 'ArrowDown':
            moveDown();
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case 'Space':
            hardDrop();
            break;
        case 'KeyP':
            togglePause();
            break;
    }
});

// ボタンのイベントリスナー
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resetBtn.addEventListener('click', () => {
    gameOver = true;
    paused = true;
    initGame();
});

// ゲームの初期化
initGame();
