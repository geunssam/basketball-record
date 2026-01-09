import './style.css';
import { registerRoute, initRouter } from './router.js';
import { renderHomeScreen } from './screens/HomeScreen.js';
import { renderGameSetupScreen } from './screens/GameSetupScreen.js';
import { renderLineupScreen } from './screens/LineupScreen.js';
import { renderGameScreen } from './screens/GameScreen.js';
import { renderSummaryScreen } from './screens/SummaryScreen.js';

// 라우트 등록
registerRoute('/', renderHomeScreen);
registerRoute('/setup', renderGameSetupScreen);
registerRoute('/lineup', renderLineupScreen);
registerRoute('/game', renderGameScreen);
registerRoute('/summary', renderSummaryScreen);

// 라우터 초기화
initRouter();
