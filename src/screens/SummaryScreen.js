import { navigate } from '../router.js';
import { getCurrentGame, getTeamTotalScore, saveCurrentGame } from '../store.js';

export function renderSummaryScreen() {
  const app = document.getElementById('app');
  const game = getCurrentGame();

  if (!game) {
    navigate('/');
    return;
  }

  const homeScore = getTeamTotalScore('home');
  const awayScore = getTeamTotalScore('away');

  const winner = homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'tie';

  // 최다 득점자 찾기
  const homeMVP = [...game.teams.home.players].sort((a, b) => b.stats.points - a.stats.points)[0];
  const awayMVP = [...game.teams.away.players].sort((a, b) => b.stats.points - a.stats.points)[0];

  // 팀 스탯 계산
  const homeRebounds = game.teams.home.players.reduce((sum, p) => sum + p.stats.rebounds, 0);
  const awayRebounds = game.teams.away.players.reduce((sum, p) => sum + p.stats.rebounds, 0);
  const homeFouls = game.teams.home.players.reduce((sum, p) => sum + p.stats.fouls, 0);
  const awayFouls = game.teams.away.players.reduce((sum, p) => sum + p.stats.fouls, 0);

  app.innerHTML = `
    <div class="min-h-screen flex flex-col bg-bg-primary p-4">
      <div class="max-w-lg mx-auto w-full">
        <!-- 헤더 -->
        <div class="text-center mb-6">
          <div class="text-4xl mb-2">🏆</div>
          <h1 class="text-2xl font-bold">경기 종료</h1>
        </div>

        <!-- 최종 점수 -->
        <div class="bg-gray-800 rounded-2xl p-6 mb-4">
          <div class="flex items-center justify-center gap-4">
            <div class="text-center flex-1">
              <div class="text-sm ${winner === 'home' ? 'text-yellow-400' : 'text-blue-400'}">${game.teams.home.name}</div>
              <div class="text-5xl font-bold">${homeScore}</div>
              ${winner === 'home' ? '<div class="text-yellow-400 text-sm mt-1">승리! 🎉</div>' : ''}
            </div>

            <div class="text-2xl text-gray-500">vs</div>

            <div class="text-center flex-1">
              <div class="text-sm ${winner === 'away' ? 'text-yellow-400' : 'text-red-400'}">${game.teams.away.name}</div>
              <div class="text-5xl font-bold">${awayScore}</div>
              ${winner === 'away' ? '<div class="text-yellow-400 text-sm mt-1">승리! 🎉</div>' : ''}
            </div>
          </div>

          ${winner === 'tie' ? '<div class="text-center text-gray-400 mt-2">무승부</div>' : ''}
        </div>

        <!-- 쿼터별 점수 -->
        <div class="bg-gray-800 rounded-xl p-4 mb-4">
          <h3 class="text-gray-400 text-sm mb-3">쿼터별 점수</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-center">
              <thead>
                <tr class="text-gray-500 text-sm">
                  <th class="py-1"></th>
                  ${game.teams.home.quarterScores.map((_, i) => `<th class="py-1">Q${i + 1}</th>`).join('')}
                  <th class="py-1">합계</th>
                </tr>
              </thead>
              <tbody>
                <tr class="text-blue-400">
                  <td class="py-1 text-left">${game.teams.home.name}</td>
                  ${game.teams.home.quarterScores.map(s => `<td class="py-1">${s}</td>`).join('')}
                  <td class="py-1 font-bold">${homeScore}</td>
                </tr>
                <tr class="text-red-400">
                  <td class="py-1 text-left">${game.teams.away.name}</td>
                  ${game.teams.away.quarterScores.map(s => `<td class="py-1">${s}</td>`).join('')}
                  <td class="py-1 font-bold">${awayScore}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- MVP -->
        <div class="bg-gray-800 rounded-xl p-4 mb-4">
          <h3 class="text-gray-400 text-sm mb-3">🌟 최다 득점</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <div class="text-blue-400 text-sm mb-1">${game.teams.home.name}</div>
              ${homeMVP ? `
                <div class="font-bold">#${homeMVP.number} ${homeMVP.name}</div>
                <div class="text-yellow-400">${homeMVP.stats.points}pts</div>
              ` : '<div class="text-gray-500">-</div>'}
            </div>
            <div class="text-center">
              <div class="text-red-400 text-sm mb-1">${game.teams.away.name}</div>
              ${awayMVP ? `
                <div class="font-bold">#${awayMVP.number} ${awayMVP.name}</div>
                <div class="text-yellow-400">${awayMVP.stats.points}pts</div>
              ` : '<div class="text-gray-500">-</div>'}
            </div>
          </div>
        </div>

        <!-- 팀 스탯 -->
        <div class="bg-gray-800 rounded-xl p-4 mb-6">
          <h3 class="text-gray-400 text-sm mb-3">📊 팀 스탯</h3>
          <table class="w-full">
            <thead>
              <tr class="text-gray-500 text-sm">
                <th class="py-1 text-left"></th>
                <th class="py-1 text-center text-blue-400">${game.teams.home.name}</th>
                <th class="py-1 text-center text-red-400">${game.teams.away.name}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="py-2">총 리바운드</td>
                <td class="py-2 text-center font-bold">${homeRebounds}</td>
                <td class="py-2 text-center font-bold">${awayRebounds}</td>
              </tr>
              <tr>
                <td class="py-2">총 파울</td>
                <td class="py-2 text-center font-bold">${homeFouls}</td>
                <td class="py-2 text-center font-bold">${awayFouls}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 버튼 -->
        <div class="flex gap-3">
          <button id="btn-home" class="btn btn-secondary flex-1">
            홈으로 돌아가기
          </button>
          <button id="btn-save" class="btn btn-primary flex-1">
            결과 저장하기
          </button>
        </div>
      </div>
    </div>
  `;

  // 이벤트 바인딩
  document.getElementById('btn-home').addEventListener('click', () => {
    navigate('/');
  });

  document.getElementById('btn-save').addEventListener('click', () => {
    saveCurrentGame();
    alert('경기 결과가 저장되었습니다!');
    navigate('/');
  });
}
