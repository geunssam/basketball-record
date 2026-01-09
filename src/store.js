// 상태 관리 스토어
const STORAGE_KEY = 'basketball-games';
const SETTINGS_KEY = 'basketball-settings';

// 기본 설정값
const defaultSettings = {
  quarters: 4,
  personalFoulLimit: 5,
  teamFoulLimit: 5
};

// 새 경기 생성
export function createNewGame(settings = defaultSettings) {
  return {
    id: `game_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'setup', // setup | in_progress | finished
    settings: { ...settings },
    currentQuarter: 1,
    teams: {
      home: {
        name: '홈팀',
        teamFouls: Array(settings.quarters).fill(0),
        quarterScores: Array(settings.quarters).fill(0),
        players: []
      },
      away: {
        name: '어웨이팀',
        teamFouls: Array(settings.quarters).fill(0),
        quarterScores: Array(settings.quarters).fill(0),
        players: []
      }
    },
    history: []
  };
}

// 새 선수 생성
export function createPlayer(number, name) {
  return {
    id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    number: parseInt(number),
    name,
    isOnCourt: false,
    stats: {
      points: 0,
      fouls: 0,
      rebounds: 0
    }
  };
}

// 현재 경기 상태 관리
let currentGame = null;
let listeners = [];

export function getCurrentGame() {
  return currentGame;
}

export function setCurrentGame(game) {
  currentGame = game;
  notifyListeners();
  if (game) {
    saveCurrentGame();
  }
}

export function updateGame(updater) {
  if (currentGame) {
    currentGame = updater(currentGame);
    currentGame.updatedAt = new Date().toISOString();
    notifyListeners();
    saveCurrentGame();
  }
}

// 히스토리에 액션 추가 (실행 취소용)
export function addToHistory(action) {
  if (currentGame) {
    currentGame.history.push({
      ...action,
      timestamp: new Date().toISOString()
    });
    // 최근 30개만 유지
    if (currentGame.history.length > 30) {
      currentGame.history.shift();
    }
    saveCurrentGame();
  }
}

// 마지막 액션 취소
export function undoLastAction() {
  if (currentGame && currentGame.history.length > 0) {
    const lastAction = currentGame.history.pop();

    switch (lastAction.type) {
      case 'SCORE':
        updatePlayerStat(
          lastAction.data.team,
          lastAction.data.playerId,
          'points',
          -lastAction.data.points
        );
        break;
      case 'FOUL':
        updatePlayerStat(
          lastAction.data.team,
          lastAction.data.playerId,
          'fouls',
          -1
        );
        // 팀 파울도 되돌리기
        const q = currentGame.currentQuarter - 1;
        currentGame.teams[lastAction.data.team].teamFouls[q]--;
        break;
      case 'REBOUND':
        updatePlayerStat(
          lastAction.data.team,
          lastAction.data.playerId,
          'rebounds',
          -1
        );
        break;
      case 'SUBSTITUTION':
        // 교체 되돌리기
        const team = currentGame.teams[lastAction.data.team];
        const inPlayer = team.players.find(p => p.id === lastAction.data.inPlayerId);
        const outPlayer = team.players.find(p => p.id === lastAction.data.outPlayerId);
        if (inPlayer) inPlayer.isOnCourt = false;
        if (outPlayer) outPlayer.isOnCourt = true;
        break;
    }

    notifyListeners();
    saveCurrentGame();
    return lastAction;
  }
  return null;
}

// 선수 스탯 업데이트
export function updatePlayerStat(teamKey, playerId, statName, delta) {
  if (currentGame) {
    const team = currentGame.teams[teamKey];
    const player = team.players.find(p => p.id === playerId);
    if (player) {
      player.stats[statName] = Math.max(0, player.stats[statName] + delta);

      // 득점이면 쿼터 점수도 업데이트
      if (statName === 'points') {
        const q = currentGame.currentQuarter - 1;
        team.quarterScores[q] = Math.max(0, team.quarterScores[q] + delta);
      }

      // 파울이면 팀 파울도 업데이트 (증가/감소 모두)
      if (statName === 'fouls') {
        const q = currentGame.currentQuarter - 1;
        team.teamFouls[q] = Math.max(0, team.teamFouls[q] + delta);
      }

      notifyListeners();
      saveCurrentGame();
    }
  }
}

// 구독 시스템
export function subscribe(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

function notifyListeners() {
  listeners.forEach(listener => listener(currentGame));
}

// localStorage 관련 함수들
export function saveCurrentGame() {
  if (currentGame) {
    const games = getSavedGames();
    const index = games.findIndex(g => g.id === currentGame.id);
    if (index >= 0) {
      games[index] = currentGame;
    } else {
      games.unshift(currentGame);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  }
}

export function getSavedGames() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function loadGame(gameId) {
  const games = getSavedGames();
  const game = games.find(g => g.id === gameId);
  if (game) {
    setCurrentGame(game);
  }
  return game;
}

export function deleteGame(gameId) {
  let games = getSavedGames();
  games = games.filter(g => g.id !== gameId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

// 설정 관련
export function getSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// 팀 총점 계산
export function getTeamTotalScore(teamKey) {
  if (!currentGame) return 0;
  return currentGame.teams[teamKey].quarterScores.reduce((sum, s) => sum + s, 0);
}

// 현재 쿼터 팀 파울
export function getCurrentQuarterTeamFouls(teamKey) {
  if (!currentGame) return 0;
  const q = currentGame.currentQuarter - 1;
  return currentGame.teams[teamKey].teamFouls[q];
}

// 테마 관련
const THEME_KEY = 'basketball-theme';

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

// 목업 데이터로 테스트 경기 생성
export function createMockGame() {
  const settings = getSettings();

  const game = {
    id: `game_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'in_progress',
    settings: { ...settings },
    currentQuarter: 2,
    teams: {
      home: {
        name: '청팀',
        teamFouls: [0, 3, 0, 0], // Q2: 선수 파울 합계 3 (김철수1 + 박민수1 + 정대현1)
        quarterScores: [18, 12, 0, 0],
        players: [
          { id: 'h1', number: 7, name: '김철수', isOnCourt: true, stats: { points: 8, fouls: 1, rebounds: 3 } },
          { id: 'h2', number: 11, name: '이영희', isOnCourt: true, stats: { points: 6, fouls: 0, rebounds: 2 } },
          { id: 'h3', number: 23, name: '박민수', isOnCourt: true, stats: { points: 10, fouls: 1, rebounds: 5 } },
          { id: 'h4', number: 32, name: '최지훈', isOnCourt: true, stats: { points: 4, fouls: 0, rebounds: 1 } },
          { id: 'h5', number: 45, name: '정대현', isOnCourt: true, stats: { points: 2, fouls: 1, rebounds: 2 } },
          { id: 'h6', number: 5, name: '홍길동', isOnCourt: false, stats: { points: 0, fouls: 0, rebounds: 0 } },
          { id: 'h7', number: 8, name: '강감찬', isOnCourt: false, stats: { points: 0, fouls: 0, rebounds: 0 } },
          { id: 'h8', number: 15, name: '을지문덕', isOnCourt: false, stats: { points: 0, fouls: 0, rebounds: 0 } },
        ]
      },
      away: {
        name: '백팀',
        teamFouls: [0, 3, 0, 0], // Q2: 선수 파울 합계 3 (이순신1 + 광개토2)
        quarterScores: [20, 14, 0, 0],
        players: [
          { id: 'a1', number: 3, name: '이순신', isOnCourt: true, stats: { points: 12, fouls: 1, rebounds: 4 } },
          { id: 'a2', number: 10, name: '세종대왕', isOnCourt: true, stats: { points: 8, fouls: 0, rebounds: 3 } },
          { id: 'a3', number: 21, name: '광개토', isOnCourt: true, stats: { points: 6, fouls: 2, rebounds: 2 } },
          { id: 'a4', number: 30, name: '장보고', isOnCourt: true, stats: { points: 4, fouls: 0, rebounds: 1 } },
          { id: 'a5', number: 44, name: '김유신', isOnCourt: true, stats: { points: 4, fouls: 0, rebounds: 3 } },
          { id: 'a6', number: 4, name: '유관순', isOnCourt: false, stats: { points: 0, fouls: 0, rebounds: 0 } },
          { id: 'a7', number: 9, name: '안중근', isOnCourt: false, stats: { points: 0, fouls: 0, rebounds: 0 } },
          { id: 'a8', number: 12, name: '윤봉길', isOnCourt: false, stats: { points: 0, fouls: 0, rebounds: 0 } },
        ]
      }
    },
    history: []
  };

  setCurrentGame(game);
  return game;
}
