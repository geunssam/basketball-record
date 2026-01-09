import { navigate } from '../router.js';
import {
  getCurrentGame,
  updateGame,
  updatePlayerStat,
  addToHistory,
  undoLastAction,
  getTeamTotalScore,
  getCurrentQuarterTeamFouls,
  getTheme,
  toggleTheme
} from '../store.js';

let selectedPlayer = null; // { team: 'home'|'away', player: {...} }
let modalType = null; // 'score' | 'foul' | 'rebound' | 'substitution' | 'quarter-end' | 'game-end'

export function renderGameScreen() {
  const game = getCurrentGame();

  if (!game || game.status === 'finished') {
    navigate('/');
    return;
  }

  render();
}

function render() {
  const app = document.getElementById('app');
  const game = getCurrentGame();
  const theme = getTheme();
  const isDark = theme === 'dark';

  const homeScore = getTeamTotalScore('home');
  const awayScore = getTeamTotalScore('away');
  const homeTeamFouls = getCurrentQuarterTeamFouls('home');
  const awayTeamFouls = getCurrentQuarterTeamFouls('away');

  const homeOnCourt = game.teams.home.players.filter(p => p.isOnCourt);
  const awayOnCourt = game.teams.away.players.filter(p => p.isOnCourt);
  const homeBench = game.teams.home.players.filter(p => !p.isOnCourt);
  const awayBench = game.teams.away.players.filter(p => !p.isOnCourt);

  // 팀 리바운드 합계
  const homeRebounds = game.teams.home.players.reduce((sum, p) => sum + p.stats.rebounds, 0);
  const awayRebounds = game.teams.away.players.reduce((sum, p) => sum + p.stats.rebounds, 0);

  // 테마별 색상
  const colors = {
    bg: isDark ? 'bg-gray-900' : 'bg-gray-100',
    headerBg: isDark ? 'bg-gray-800' : 'bg-white',
    cardBg: isDark ? 'bg-gray-700' : 'bg-white',
    cardBgAlt: isDark ? 'bg-gray-800/50' : 'bg-gray-50',
    text: isDark ? 'text-white' : 'text-gray-900',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    border: isDark ? 'border-gray-700' : 'border-gray-300',
    quarterBg: isDark ? 'bg-gray-700' : 'bg-gray-200',
  };

  app.innerHTML = `
    <div class="min-h-screen flex flex-col ${colors.bg} ${colors.text}">
      <!-- 스코어보드 영역 (가로 배열) -->
      <div class="${colors.headerBg} p-4 shadow">
        <!-- 테마 토글 버튼 -->
        <button id="btn-theme" class="absolute top-3 right-3 w-12 h-12 rounded-full ${isDark ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-white'} flex items-center justify-center text-xl z-10">
          ${isDark ? '☀️' : '🌙'}
        </button>

        <div class="relative flex items-center justify-center min-h-[100px]">
          <!-- 쿼터별 스코어보드 (왼쪽, 통합 스코어보드 옆에 배치) -->
          <div class="absolute right-1/2 mr-[180px]">
            <table class="text-base">
              <thead>
                <tr class="${colors.textMuted}">
                  <th class="px-3 py-1 text-left w-16"></th>
                  ${Array.from({length: game.settings.quarters}, (_, i) => `
                    <th class="px-3 py-1 w-12 text-center ${i + 1 === game.currentQuarter ? 'text-yellow-500 font-bold text-lg' : ''}">Q${i + 1}</th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                <tr class="text-blue-500">
                  <td class="px-3 py-1 text-left font-bold">${game.teams.home.name}</td>
                  ${game.teams.home.quarterScores.map((score, i) => `
                    <td class="px-3 py-1 text-center text-lg ${i + 1 === game.currentQuarter ? colors.quarterBg + ' rounded font-bold text-xl' : ''}">${score}</td>
                  `).join('')}
                </tr>
                <tr class="text-red-500">
                  <td class="px-3 py-1 text-left font-bold">${game.teams.away.name}</td>
                  ${game.teams.away.quarterScores.map((score, i) => `
                    <td class="px-3 py-1 text-center text-lg ${i + 1 === game.currentQuarter ? colors.quarterBg + ' rounded font-bold text-xl' : ''}">${score}</td>
                  `).join('')}
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 통합 스코어보드 (정중앙 고정) -->
          <div class="flex items-center gap-8 ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} rounded-xl py-3 px-8">
            <div class="text-center">
              <div class="text-lg text-blue-500 font-bold">${game.teams.home.name}</div>
              <div class="text-5xl font-black">${homeScore}</div>
            </div>

            <div class="${colors.quarterBg} rounded-xl px-5 py-3">
              <div class="text-3xl font-black">Q${game.currentQuarter}</div>
            </div>

            <div class="text-center">
              <div class="text-lg text-red-500 font-bold">${game.teams.away.name}</div>
              <div class="text-5xl font-black">${awayScore}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 경기 영역 (좌우 분리) -->
      <div class="flex">
        <!-- 홈팀 (좌측) -->
        <div class="flex-1 flex flex-col border-r ${colors.border} overflow-hidden">
          <div class="flex items-center justify-center gap-4 py-3 ${colors.cardBgAlt}">
            <span class="text-xl text-blue-500 font-bold">🏠 ${game.teams.home.name}</span>
            <div class="flex items-center gap-2">
              <span class="text-base ${colors.textMuted}">팀파울</span>
              <div class="flex gap-1">
                ${renderFoulIndicators(homeTeamFouls, game.settings.teamFoulLimit, isDark)}
              </div>
              ${homeTeamFouls >= game.settings.teamFoulLimit ? '<span class="text-red-500 font-bold animate-pulse">⚠️</span>' : ''}
            </div>
            <div class="flex items-center gap-2">
              <span class="text-base text-green-500 font-bold">리바운드</span>
              <span class="text-lg font-bold">${homeRebounds}</span>
            </div>
          </div>

          <!-- 칼럼 헤더 -->
          <div class="flex items-center gap-2 pl-6 pr-4 py-2 ${colors.headerBg} text-sm ${colors.textMuted} border-b ${colors.border}">
            <div class="w-14 text-center">등번호</div>
            <div class="w-20 text-center">이름</div>
            <div class="flex-1 text-center text-blue-500 font-bold">득점</div>
            <div class="w-28 text-center text-orange-500 font-bold">파울</div>
            <div class="w-28 text-center text-green-500 font-bold">리바운드</div>
          </div>

          <!-- 온코트 선수 리스트 -->
          <div class="overflow-y-auto p-2">
            <div class="space-y-2">
              ${homeOnCourt.map(player => renderPlayerRow(player, 'home', game.settings.personalFoulLimit, isDark)).join('')}
            </div>
          </div>

          <!-- 벤치 -->
          ${homeBench.length > 0 ? `
            <div class="${colors.cardBgAlt} p-2">
              <div class="text-sm ${colors.textMuted} mb-2">📋 벤치</div>
              <div class="flex flex-wrap gap-2">
                ${homeBench.map(p => `
                  <span class="bench-chip ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} px-3 py-1.5 rounded-lg text-sm cursor-pointer font-medium" data-team="home" data-player-id="${p.id}">
                    #${p.number} ${p.name}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- 어웨이팀 (우측) -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="flex items-center justify-center gap-4 py-3 ${colors.cardBgAlt}">
            <span class="text-xl text-red-500 font-bold">✈️ ${game.teams.away.name}</span>
            <div class="flex items-center gap-2">
              <span class="text-base ${colors.textMuted}">팀파울</span>
              <div class="flex gap-1">
                ${renderFoulIndicators(awayTeamFouls, game.settings.teamFoulLimit, isDark)}
              </div>
              ${awayTeamFouls >= game.settings.teamFoulLimit ? '<span class="text-red-500 font-bold animate-pulse">⚠️</span>' : ''}
            </div>
            <div class="flex items-center gap-2">
              <span class="text-base text-green-500 font-bold">리바운드</span>
              <span class="text-lg font-bold">${awayRebounds}</span>
            </div>
          </div>

          <!-- 칼럼 헤더 -->
          <div class="flex items-center gap-2 pl-6 pr-4 py-2 ${colors.headerBg} text-sm ${colors.textMuted} border-b ${colors.border}">
            <div class="w-14 text-center">등번호</div>
            <div class="w-20 text-center">이름</div>
            <div class="flex-1 text-center text-blue-500 font-bold">득점</div>
            <div class="w-28 text-center text-orange-500 font-bold">파울</div>
            <div class="w-28 text-center text-green-500 font-bold">리바운드</div>
          </div>

          <!-- 온코트 선수 리스트 -->
          <div class="overflow-y-auto p-2">
            <div class="space-y-2">
              ${awayOnCourt.map(player => renderPlayerRow(player, 'away', game.settings.personalFoulLimit, isDark)).join('')}
            </div>
          </div>

          <!-- 벤치 -->
          ${awayBench.length > 0 ? `
            <div class="${colors.cardBgAlt} p-2">
              <div class="text-sm ${colors.textMuted} mb-2">📋 벤치</div>
              <div class="flex flex-wrap gap-2">
                ${awayBench.map(p => `
                  <span class="bench-chip ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} px-3 py-1.5 rounded-lg text-sm cursor-pointer font-medium" data-team="away" data-player-id="${p.id}">
                    #${p.number} ${p.name}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- 하단 컨트롤 -->
      <div class="${colors.headerBg} p-3 flex gap-2 shadow-lg border-t ${colors.border}">
        <button id="btn-undo" class="${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} flex-1 py-3 rounded-lg text-base font-medium ${game.history.length === 0 ? 'opacity-50' : ''}">
          ↩️ 취소
        </button>
        <button id="btn-substitute" class="${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} flex-1 py-3 rounded-lg text-base font-medium">
          🔄 교체
        </button>
        <button id="btn-quarter-end" class="${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} flex-1 py-3 rounded-lg text-base font-medium">
          ⏭️ 쿼터종료
        </button>
        <button id="btn-game-end" class="bg-red-500 hover:bg-red-600 text-white flex-1 py-3 rounded-lg text-base font-medium">
          🏁 종료
        </button>
      </div>
    </div>

    <!-- 모달 컨테이너 -->
    <div id="modal-container"></div>
  `;

  // 이벤트 바인딩
  bindEvents();
}

// 팀파울 표시등 렌더링 (야구 아웃카운트 스타일)
function renderFoulIndicators(fouls, limit, isDark) {
  const indicators = [];
  // 표시등 개수는 (limit - 1)개 (마지막 파울이 발생하면 보너스/페널티)
  const indicatorCount = limit - 1;

  for (let i = 0; i < indicatorCount; i++) {
    const isActive = i < fouls;
    if (isActive) {
      // 켜진 표시등 (빨간색)
      indicators.push(`<span class="w-5 h-5 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></span>`);
    } else {
      // 꺼진 표시등
      indicators.push(`<span class="w-5 h-5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'} border-2 ${isDark ? 'border-gray-500' : 'border-gray-400'}"></span>`);
    }
  }

  return indicators.join('');
}

