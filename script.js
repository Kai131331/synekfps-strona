document.getElementById('year').textContent = new Date().getFullYear();

const THEME_KEY = 'synekfps-theme';
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) { applyTheme(saved); return; }
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(prefersLight ? 'light' : 'dark');
})();

themeToggle.addEventListener('click', () => {
  const current = root.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

navToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

mainNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

const TWITCH_CHANNEL = 'synekfps';

const livePill = document.getElementById('livePill');
const brandStatusDot = document.getElementById('brandStatusDot');
const offlineCover = document.getElementById('offlineCover');
const twitchEmbed = document.getElementById('twitchEmbed');

function setLiveState(isLive) {
  if (isLive) {
    livePill.classList.add('is-live');
    livePill.innerHTML = '<span class="live-dot"></span>NA ŻYWO';
    brandStatusDot.classList.add('is-live');
    offlineCover.classList.add('is-hidden');
    twitchEmbed.src = twitchEmbed.src.replace('muted=true', 'muted=false');
  } else {
    livePill.classList.remove('is-live');
    livePill.innerHTML = '<span class="live-dot"></span>OFFLINE';
    brandStatusDot.classList.remove('is-live');
    offlineCover.classList.remove('is-hidden');
  }
}

async function checkLiveStatus() {
  try {
    const res = await fetch(`https://decapi.me/twitch/uptime/${TWITCH_CHANNEL}`);
    const text = (await res.text()).toLowerCase();
    const isLive = !text.includes('offline') && !text.includes('error');
    setLiveState(isLive);
  } catch (err) {
    setLiveState(false);
  }
}

checkLiveStatus();
setInterval(checkLiveStatus, 60000); 

const RIOT_NAME = 'Fifi Zabijaka';
const RIOT_TAG = 'Tren';

async function fetchValorantStats() {
  const res = await fetch('https://synekfps-api.onrender.com/api/valorant-stats');
  const data = await res.json();

  const mmr = data.mmr.data;
  const allMatches = data.matches?.data || [];

  const competitive = allMatches.filter(m => m.metadata?.mode === 'Competitive');

  let totalKills = 0, totalDeaths = 0, totalHeadshots = 0, totalShots = 0, wins = 0;

  competitive.forEach(m => {
    const me = m.players?.all_players?.find(
      p => p.name?.toLowerCase() === RIOT_NAME.toLowerCase() &&
           p.tag?.toLowerCase() === RIOT_TAG.toLowerCase()
    );
    if (!me) return;

    totalKills += me.stats?.kills || 0;
    totalDeaths += me.stats?.deaths || 0;
    totalHeadshots += me.stats?.headshots || 0;
    totalShots += (me.stats?.headshots || 0) + (me.stats?.bodyshots || 0) + (me.stats?.legshots || 0);

    const myTeam = me.team?.toLowerCase();
    const otherTeam = myTeam === 'red' ? 'blue' : 'red';
    const myRounds = m.teams?.[myTeam]?.rounds_won;
    const otherRounds = m.teams?.[otherTeam]?.rounds_won;
    if (typeof myRounds === 'number' && typeof otherRounds === 'number' && myRounds > otherRounds) {
      wins++;
    }
  });

  const matches = allMatches.slice(0, 5).map(m => {
    const me = m.players?.all_players?.find(
      p => p.name?.toLowerCase() === RIOT_NAME.toLowerCase() &&
           p.tag?.toLowerCase() === RIOT_TAG.toLowerCase()
    );
    if (!me) return null;

    const myTeam = me.team?.toLowerCase();
    const otherTeam = myTeam === 'red' ? 'blue' : 'red';
    const myRounds = m.teams?.[myTeam]?.rounds_won;
    const otherRounds = m.teams?.[otherTeam]?.rounds_won;

    let result = 'neutral';
    let score = `${me.stats?.kills ?? 0} fragów`;
    if (typeof myRounds === 'number' && typeof otherRounds === 'number') {
      result = myRounds > otherRounds ? 'win' : 'loss';
      score = `${myRounds}:${otherRounds}`;
    }

    return {
      map: m.metadata?.map || '—',
      result,
      score,
      kd: `${me.stats?.kills ?? 0}/${me.stats?.deaths ?? 0}/${me.stats?.assists ?? 0}`,
    };
  }).filter(Boolean);

  return {
    rank: mmr.current_data.currenttierpatched,
    rr: mmr.current_data.ranking_in_tier,
    kd: competitive.length ? (totalKills / Math.max(totalDeaths, 1)).toFixed(2) : '—',
    hs: totalShots ? `${Math.round((totalHeadshots / totalShots) * 100)}%` : '—',
    winrate: competitive.length ? `${Math.round((wins / competitive.length) * 100)}%` : '—',
    updated: new Date().toLocaleTimeString('pl-PL'),
    matches,
  };
}

function renderStats(data) {
  document.getElementById('statRank').textContent = data.rank;
  document.getElementById('statRR').textContent = `${data.rr} RR`;
  document.getElementById('statKD').textContent = data.kd;
  document.getElementById('statHS').textContent = data.hs;
  document.getElementById('statWR').textContent = data.winrate;
  document.getElementById('statsUpdated').textContent = `zaktualizowano: ${data.updated}`;

  const list = document.getElementById('matchesList');
  list.innerHTML = '';
  data.matches.forEach(m => {
    const row = document.createElement('div');
    row.className = 'match-row';
    row.innerHTML = `
      <span class="match-flag ${m.result}"></span>
      <span class="match-map">${m.map}</span>
      <span class="match-score">${m.score}</span>
      <span class="match-kd">${m.kd}</span>
    `;
    list.appendChild(row);
  });
}

fetchValorantStats().then(renderStats);

const copyBtn = document.getElementById('copyCrosshair');
const copyHint = document.getElementById('copyHint');
const crosshairCode = document.getElementById('crosshairCode');

copyBtn.addEventListener('click', async () => {
  const code = crosshairCode.textContent.trim();
  try {
    await navigator.clipboard.writeText(code);
  } catch (err) {
    const ta = document.createElement('textarea');
    ta.value = code;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  copyHint.textContent = 'Skopiowano do schowka ✓';
  setTimeout(() => (copyHint.textContent = ''), 2500);
});

const dpiInput = document.getElementById('dpiInput');
const sensInput = document.getElementById('sensInput');
const edpiResult = document.getElementById('edpiResult');

function updateEdpi() {
  const dpi = parseFloat(dpiInput.value) || 0;
  const sens = parseFloat(sensInput.value) || 0;
  edpiResult.textContent = Math.round(dpi * sens);
}
dpiInput.addEventListener('input', updateEdpi);
sensInput.addEventListener('input', updateEdpi);
updateEdpi();

const sponsorForm = document.getElementById('sponsorForm');
const formStatus = document.getElementById('formStatus');

sponsorForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(sponsorForm).entries());

  if (!data.company || !data.email || !data.collab || !data.message) {
    formStatus.textContent = 'Uzupełnij wszystkie pola.';
    return;
  }
  
  console.log('Zapytanie sponsorskie:', data);

  formStatus.textContent = `Dzięki, ${data.company}! Odpowiem w ciągu 48h na ${data.email}.`;
  sponsorForm.reset();
});

const backToTopBtn = document.getElementById('backToTopBtn');

if (backToTopBtn) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('is-visible');
    } else {
      backToTopBtn.classList.remove('is-visible');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}
