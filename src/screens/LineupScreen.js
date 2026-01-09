import { navigate } from '../router.js';
import { getCurrentGame, updateGame, createPlayer } from '../store.js';

let activeTeam = 'home'; // 'home' | 'away'

export function renderLineupScreen() {
  const app = document.getElementById('app');
  const game = getCurrentGame();

  if (!game) {
    navigate('/');
    return;
  }

  render();
}

function render() {
  const app = document.getElementById('app');
  const game = getCurrentGame();
  const team = game.teams[activeTeam];
  const otherTeam = activeTeam === 'home' ? 'away' : 'home';
  const otherTeamData = game.teams[otherTeam];

  const startersCount = team.players.filter(p => p.isOnCourt).length;
  const otherStartersCount = otherTeamData.players.filter(p => p.isOnCourt).length;

  // 양 팀 모두 선발 5명 이상 선택했는지 확인
  const canStartGame = startersCount >= 5 && otherStartersCount >= 5;
  // 현재 팀 완료 (선발 5명) 여부
  const currentTeamReady = startersCount >= 5;
  const otherTeamReady = otherStartersCount >= 5;

  app.innerHTML = `
    <div class="min-h-screen flex flex-col">
      <!-- 헤더 -->
      <header class="flex items-center p-4 border-b border-gray-700">
        <button id="btn-back" class="text-2xl mr-4">←</button>
        <h1 class="text-xl font-bold">라인업 설정</h1>
      </header>

      <!-- 팀 탭 -->
      <div class="flex border-b border-gray-700">
        <button id="tab-home" class="flex-1 py-3 text-center font-medium transition-colors ${activeTeam === 'home' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-gray-700'}">
          홈 팀 ${game.teams.home.players.filter(p => p.isOnCourt).length >= 5 ? '✓' : ''}
        </button>
        <button id="tab-away" class="flex-1 py-3 text-center font-medium transition-colors ${activeTeam === 'away' ? 'bg-red-500 text-white' : 'text-gray-400 hover:bg-gray-700'}">
          어웨이 팀 ${game.teams.away.players.filter(p => p.isOnCourt).length >= 5 ? '✓' : ''}
        </button>
      </div>

      <!-- 본문 -->
      <main class="flex-1 p-4 overflow-y-auto">
        <!-- 팀 이름 -->
        <div class="mb-4">
          <label class="block text-gray-400 text-sm mb-1">팀 이름</label>
          <input type="text" id="team-name" class="input w-full" value="${team.name}" placeholder="팀 이름 입력">
        </div>

        <!-- 선수 목록 -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-gray-400 text-sm">
              선수 등록 (${team.players.length}/15) | 선발: ${startersCount}/5 ${startersCount >= 5 ? '✓' : ''}
            </span>
            <button id="btn-bulk-add" class="text-sm text-blue-400 hover:text-blue-300">
              📋 일괄 입력
            </button>
          </div>

          ${team.players.length === 0 ? `
            <div class="text-center text-gray-500 py-8">
              등록된 선수가 없습니다
            </div>
          ` : `
            <div class="space-y-2">
              ${team.players.map(player => `
                <div class="flex items-center bg-gray-700 rounded-lg p-3 gap-3">
                  <span class="font-bold text-lg w-12">#${player.number}</span>
                  <span class="flex-1">${player.name}</span>
                  <button class="starter-toggle text-2xl touch-target ${player.isOnCourt ? '' : 'opacity-50'}" data-id="${player.id}">
                    ${player.isOnCourt ? '⭐' : '☆'}
                  </button>
                  <button class="delete-player text-xl text-red-400 hover:text-red-300 touch-target" data-id="${player.id}">
                    🗑️
                  </button>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- 선수 추가 폼 -->
        <div class="flex gap-2 items-center">
          <input type="number" id="player-number" class="input w-20" placeholder="#" min="0" max="99">
          <input type="text" id="player-name" class="input flex-1" placeholder="이름 입력">
          <button id="btn-add-player" class="btn btn-primary py-3 px-4">
            + 추가
          </button>
        </div>

        <p class="text-gray-500 text-sm mt-2">
          ⭐ = 선발 (탭해서 토글)
        </p>
      </main>

      <!-- 하단 버튼 -->
      <footer class="p-4 space-y-2">
        ${!currentTeamReady ? `
          <p class="text-center text-yellow-500 text-sm mb-2">선발 5명을 선택해주세요</p>
        ` : ''}

        ${currentTeamReady && !otherTeamReady ? `
          <button id="btn-next-team" class="btn btn-primary w-full text-lg">
            ${activeTeam === 'home' ? '어웨이팀 설정 →' : '홈팀 설정 →'}
          </button>
        ` : ''}

        ${canStartGame ? `
          <button id="btn-start-game" class="btn btn-success w-full text-lg">
            🏀 경기 시작!
          </button>
        ` : ''}
      </footer>
    </div>

    <!-- 일괄 입력 모달 -->
    <div id="bulk-modal" class="modal-overlay hidden">
      <div class="modal-content">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold">📋 선수 일괄 입력</h3>
          <button id="close-bulk-modal" class="text-2xl text-gray-400">&times;</button>
        </div>

        <p class="text-gray-400 text-sm mb-2">
          한 줄에 한 명씩 "등번호 이름" 형식으로 입력<br>
          예: 7 김철수
        </p>

        <textarea id="bulk-input" class="input w-full h-48 resize-none mb-4" placeholder="7 김철수
11 이영희
23 박민수
32 최지훈
45 정대현"></textarea>

        <div class="flex gap-2">
          <button id="cancel-bulk" class="btn btn-secondary flex-1">취소</button>
          <button id="confirm-bulk" class="btn btn-primary flex-1">추가하기</button>
        </div>
      </div>
    </div>
  `;

  // 이벤트 바인딩
  document.getElementById('btn-back').addEventListener('click', () => {
    navigate('/setup');
  });

  document.getElementById('tab-home').addEventListener('click', () => {
    activeTeam = 'home';
    render();
  });

  document.getElementById('tab-away').addEventListener('click', () => {
    activeTeam = 'away';
    render();
  });

  document.getElementById('team-name').addEventListener('change', (e) => {
    updateGame(g => {
      g.teams[activeTeam].name = e.target.value || (activeTeam === 'home' ? '홈팀' : '어웨이팀');
      return g;
    });
  });

  document.getElementById('btn-add-player').addEventListener('click', addPlayer);

  // 엔터키로 선수 추가
  document.getElementById('player-name').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPlayer();
  });

  // 선발 토글
  document.querySelectorAll('.starter-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const playerId = btn.dataset.id;
      toggleStarter(playerId);
    });
  });

  // 선수 삭제
  document.querySelectorAll('.delete-player').forEach(btn => {
    btn.addEventListener('click', () => {
      const playerId = btn.dataset.id;
      if (confirm('이 선수를 삭제하시겠습니까?')) {
        deletePlayer(playerId);
      }
    });
  });

  // 일괄 입력 모달
  document.getElementById('btn-bulk-add').addEventListener('click', () => {
    document.getElementById('bulk-modal').classList.remove('hidden');
  });

  document.getElementById('close-bulk-modal').addEventListener('click', () => {
    document.getElementById('bulk-modal').classList.add('hidden');
  });

  document.getElementById('cancel-bulk').addEventListener('click', () => {
    document.getElementById('bulk-modal').classList.add('hidden');
  });

  document.getElementById('bulk-modal').addEventListener('click', (e) => {
    if (e.target.id === 'bulk-modal') {
      document.getElementById('bulk-modal').classList.add('hidden');
    }
  });

  document.getElementById('confirm-bulk').addEventListener('click', bulkAddPlayers);

  // 다음 팀 버튼
  const nextTeamBtn = document.getElementById('btn-next-team');
  if (nextTeamBtn) {
    nextTeamBtn.addEventListener('click', () => {
      activeTeam = activeTeam === 'home' ? 'away' : 'home';
      render();
    });
  }

  // 경기 시작 버튼
  const startGameBtn = document.getElementById('btn-start-game');
  if (startGameBtn) {
    startGameBtn.addEventListener('click', () => {
      updateGame(g => {
        g.status = 'in_progress';
        return g;
      });
      navigate('/game');
    });
  }
}