function renderPlayerRow(player, team, foulLimit, isDark) {
  const foulWarning = player.stats.fouls >= foulLimit - 1;
  const fouledOut = player.stats.fouls >= foulLimit;

  let rowClass = 'player-row flex items-center gap-2 px-4 py-4 rounded-xl';
  const teamColor = team === 'home' ? 'border-l-4 border-blue-500' : 'border-l-4 border-red-500';

  if (fouledOut) {
    rowClass += isDark ? ' bg-red-900/40 opacity-60' : ' bg-red-100 opacity-60';
  } else if (foulWarning) {
    rowClass += isDark ? ' bg-orange-900/30' : ' bg-orange-100';
  } else {
    rowClass += isDark ? ' bg-gray-700' : ' bg-white shadow-sm border border-gray-200';
  }

  const disabled = fouledOut ? 'opacity-50 pointer-events-none' : '';
  const btnMinus = isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700';

  return `
    <div class="${rowClass} ${teamColor}" data-player-id="${player.id}" data-team="${team}">
      <!-- 등번호 (w-14) -->
      <div class="w-14 text-center">
        <span class="font-bold text-lg">${player.number}</span>
      </div>
      <!-- 이름 (w-20) -->
      <div class="w-20 text-center">
        <span class="truncate text-lg">${player.name}</span>
        ${fouledOut ? '<span class="text-xs text-red-500 font-bold block">퇴장</span>' : ''}
      </div>

      <!-- 득점 (flex-1) -->
      <div class="flex-1 flex items-center ${disabled}">
        <div class="flex-1 flex justify-end pr-2">
          <button class="stat-btn ${btnMinus} w-7 h-7 rounded text-sm font-bold" data-stat="points" data-delta="-1">-</button>
        </div>
        <span class="w-16 text-center font-bold text-4xl text-blue-500">${player.stats.points}</span>
        <div class="flex-1 flex justify-start pl-2 gap-1">
          <button class="stat-btn bg-blue-500 hover:bg-blue-600 text-white w-8 h-8 rounded text-sm font-bold" data-stat="points" data-delta="1">+1</button>
          <button class="stat-btn bg-blue-500 hover:bg-blue-600 text-white w-8 h-8 rounded text-sm font-bold" data-stat="points" data-delta="2">+2</button>
          <button class="stat-btn bg-blue-600 hover:bg-blue-700 text-white w-8 h-8 rounded text-sm font-bold" data-stat="points" data-delta="3">+3</button>
        </div>
      </div>

      <!-- 파울 (w-28) -->
      <div class="w-28 flex items-center">
        <div class="w-9 flex justify-end">
          <button class="stat-btn ${btnMinus} w-7 h-7 rounded text-sm" data-stat="fouls" data-delta="-1">-</button>
        </div>
        <span class="w-10 text-center font-bold text-2xl ${foulWarning ? 'text-orange-500' : isDark ? 'text-gray-300' : 'text-gray-700'}">${player.stats.fouls}</span>
        <div class="w-9 flex justify-start">
          <button class="stat-btn bg-orange-500 hover:bg-orange-600 text-white w-7 h-7 rounded text-sm" data-stat="fouls" data-delta="1">+</button>
        </div>
      </div>

      <!-- 리바운드 (w-28) -->
      <div class="w-28 flex items-center ${disabled}">
        <div class="w-9 flex justify-end">
          <button class="stat-btn ${btnMinus} w-7 h-7 rounded text-sm" data-stat="rebounds" data-delta="-1">-</button>
        </div>
        <span class="w-10 text-center font-bold text-2xl ${isDark ? 'text-gray-300' : 'text-gray-700'}">${player.stats.rebounds}</span>
        <div class="w-9 flex justify-start">
          <button class="stat-btn bg-green-500 hover:bg-green-600 text-white w-7 h-7 rounded text-sm" data-stat="rebounds" data-delta="1">+</button>
        </div>
      </div>
    </div>
  `;
}

