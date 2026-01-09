import { navigate } from '../router.js';
import { getSettings, createNewGame, setCurrentGame } from '../store.js';

let gameSettings = null;

export function renderGameSetupScreen() {
  const app = document.getElementById('app');
  const defaultSettings = getSettings();
  gameSettings = { ...defaultSettings };

  app.innerHTML = `
    <div class="min-h-screen flex flex-col">
      <!-- 헤더 -->
      <header class="flex items-center p-4 border-b border-gray-700">
        <button id="btn-back" class="text-2xl mr-4">←</button>
        <h1 class="text-xl font-bold">경기 설정</h1>
      </header>

      <!-- 본문 -->
      <main class="flex-1 p-6">
        <div class="max-w-lg mx-auto space-y-8">
          <!-- 쿼터 수 -->
          <div>
            <label class="block text-lg text-gray-300 mb-3">쿼터 수</label>
            <div class="flex gap-3" id="quarters-options">
              <button data-value="2" class="select-btn flex-1 py-3 text-lg">2</button>
              <button data-value="3" class="select-btn flex-1 py-3 text-lg">3</button>
              <button data-value="4" class="select-btn flex-1 py-3 text-lg">4</button>
              <button data-value="6" class="select-btn flex-1 py-3 text-lg">6</button>
            </div>
          </div>

          <hr class="border-gray-700">

          <!-- 파울 설정 -->
          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="block text-gray-300 mb-3">개인 파울 제한</label>
              <div class="flex gap-2" id="personal-foul-options">
                <button data-value="4" class="select-btn flex-1 py-3">4</button>
                <button data-value="5" class="select-btn flex-1 py-3">5</button>
                <button data-value="6" class="select-btn flex-1 py-3">6</button>
              </div>
            </div>

            <div>
              <label class="block text-gray-300 mb-3">팀 파울 (쿼터당)</label>
              <div class="flex gap-2" id="team-foul-options">
                <button data-value="4" class="select-btn flex-1 py-3">4</button>
                <button data-value="5" class="select-btn flex-1 py-3">5</button>
                <button data-value="7" class="select-btn flex-1 py-3">7</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- 하단 버튼 -->
      <footer class="p-4">
        <button id="btn-next" class="btn btn-primary w-full text-lg">
          다음: 라인업 설정 →
        </button>
      </footer>
    </div>
  `;

  // 초기값 설정
  updateSelectButtons('quarters-options', gameSettings.quarters);
  updateSelectButtons('personal-foul-options', gameSettings.personalFoulLimit);
  updateSelectButtons('team-foul-options', gameSettings.teamFoulLimit);

  // 이벤트 바인딩
  document.getElementById('btn-back').addEventListener('click', () => {
    navigate('/');
  });

  setupOptionButtons('quarters-options', 'quarters');
  setupOptionButtons('personal-foul-options', 'personalFoulLimit');
  setupOptionButtons('team-foul-options', 'teamFoulLimit');

  document.getElementById('btn-next').addEventListener('click', () => {
    // 새 게임 생성
    const newGame = createNewGame(gameSettings);
    setCurrentGame(newGame);
    navigate('/lineup');
  });
}

function setupOptionButtons(containerId, settingKey) {
  const container = document.getElementById(containerId);
  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = parseInt(btn.dataset.value);
      gameSettings[settingKey] = value;
      updateSelectButtons(containerId, value);
    });
  });
}

function updateSelectButtons(containerId, activeValue) {
  const container = document.getElementById(containerId);
  container.querySelectorAll('button').forEach(btn => {
    if (parseInt(btn.dataset.value) === activeValue) {
      btn.className = btn.className.replace(/select-btn-inactive|select-btn-active/g, '').trim() + ' select-btn-active';
    } else {
      btn.className = btn.className.replace(/select-btn-inactive|select-btn-active/g, '').trim() + ' select-btn-inactive';
    }
  });
}