function addPlayer() {
  const numberInput = document.getElementById('player-number');
  const nameInput = document.getElementById('player-name');

  const number = numberInput.value.trim();
  const name = nameInput.value.trim();

  if (!number || !name) {
    alert('등번호와 이름을 모두 입력해주세요');
    return;
  }

  const game = getCurrentGame();
  const team = game.teams[activeTeam];

  // 중복 등번호 체크
  if (team.players.some(p => p.number === parseInt(number))) {
    alert('이미 등록된 등번호입니다');
    return;
  }

  // 최대 인원 체크
  if (team.players.length >= 15) {
    alert('최대 15명까지 등록 가능합니다');
    return;
  }

  const newPlayer = createPlayer(number, name);

  // 선발이 5명 미만이면 자동으로 선발 지정
  if (team.players.filter(p => p.isOnCourt).length < 5) {
    newPlayer.isOnCourt = true;
  }

  updateGame(g => {
    g.teams[activeTeam].players.push(newPlayer);
    return g;
  });

  numberInput.value = '';
  nameInput.value = '';
  numberInput.focus();

  render();
}

function bulkAddPlayers() {
  const textarea = document.getElementById('bulk-input');
  const lines = textarea.value.trim().split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    alert('선수 정보를 입력해주세요');
    return;
  }

  const game = getCurrentGame();
  const team = game.teams[activeTeam];
  const existingNumbers = team.players.map(p => p.number);

  let added = 0;
  let skipped = [];

  lines.forEach(line => {
    // "번호 이름" 또는 "번호이름" 파싱
    const match = line.trim().match(/^(\d+)\s*(.+)$/);
    if (match) {
      const number = parseInt(match[1]);
      const name = match[2].trim();

      if (existingNumbers.includes(number)) {
        skipped.push(`#${number} (중복)`);
        return;
      }

      if (team.players.length + added >= 15) {
        skipped.push(`#${number} ${name} (인원 초과)`);
        return;
      }

      const newPlayer = createPlayer(number, name);

      // 선발이 5명 미만이면 자동으로 선발 지정
      const currentStarters = team.players.filter(p => p.isOnCourt).length +
        (added < 5 - team.players.filter(p => p.isOnCourt).length ? added : 0);

      if (team.players.filter(p => p.isOnCourt).length + added < 5) {
        newPlayer.isOnCourt = true;
      }

      updateGame(g => {
        g.teams[activeTeam].players.push(newPlayer);
        return g;
      });

      existingNumbers.push(number);
      added++;
    } else {
      skipped.push(`"${line}" (형식 오류)`);
    }
  });

  document.getElementById('bulk-modal').classList.add('hidden');

  let message = `${added}명 추가됨`;
  if (skipped.length > 0) {
    message += `\n건너뜀: ${skipped.join(', ')}`;
  }
  alert(message);

  render();
}

function toggleStarter(playerId) {
  const game = getCurrentGame();
  const team = game.teams[activeTeam];
  const player = team.players.find(p => p.id === playerId);

  if (!player) return;

  // 선발 해제
  if (player.isOnCourt) {
    updateGame(g => {
      const p = g.teams[activeTeam].players.find(p => p.id === playerId);
      p.isOnCourt = false;
      return g;
    });
  } else {
    // 선발 지정 (5명 제한)
    const currentStarters = team.players.filter(p => p.isOnCourt).length;
    if (currentStarters >= 5) {
      alert('선발은 5명까지만 지정할 수 있습니다');
      return;
    }
    updateGame(g => {
      const p = g.teams[activeTeam].players.find(p => p.id === playerId);
      p.isOnCourt = true;
      return g;
    });
  }

  render();
}

function deletePlayer(playerId) {
  updateGame(g => {
    g.teams[activeTeam].players = g.teams[activeTeam].players.filter(p => p.id !== playerId);
    return g;
  });
  render();
}