function bindEvents() {
  const game = getCurrentGame();

  // 테마 토글 버튼
  document.getElementById('btn-theme').addEventListener('click', () => {
    toggleTheme();
    render();
  });

  // 인라인 스탯 버튼 (+/-)
  document.querySelectorAll('.stat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const row = btn.closest('.player-row');
      const playerId = row.dataset.playerId;
      const team = row.dataset.team;
      const stat = btn.dataset.stat;
      const delta = parseInt(btn.dataset.delta);

      const player = game.teams[team].players.find(p => p.id === playerId);
      if (!player) return;

      // 음수가 되지 않도록 체크
      if (player.stats[stat] + delta < 0) return;

      // 히스토리에 추가 (증가할 때만)
      if (delta > 0) {
        addToHistory({
          type: stat === 'points' ? 'SCORE' : stat === 'fouls' ? 'FOUL' : 'REBOUND',
          data: {
            team,
            playerId,
            ...(stat === 'points' ? { points: delta } : {})
          }
        });
      }

      updatePlayerStat(team, playerId, stat, delta);
      render();
    });
  });

  // 벤치 칩 클릭 (교체)
  document.querySelectorAll('.bench-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const team = chip.dataset.team;
      const benchPlayerId = chip.dataset.playerId;
      showSubstitutionSelect(team, benchPlayerId);
    });
  });

  // 취소 버튼
  document.getElementById('btn-undo').addEventListener('click', () => {
    const undone = undoLastAction();
    if (undone) {
      render();
    }
  });

  // 교체 버튼
  document.getElementById('btn-substitute').addEventListener('click', () => {
    showModal('substitution');
  });

  // 쿼터 종료 버튼
  document.getElementById('btn-quarter-end').addEventListener('click', () => {
    showModal('quarter-end');
  });

  // 경기 종료 버튼
  document.getElementById('btn-game-end').addEventListener('click', () => {
    showModal('game-end');
  });
}

