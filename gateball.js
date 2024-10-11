// シーンの作成
const scene = new THREE.Scene();

// カメラの作成
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 60, 60); // カメラ位置を高めに設定
camera.rotation.x = -Math.PI / 4;

// レンダラーの作成
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // 影を有効にする
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// 環境光と方向光の追加
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // 全体に柔らかい光を追加
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 強い白い光を追加
directionalLight.position.set(150, 150, 100); // 光源の位置を高く設定
directionalLight.castShadow = true;
scene.add(directionalLight);

// 影カメラの設定（影の範囲を調整）
directionalLight.shadow.mapSize.width = 2048; // 解像度を上げる
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -150;
directionalLight.shadow.camera.right = 150;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;

// テクスチャの読み込み
const textureLoader = new THREE.TextureLoader();
const normalTexture = textureLoader.load('https://threejs.org/examples/textures/water/Water_1_M_Normal.jpg'); // 水の法線マップを使用

// ゲートボール球場（平面）の作成（緑色のマテリアルに法線マップを適用）
const fieldGeometry = new THREE.PlaneGeometry(250, 80);
const fieldMaterial = new THREE.MeshStandardMaterial({
    color: 0x228B22,           // 緑色のベース
    normalMap: normalTexture   // 法線マップで凹凸を表現
});
const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
field.rotation.x = -Math.PI / 2;
field.receiveShadow = true; // 影を受け取る設定
scene.add(field);

// ゴルフボールの作成
const ballGeometry = new THREE.SphereGeometry(2, 32, 32);
const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const golfBall = new THREE.Mesh(ballGeometry, ballMaterial);
golfBall.position.set(0, 2, 0);
golfBall.castShadow = true; // 影を落とす設定
scene.add(golfBall);

// ゴールの作成
function createGoal() {
  const goalGeometry = new THREE.TorusGeometry(2, 0.5, 16, 100);
  const goalMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
  const goal = new THREE.Mesh(goalGeometry, goalMaterial);

  const randomX = (Math.random() - 0.5) * 200;
  const randomZ = (Math.random() - 0.5) * 70;
  goal.position.set(randomX, 1, randomZ);

  goal.castShadow = true;
  goal.receiveShadow = true;
  return goal;
}

const goal = createGoal();
scene.add(goal);

// ボールの速度
let velocity = { x: 0, z: 0 };

// キー入力でボールを動かす
// document.addEventListener('keydown', (event) => {
//   if (event.key === 'ArrowUp') {
//     velocity.z = -0.5;
//   } else if (event.key === 'ArrowDown') {
//     velocity.z = 0.5;
//   } else if (event.key === 'ArrowLeft') {
//     velocity.x = -0.5;
//   } else if (event.key === 'ArrowRight') {
//     velocity.x = 0.5;
//   }
// });

// ベクトルの速度を設定する関数
function setVelocity(vector) {
  velocity.x = vector.x;
  // velocity.y = vector.y; 
  velocity.z = vector.z;
}

// キー入力でベクトルを設定する
document.addEventListener('keydown', (event) => {
  const key = event.key;
  switch (key) {
    case 'z':
      setVelocity({ x: -1, z: 1 }); // 左上
      break;
    case 'x':
      setVelocity({ x: 0, z: 1 }); // 上
      break;
    case 'c':
      setVelocity({ x: 1, z: 1 }); // 右上
      break;
    case 'a':
      setVelocity({ x: -1, z: 0 }); // 左
      break;
    case 's':
      setVelocity({ x: 0, z: 0 }); // 停止
      break;
    case 'd':
      setVelocity({ x: 1, z: 0 }); // 右
      break;
    case 'q':
      setVelocity({ x: -1, z: -1 }); // 左下
      break;
    case 'w':
      setVelocity({ x: 0, z: -1 }); // 下
      break;
    case 'e':
      setVelocity({ x: 1, z: -1 }); // 右下
      break;
  }
});


// 摩擦効果
function applyFriction() {
  velocity.x *= 0.98;
  velocity.z *= 0.98;
}

// ボールがフィールドの外に出たらリセットする関数
function checkOutOfBounds() {
  const fieldMinX = -125;
  const fieldMaxX = 125;
  const fieldMinZ = -40;
  const fieldMaxZ = 40;

  if (
    golfBall.position.x < fieldMinX || golfBall.position.x > fieldMaxX ||
    golfBall.position.z < fieldMinZ || golfBall.position.z > fieldMaxZ
  ) {
    resetBallPosition(); // ボールの位置をリセット
  }
}

// 衝突判定
function checkGoal() {
  const distance = golfBall.position.distanceTo(goal.position);

  if (distance < 3) {
    displayMessage();
    playSound();
    startConfetti();  // 花吹雪を表示
    resetBallPosition();
  }
}

function resetBallPosition() {
  golfBall.position.set(0, 2, 0);
  velocity.x = 0;
  velocity.z = 0;
}

// メッセージを表示する関数
function displayMessage() {
  const msg = document.getElementById('msg');
  msg.style.opacity = 1;  // メッセージをフェードイン
  setTimeout(() => {
    msg.style.opacity = 0;  // 一定時間後にメッセージをフェードアウト
  }, 3000);
}

// 音を再生する関数
function playSound() {
  const sound = document.getElementById('goalSound');
  sound.play();
}

// 花吹雪の演出
function startConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
}

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);

  golfBall.position.x += velocity.x;
  golfBall.position.z += velocity.z;

  applyFriction();
  checkOutOfBounds(); // フィールド外チェック
  checkGoal();

  renderer.render(scene, camera);
}
animate();
