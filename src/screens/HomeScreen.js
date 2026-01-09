import { navigate } from '../router.js';
import { getSavedGames, loadGame, deleteGame, getSettings, saveSettings, createMockGame } from '../store.js';

export function renderHomeScreen() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center p-6">
      <div class="text-center mb-12">
        <div class="text-7xl mb-4">🏀</div>
        <h1 class="text-3xl font-bold">Basketball</h1>
        <p class="text-xl text-gray-400">Scoreboard</p>
      </div>

      <div class="w-full max-w-sm space-y-4">
        <button id="btn-new-game" class="btn btn-primary w-full text-lg">
          🆕 새 경기 시작
        </button>

        <button id="btn-continue" class="btn btn-secondary w-full text-lg">
          📂 이어하기
        </button>

        <button id="btn-test-game" class="btn w-full text-lg bg-purple-600 hover:bg-purple-700 text-white">
          🧪 테스트 경기 (목업)
        </button>
      </div>

      <button id="btn-settings" class="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl hover:bg-gray-600 transition-colors">
        ⚙️
      </button>
    </div>

    <!-- 저장된 경기 모달 -->
    <div id="saved-games-modal" class="modal-overlay hidden">
      <div class="modal-content">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">📂 저장된 경기</h2>
          <button id="close-saved-modal" class="text-2xl text-gray-400 hover:text-white">&times;</button>
        </div>
        <div id="saved-games-list" class="space-y-3">
          <!-- 동적으로 채워짐 -->
        </div>
      </div>
    </div>

    <!-- 설정 모달 -->
    <div id="settings-modal" class="modal-overlay hidden">
      <div class="modal-content">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">⚙️ 기본 설정</h2>
          <button id="close-settings-modal" class="text-2xl text-gray-400 hover:text-white">&times;</button>
        </div>

        <div class="space-y-6">
          <div>
            <label class="block text-gray-300 mb-2">쿼터 수</label>
            <div class="flex gap-2" id="quarters-options">
              <button data-value="2" class="select-btn">2</button>
              <button data-value="3" class="select-btn">3</button>
              <button data-value="4" class="select-btn">4</button>
              <button data-value="6" class="select-btn">6</button>
            </div>
          </div>

          <div>
            <label class="block text-gray-300 mb-2">개인 파울 제한</label>
            <div class="flex gap-2" id="personal-foul-options">
              <button data-value="4" class="select-btn">4</button>
              <button data-value="5" class="select-btn">5</button>
              <button data-value="6" class="select-btn">6</button>
            </div>
          </div>

          <div>
            <label class="block text-gray-300 mb-2">팀 파울 제한 (쿼터당)</label>
            <div class="flex gap-2" id="team-foul-options">
              <button data-value="4" class="select-btn">4</button>
              <button data-value="5" class="select-btn">5</button>
              <button data-value="7" class="select-btn">7</button>
            </div>
          </div>

          <button id="save-settings" class="btn btn-primary w-full">저장</button>
        </div>
      </div>
    </div>
  `;

  // 이벤트 바인딩
  document.getElementById('btn-new-game').addEventListener('click', () => {
    navigate('/setup');
  });

  document.getElementById('btn-continue').addEventListener('click', () => {
    showSavedGamesModal();
  });

  document.getElementById('btn-test-game').addEventListener('click', () => {
    createMockGame();
    navigate('/game');
  });

  document.getElementById('btn-settings').addEventListener('click', () => {
    showSettingsModal();
  });

  document.getElementById('close-saved-modal').addEventListener('click', () => {
    document.getElementById('saved-games-modal').classList.add('hidden');
  });

  document.getElementById('close-settings-modal').addEventListener('click', () => {
    document.getElementById('settings-modal').classList.add('hidden');
  });

  // 모달 외부 클릭 시 닫기
  document.getElementById('saved-games-modal').addEventListener('click', (e) => {
    if (e.target.id === 'saved-games-modal') {
      e.target.classList.add('hidden');
    }
  });

  document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') {
      e.target.classList.add('hidden');
    }
  });
}

function showSavedGamesModal() {
  const modal = document.getElementById('saved-games-modal');
  const list = document.getElementById('saved-games-list');
  const games = getSavedGames();

  if (games.length === 0) {
    list.innerHTML = `
      <p class="text-gray-400 text-center py-8">저장된 경기가 없습니다</p>
    `;
  } else {
    list.innerHTML = games.map(game => {
      const homeScore = game.teams.home.quarterScores.reduce((a, b) => a + b, 0);
      const awayScore = game.teams.away.quarterScores.reduce((a, b) => a + b, 0);
      const statusText = game.status === 'finished' ? '완료' :
        game.status === 'in_progress' ? `Q${game.currentQuarter} 진행중` : '설정중';
      const date = new Date(game.createdAt).toLocaleDateString('ko-KR');

      return `
        <div class="bg-gray-700 rounded-lg p-4">
          <div class="font-bold mb-1">${game.teams.home.name} vs ${game.teams.away.name}</div>
          <div class="text-2xl font-bold mb-1">${homeScore} : ${awayScore}</div>
          <div class="text-sm text-gray-400 mb-3">${statusText} | ${date}</div>
          <div class="flex gap-2">
            ${game.status === 'finished' ? `
              <button class="btn btn-secondary flex-1 py-2 text-sm" onclick="window.viewGameSummary('${game.id}')">
                결과보기
              </button>
            ` : `
              <button class="btn btn-primary flex-1 py-2 text-sm" onclick="window.continueGame('${game.id}')">
                이어하기
              </button>
            `}
            <button class="btn btn-danger py-2 px-4 text-sm" onclick="window.confirmDeleteGame('${game.id}')">
              삭제
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  modal.classList.remove('hidden');
}