function showModal(type) {
  modalType = type;
  const container = document.getElementById('modal-container');
  const game = getCurrentGame();

  let content = '';

  switch (type) {
    case 'score':
      content = `
        <div class="modal-overlay" id="modal-overlay">
          <div class="modal-content">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold">#${selectedPlayer.player.number} ${selectedPlayer.player.name} 득점</h3>
              <button class="modal-close text-2xl text-gray-400">&times;</button>
            </div>

            <div class="flex gap-3 mb-4">
              <button class="score-btn btn btn-primary flex-1 py-4 text-xl" data-points="1">+1<br><span class="text-sm">자유투</span></button>
              <button class="score-btn btn btn-primary flex-1 py-4 text-xl" data-points="2">+2<br><span class="text-sm">필드골</span></button>
              <button class="score-btn btn btn-primary flex-1 py-4 text-xl" data-points="3">+3<br><span class="text-sm">3점슛</span></button>
            </div>

            <div class="text-center text-gray-400 mb-3">현재: ${selectedPlayer.player.stats.points}점</div>

            <button class="score-btn btn btn-secondary w-full" data-points="-1">-1 (점수 취소)</button>
          </div>
        </div>
      `;
      break;

    case 'foul':
      const currentFouls = selectedPlayer.player.stats.fouls;
      const foulLimit = game.settings.personalFoulLimit;
      content = `
        <div class="modal-overlay" id="modal-overlay">
          <div class="modal-content">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold">#${selectedPlayer.player.number} ${selectedPlayer.player.name} 파울</h3>
              <button class="modal-close text-2xl text-gray-400">&times;</button>
            </div>

            <div class="text-center mb-4">
              <div class="text-2xl font-bold mb-2">현재 파울: ${currentFouls} / ${foulLimit}</div>
              <div class="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full ${currentFouls >= foulLimit - 1 ? 'bg-orange-500' : 'bg-blue-500'}" style="width: ${(currentFouls / foulLimit) * 100}%"></div>
              </div>
            </div>

            <div class="flex gap-3 mb-4">
              <button class="foul-btn btn btn-danger flex-1 py-4 text-lg" data-delta="1">+1 파울</button>
              <button class="foul-btn btn btn-secondary flex-1 py-4 text-lg" data-delta="-1">-1 파울</button>
            </div>

            ${currentFouls >= foulLimit - 1 ? `
              <p class="text-orange-400 text-sm text-center">⚠️ ${foulLimit}파울 시 퇴장 처리됩니다</p>
            ` : ''}
          </div>
        </div>
      `;
      break;

    case 'rebound':
      content = `
        <div class="modal-overlay" id="modal-overlay">
          <div class="modal-content">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold">#${selectedPlayer.player.number} ${selectedPlayer.player.name} 리바운드</h3>
              <button class="modal-close text-2xl text-gray-400">&times;</button>
            </div>

            <div class="text-center text-2xl font-bold mb-4">현재 리바운드: ${selectedPlayer.player.stats.rebounds}</div>

            <div class="flex gap-3">
              <button class="rebound-btn btn btn-success flex-1 py-4 text-lg" data-delta="1">+1</button>
              <button class="rebound-btn btn btn-secondary flex-1 py-4 text-lg" data-delta="-1">-1</button>
            </div>
          </div>
        </div>
      `;
      break;

    case 'player-action':
      content = `
        <div class="modal-overlay" id="modal-overlay">
          <div class="modal-content">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold">#${selectedPlayer.player.number} ${selectedPlayer.player.name}</h3>
              <button class="modal-close text-2xl text-gray-400">&times;</button>
            </div>

            <div class="text-center mb-4">
              <div class="text-3xl font-bold mb-1">${selectedPlayer.player.stats.points}pts</div>
              <div class="text-gray-400">F:${selectedPlayer.player.stats.fouls} | R:${selectedPlayer.player.stats.rebounds}</div>
            </div>

            <div class="space-y-2">
              <div class="text-sm text-gray-400 mb-1">득점</div>
              <div class="flex gap-2 mb-4">
                <button class="score-btn btn btn-primary flex-1 py-3" data-points="1">+1</button>
                <button class="score-btn btn btn-primary flex-1 py-3" data-points="2">+2</button>
                <button class="score-btn btn btn-primary flex-1 py-3" data-points="3">+3</button>
                <button class="score-btn btn btn-secondary flex-1 py-3" data-points="-1">-1</button>
              </div>

              <div class="flex gap-2">
                <button class="foul-btn btn btn-danger flex-1 py-3" data-delta="1">파울 +1</button>
                <button class="rebound-btn btn btn-success flex-1 py-3" data-delta="1">리바운드 +1</button>
              </div>
            </div>
          </div>
        </div>
      `;
      break;

    case 'substitution':
      const homeBench = game.teams.home.players.filter(p => !p.isOnCourt);
      const awayBench = game.teams.away.players.filter(p => !p.isOnCourt);
      content = `
        <div class="modal-overlay" id="modal-overlay">
          <div class="modal-content max-w-2xl">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold">🔄 선수 교체</h3>
              <button class="modal-close text-2xl text-gray-400">&times;</button>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- 홈팀 벤치 -->
              <div>
                <div class="text-blue-400 text-sm mb-2">${game.teams.home.name} 벤치</div>
                ${homeBench.length === 0 ? `
                  <p class="text-gray-500 text-sm">벤치 선수 없음</p>
                ` : `
                  <div class="space-y-2">
                    ${homeBench.map(p => `
                      <button class="bench-player w-full text-left bg-gray-700 rounded-lg p-2 hover:bg-gray-600" data-team="home" data-player-id="${p.id}">
                        #${p.number} ${p.name}
                      </button>
                    `).join('')}
                  </div>
                `}
              </div>

              <!-- 어웨이팀 벤치 -->
              <div>
                <div class="text-red-400 text-sm mb-2">${game.teams.away.name} 벤치</div>
                ${awayBench.length === 0 ? `
                  <p class="text-gray-500 text-sm">벤치 선수 없음</p>
                ` : `
                  <div class="space-y-2">
                    ${awayBench.map(p => `
                      <button class="bench-player w-full text-left bg-gray-700 rounded-lg p-2 hover:bg-gray-600" data-team="away" data-player-id="${p.id}">
                        #${p.number} ${p.name}
                      </button>
                    `).join('')}
                  </div>
                `}
              </div>
            </div>

            <p class="text-gray-500 text-sm mt-4 text-center">벤치 선수를 탭하면 교체할 온코트 선수를 선택합니다</p>
          </div>
        </div>
      `;
      break;

    case 'quarter-end':
      content = `
        <div class="modal-overlay" id="modal-overlay">
          <div class="modal-content">
            <h3 class="text-xl font-bold mb-4 text-center">⏭️ 쿼터 종료</h3>

            <p class="text-center mb-4">
              ${game.currentQuarter}쿼터를 종료하시겠습니까?
            </p>

            <p class="text-center text-gray-400 mb-4">
              현재 스코어: ${game.teams.home.name} ${getTeamTotalScore('home')} - ${getTeamTotalScore('away')} ${game.teams.away.name}
            </p>

            <p class="text-center text-yellow-500 text-sm mb-6">
              팀파울이 초기화됩니다
            </p>

            <div class="flex gap-3">
              <button class="modal-close btn btn-secondary flex-1">취소</button>
              <button id="confirm-quarter-end" class="btn btn-primary flex-1">종료하기</button>
            </div>
          </div>
        </div>
      `;
      break;

    case 'game-end':
      content = `
        <div class="modal-overlay" id="modal-overlay">
          <div class="modal-content">
            <h3 class="text-xl font-bold mb-4 text-center">🏁 경기 종료</h3>

            <p class="text-center mb-4">
              경기를 종료하시겠습니까?
            </p>

            <p class="text-center text-red-400 text-sm mb-6">
              ⚠️ 종료 후에는 수정할 수 없습니다
            </p>

            <div class="flex gap-3">
              <button class="modal-close btn btn-secondary flex-1">취소</button>
              <button id="confirm-game-end" class="btn btn-danger flex-1">종료하기</button>
            </div>
          </div>
        </div>
      `;
      break;
  }

  container.innerHTML = content;

  // 모달 이벤트 바인딩
  bindModalEvents();
}

function bindModalEvents() {
  const game = getCurrentGame();

  // 닫기 버튼
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  // 오버레이 클릭으로 닫기
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  // 득점 버튼
  document.querySelectorAll('.score-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const points = parseInt(btn.dataset.points);
      if (selectedPlayer.player.stats.points + points >= 0) {
        addToHistory({
          type: 'SCORE',
          data: {
            team: selectedPlayer.team,
            playerId: selectedPlayer.player.id,
            points: points,
            previousPoints: selectedPlayer.player.stats.points
          }
        });
        updatePlayerStat(selectedPlayer.team, selectedPlayer.player.id, 'points', points);
      }
      closeModal();
      render();
    });
  });

  // 파울 버튼
  document.querySelectorAll('.foul-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const delta = parseInt(btn.dataset.delta);
      if (selectedPlayer.player.stats.fouls + delta >= 0) {
        if (delta > 0) {
          addToHistory({
            type: 'FOUL',
            data: {
              team: selectedPlayer.team,
              playerId: selectedPlayer.player.id,
              previousFouls: selectedPlayer.player.stats.fouls
            }
          });
        }
        updatePlayerStat(selectedPlayer.team, selectedPlayer.player.id, 'fouls', delta);
      }
      closeModal();
      render();
    });
  });

  // 리바운드 버튼
  document.querySelectorAll('.rebound-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const delta = parseInt(btn.dataset.delta);
      if (selectedPlayer.player.stats.rebounds + delta >= 0) {
        if (delta > 0) {
          addToHistory({
            type: 'REBOUND',
            data: {
              team: selectedPlayer.team,
              playerId: selectedPlayer.player.id,
              previousRebounds: selectedPlayer.player.stats.rebounds
            }
          });
        }
        updatePlayerStat(selectedPlayer.team, selectedPlayer.player.id, 'rebounds', delta);
      }
      closeModal();
      render();
    });
  });

  // 벤치 선수 클릭 (교체)
  document.querySelectorAll('.bench-player').forEach(btn => {
    btn.addEventListener('click', () => {
      const team = btn.dataset.team;
      const benchPlayerId = btn.dataset.playerId;
      showSubstitutionSelect(team, benchPlayerId);
    });
  });

  // 쿼터 종료 확인
  const quarterEndBtn = document.getElementById('confirm-quarter-end');
  if (quarterEndBtn) {
    quarterEndBtn.addEventListener('click', () => {
      const game = getCurrentGame();
      if (game.currentQuarter < game.settings.quarters) {
        updateGame(g => {
          g.currentQuarter++;
          return g;
        });
        closeModal();
        render();
      } else {
        // 마지막 쿼터면 경기 종료
        updateGame(g => {
          g.status = 'finished';
          return g;
        });
        navigate('/summary');
      }
    });
  }

  // 경기 종료 확인
  const gameEndBtn = document.getElementById('confirm-game-end');
  if (gameEndBtn) {
    gameEndBtn.addEventListener('click', () => {
      updateGame(g => {
        g.status = 'finished';
        return g;
      });
      navigate('/summary');
    });
  }
}