// 글로벌 함수로 등록 (onclick에서 호출)
window.continueGame = (gameId) => {
  loadGame(gameId);
  const game = getSavedGames().find(g => g.id === gameId);
  if (game) {
    if (game.status === 'setup') {
      navigate('/lineup');
    } else {
      navigate('/game');
    }
  }
};

window.viewGameSummary = (gameId) => {
  loadGame(gameId);
  navigate('/summary');
};

window.confirmDeleteGame = (gameId) => {
  if (confirm('이 경기를 삭제하시겠습니까?')) {
    deleteGame(gameId);
    showSavedGamesModal(); // 새로고침
  }
};

function showSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const settings = getSettings();

  // 현재 설정값 표시
  updateSelectButtons('quarters-options', settings.quarters);
  updateSelectButtons('personal-foul-options', settings.personalFoulLimit);
  updateSelectButtons('team-foul-options', settings.teamFoulLimit);

  // 버튼 클릭 이벤트
  ['quarters-options', 'personal-foul-options', 'team-foul-options'].forEach(containerId => {
    const container = document.getElementById(containerId);
    container.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        updateSelectButtons(containerId, parseInt(btn.dataset.value));
      });
    });
  });

  // 저장 버튼
  document.getElementById('save-settings').addEventListener('click', () => {
    const newSettings = {
      quarters: getSelectedValue('quarters-options'),
      personalFoulLimit: getSelectedValue('personal-foul-options'),
      teamFoulLimit: getSelectedValue('team-foul-options')
    };
    saveSettings(newSettings);
    modal.classList.add('hidden');
  });

  modal.classList.remove('hidden');
}

function updateSelectButtons(containerId, activeValue) {
  const container = document.getElementById(containerId);
  container.querySelectorAll('button').forEach(btn => {
    if (parseInt(btn.dataset.value) === activeValue) {
      btn.className = 'select-btn select-btn-active';
    } else {
      btn.className = 'select-btn select-btn-inactive';
    }
  });
}

function getSelectedValue(containerId) {
  const container = document.getElementById(containerId);
  const activeBtn = container.querySelector('.select-btn-active');
  return parseInt(activeBtn.dataset.value);
}