function showSubstitutionSelect(team, benchPlayerId) {
  const game = getCurrentGame();
  const onCourt = game.teams[team].players.filter(p => p.isOnCourt);
  const benchPlayer = game.teams[team].players.find(p => p.id === benchPlayerId);

  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-content">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold">🔄 선수 교체</h3>
          <button class="modal-close text-2xl text-gray-400">&times;</button>
        </div>

        <div class="bg-green-900/30 rounded-lg p-3 mb-4 text-center">
          <div class="text-green-400 text-sm mb-1">IN</div>
          <div class="font-bold">#${benchPlayer.number} ${benchPlayer.name}</div>
        </div>

        <div class="text-center text-2xl mb-4">↕️</div>

        <div class="text-gray-400 text-sm mb-2">교체할 선수 선택:</div>
        <div class="space-y-2">
          ${onCourt.map(p => `
            <button class="substitute-out w-full bg-gray-700 rounded-lg p-3 text-left hover:bg-gray-600 flex justify-between items-center" data-player-id="${p.id}">
              <span>#${p.number} ${p.name}</span>
              <span class="text-gray-400 text-sm">${p.stats.points}pts, F:${p.stats.fouls}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // 이벤트 바인딩
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });

  document.querySelectorAll('.substitute-out').forEach(btn => {
    btn.addEventListener('click', () => {
      const outPlayerId = btn.dataset.playerId;

      addToHistory({
        type: 'SUBSTITUTION',
        data: {
          team,
          inPlayerId: benchPlayerId,
          outPlayerId
        }
      });

      updateGame(g => {
        const inPlayer = g.teams[team].players.find(p => p.id === benchPlayerId);
        const outPlayer = g.teams[team].players.find(p => p.id === outPlayerId);
        if (inPlayer) inPlayer.isOnCourt = true;
        if (outPlayer) outPlayer.isOnCourt = false;
        return g;
      });

      closeModal();
      render();
    });
  });
}

function closeModal() {
  const container = document.getElementById('modal-container');
  container.innerHTML = '';
  modalType = null;
  selectedPlayer = null;
}
