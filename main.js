/* ═══════════════════════════════════════════════
   ASHEN THRONE — Development Exhibition & 3-5 Min Pitch Deck
   초고속 리빌 · 스피드 슬라이드 제어 · 4분 발표 타이머 · 보스 도감 · SFX
   ═══════════════════════════════════════════════ */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ── 0. Web Audio API 절차적 SFX 엔진 ── */
  let audioCtx = null;
  let sfxEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playUiClick(freq = 620, type = 'sine', duration = 0.05) {
    if (!sfxEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (_) {}
  }

  function playUiOpen() {
    if (!sfxEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(860, audioCtx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (_) {}
  }

  /* ── 1. 초고속 스크롤 리빌 & 카운터 & 게이지 (발표 시 즉시 표시) ── */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('in');

      $$('.track i', el).forEach((bar) => {
        if (bar.dataset.w) bar.style.width = bar.dataset.w + '%';
      });
      if (el.matches('.bar, .prog')) {
        $$('.track i', el).forEach((bar) => {
          if (bar.dataset.w) bar.style.width = bar.dataset.w + '%';
        });
      }

      $$('[data-count]', el).forEach(countUp);
      if (el.dataset.count) countUp(el);

      if (el.dataset.ring) runRing(el);

      revealIO.unobserve(el);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -2% 0px' });

  $$('.rv, .rv-l, .rv-r, .rv-scale').forEach((el) => revealIO.observe(el));

  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const target = +el.dataset.count;
    const dur = 750; // 빠른 발표 템포에 맞춰 0.75초 완료
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const v = Math.round(target * (1 - Math.pow(1 - p, 3)));
      el.textContent = v.toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function runRing(el) {
    const pct = +el.dataset.ring;
    const fg = $('#ringFg');
    if (!fg) return;
    const C = 2 * Math.PI * 88;
    fg.style.strokeDasharray = C;
    fg.style.strokeDashoffset = C;
    requestAnimationFrame(() => {
      fg.style.strokeDashoffset = C * (1 - pct / 100);
    });
    const num = $('#ringNum');
    if (num) {
      num.dataset.count = pct;
      countUp(num);
    }
  }

  /* ── 2. 스크롤 진행 바 / 패럴랙스 ── */
  const bar = $('#scrollBar');
  const heroImg = $('#entranceImg');

  function onScroll() {
    const doc = document.documentElement;
    const scrollY = window.pageYOffset || doc.scrollTop || 0;
    const maxScroll = (doc.scrollHeight - doc.clientHeight) || 1;
    if (bar) bar.style.width = Math.min((scrollY / maxScroll) * 100, 100) + '%';

    if (heroImg && scrollY < window.innerHeight * 1.2) {
      heroImg.style.transform = `translateY(${scrollY * 0.2}px) scale(${1 + scrollY * 0.0001})`;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── 3. 슬라이드 인디케이터 & 전시관 내비 & 발표 대본 실시간 갱신 ── */
  const sections = $$('body > section');
  const navLinks = $$('#hallNav a');
  const curSlideNum = $('#curSlideNum');
  const totalSlideNum = $('#totalSlideNum');
  const pbSectionTag = $('#pbSectionTag');
  const pbTimeChip = $('#pbTimeChip');
  const pbSpeechText = $('#pbSpeechText');

  if (totalSlideNum) {
    totalSlideNum.textContent = String(sections.length).padStart(2, '0');
  }

  // 슬라이드 진입 시 내부 모든 요소 즉시 리빌 보장 (발표 중 빈 화면 대기 방지)
  function revealAllInSection(sec) {
    $$('.rv, .rv-l, .rv-r, .rv-scale', sec).forEach((el) => {
      el.classList.add('in');
      $$('.track i', el).forEach((b) => {
        if (b.dataset.w) b.style.width = b.dataset.w + '%';
      });
      if (el.matches('.bar, .prog')) {
        $$('.track i', el).forEach((b) => {
          if (b.dataset.w) b.style.width = b.dataset.w + '%';
        });
      }
      if (el.dataset.count) countUp(el);
      $$('[data-count]', el).forEach(countUp);
      if (el.dataset.ring) runRing(el);
    });
  }

  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      const idx = sections.indexOf(e.target);

      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));

      if (curSlideNum && idx !== -1) {
        curSlideNum.textContent = String(idx + 1).padStart(2, '0');
      }

      // 섹션 진입 즉시 내부 요소 리빌
      revealAllInSection(e.target);

      // 발표 가이드 멘트 및 권장 시간 자동 변경
      const secName = e.target.dataset.sectionName || id.toUpperCase();
      const secTime = e.target.dataset.time || '20s';
      const speech = e.target.dataset.speech || '';
      if (pbSectionTag) pbSectionTag.textContent = secName;
      if (pbTimeChip) pbTimeChip.textContent = secTime;
      if (pbSpeechText && speech) pbSpeechText.innerHTML = speech;
    });
  }, { rootMargin: '-38% 0px -48% 0px' });

  sections.forEach((s) => navIO.observe(s));

  /* ── 4. 3~5분 발표 타이머 (4분 = 240초 기준 페이스메이커) ── */
  const pitchTimerBox = $('#pitchTimerBox');
  const pitchTimerText = $('#pitchTimerText');
  let timerRunning = false;
  let timerSeconds = 0;
  let timerInterval = null;

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function updateTimerUI() {
    if (pitchTimerText) pitchTimerText.textContent = formatTime(timerSeconds);
    if (pitchTimerBox) {
      pitchTimerBox.classList.toggle('running', timerRunning && timerSeconds < 210);
      pitchTimerBox.classList.toggle('warn', timerSeconds >= 210); // 3분 30초 경과 시 엠버 알림
    }
  }

  function toggleTimer() {
    playUiClick(780, 'triangle');
    timerRunning = !timerRunning;
    if (timerRunning) {
      timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerUI();
      }, 1000);
    } else {
      clearInterval(timerInterval);
    }
    updateTimerUI();
  }

  function resetTimer() {
    playUiClick(420, 'sine');
    timerRunning = false;
    clearInterval(timerInterval);
    timerSeconds = 0;
    updateTimerUI();
  }

  if (pitchTimerBox) {
    pitchTimerBox.addEventListener('click', toggleTimer);
    pitchTimerBox.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      resetTimer();
    });
  }

  /* ── 5. 스피드 슬라이드 스냅 모드 (Deck Mode) & 발표 가이드 토글 ── */
  const deckModeToggle = $('#deckModeToggle');
  function toggleDeckMode(force) {
    playUiClick(680, 'sine');
    const isDeck = document.documentElement.classList.toggle('deck-mode', force);
    document.body.classList.toggle('deck-mode', isDeck);
    if (deckModeToggle) deckModeToggle.classList.toggle('active', isDeck);
  }
  if (deckModeToggle) deckModeToggle.addEventListener('click', () => toggleDeckMode());

  const presenterBar = $('#presenterBar');
  const presenterToggle = $('#presenterToggle');
  const pbCloseBtn = $('#pbCloseBtn');

  function togglePresenter(force) {
    playUiClick(750, 'triangle');
    const isActive = presenterBar.classList.toggle('active', force);
    if (presenterToggle) presenterToggle.classList.toggle('active', isActive);
  }

  if (presenterToggle) presenterToggle.addEventListener('click', () => togglePresenter());
  if (pbCloseBtn) pbCloseBtn.addEventListener('click', () => togglePresenter(false));

  /* ── 6. 상단 컨트롤: 이전/다음 화살표 & SFX & 전체화면 ── */
  function getCurrentSectionIndex() {
    const mid = window.innerHeight * 0.45;
    let idx = 0;
    sections.forEach((s, i) => {
      if (s.getBoundingClientRect().top <= mid) idx = i;
    });
    return idx;
  }

  function goToSlide(targetIdx) {
    const clamped = Math.min(Math.max(targetIdx, 0), sections.length - 1);
    playUiClick(540, 'sine');
    revealAllInSection(sections[clamped]);
    sections[clamped].scrollIntoView({ behavior: 'smooth' });
  }

  const prevSlideBtn = $('#prevSlideBtn');
  const nextSlideBtn = $('#nextSlideBtn');
  if (prevSlideBtn) prevSlideBtn.addEventListener('click', () => goToSlide(getCurrentSectionIndex() - 1));
  if (nextSlideBtn) nextSlideBtn.addEventListener('click', () => goToSlide(getCurrentSectionIndex() + 1));

  const sfxToggle = $('#sfxToggle');
  const sfxIcon = $('#sfxIcon');
  if (sfxToggle) {
    sfxToggle.addEventListener('click', () => {
      sfxEnabled = !sfxEnabled;
      if (sfxIcon) sfxIcon.textContent = sfxEnabled ? '🔊' : '🔇';
      sfxToggle.classList.toggle('active', sfxEnabled);
      if (sfxEnabled) playUiClick(880);
    });
  }

  const fsToggle = $('#fsToggle');
  function toggleFullScreen() {
    playUiClick(500);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      fsToggle?.classList.add('active');
    } else {
      document.exitFullscreen?.().catch(() => {});
      fsToggle?.classList.remove('active');
    }
  }
  if (fsToggle) fsToggle.addEventListener('click', toggleFullScreen);

  /* ── 7. 보스 12가지 패턴 상세 데이터 및 모달 ── */
  const PATTERNS_DB = {
    1: {
      phase: 'PHASE 1A (100% ~ 70%)',
      title: '01. Basic Slash (기본 횡베기)',
      dmg: '15 DMG',
      range: '0 ~ 4.5m',
      timing: '선딜 0.6s / 판정 0.2s / 후딜 0.5s',
      parry: '패링 가능 (Parryable)',
      parryable: true,
      desc: '우측으로 대검을 당기는 직관적인 전조 모션 후 전방 2.5m를 전진하며 우에서 좌로 호를 그리는 횡베기입니다. 플레이어가 보스의 기본 템포와 패링 타이밍을 익히기에 가장 이상적인 정석 패턴입니다.'
    },
    2: {
      phase: 'PHASE 1A (100% ~ 70%)',
      title: '02. Double Slash (좌우 2연속 베기)',
      dmg: '12 + 15 (총 27 DMG)',
      range: '0 ~ 4.5m',
      timing: '선딜 0.5s / 판정 0.2s × 2 / 후딜 0.6s',
      parry: '패링 가능 (Parryable)',
      parryable: true,
      desc: '좌측 베기 후 즉시 우측으로 반대 방향 횡베기를 연계하는 2단 참격입니다. 1타를 피했다고 안심하고 바로 딜을 넣으려다 2타에 카운터를 맞기 쉬우므로, 2연속 회피 또는 1타 패링을 노려야 합니다.'
    },
    3: {
      phase: 'PHASE 1A (100% ~ 70%)',
      title: '03. Triple Slash (3단 콤보 내려치기)',
      dmg: '12 + 12 + 20 (총 44 DMG)',
      range: '0 ~ 4.5m',
      timing: '선딜 0.6s / 판정 복합 / 후딜 0.8s',
      parry: '1·2타 가능, 막타 위험',
      parryable: true,
      desc: '빠른 횡베기 2회에 이어 양손으로 대검을 번쩍 들어 올려 바닥을 내려찍는 3연격입니다. 마지막 내려치기는 가드 스태미나 감쇄력이 매우 높아 굴러서 피한 후 확정 반격 딜타임을 잡는 것이 정석입니다.'
    },
    4: {
      phase: 'PHASE 1B (70% ~ 50%) 해금',
      title: '04. Thrust (백스텝 롤 캐치 찌르기)',
      dmg: '20 DMG',
      range: '2.0 ~ 6.0m (원거리 급습)',
      timing: '선딜 0.5s / 판정 0.25s / 후딜 0.7s',
      parry: '패링 가능 (Parryable)',
      parryable: true,
      desc: '플레이어와의 거리를 벌리듯 1.2m 백스텝을 밟은 직후, 3.5m를 폭발적으로 돌진하며 대검을 전방으로 깊숙이 찌릅니다. 플레이어가 섣불리 앞으로 구를 때 무적 프레임이 끝나는 시점을 정확히 저격하는 정밀 롤 캐치(Roll Catch) 패턴입니다.'
    },
    5: {
      phase: 'PHASE 1B (70% ~ 50%) 해금',
      title: '05. Dash Slash (6m 초고속 슬라이딩 베기)',
      dmg: '25 DMG',
      range: '3.5 ~ 10.0m (장거리 갭클로저)',
      timing: '선딜 0.6s / 판정 0.3s / 후딜 0.8s',
      parry: '패링 가능 (Parryable)',
      parryable: true,
      desc: '대검을 하단으로 낮게 깔고 지면을 박차며 6m를 미끄러지듯 쇄도하여 베어 올리는 패턴입니다. 플레이어가 거리를 벌려 정비하려고 할 때 빈틈을 놓치지 않고 급습합니다.'
    },
    6: {
      phase: 'PHASE 1A (100% ~ 70%)',
      title: '06. Heavy Overhead (지면 강타 파쇄)',
      dmg: '35 DMG (초고위력)',
      range: '0 ~ 4.5m',
      timing: '선딜 1.0s / 판정 0.3s / 후딜 1.2s (무방비)',
      parry: '패링 불가 (Unparryable)',
      parryable: false,
      desc: '대검을 머리 위로 높이 치켜들고 전신 체중을 실어 바닥을 내려치는 강타입니다. 패링이 불가능하며 지면에 2차 충격파가 발생합니다. 대신 시전 후 대검이 지면에 박혀 1.2초간 완벽한 프리딜 타임이 주어집니다.'
    },
    7: {
      phase: 'PHASE 1B (70% ~ 50%) 해금',
      title: '07. Spin Slash (360도 전신 휠윈드)',
      dmg: '20 DMG',
      range: '0 ~ 4.0m (전방위)',
      timing: '선딜 0.6s / 판정 0.35s / 후딜 0.8s',
      parry: '패링 가능 (Parryable)',
      parryable: true,
      desc: '순간적으로 몸을 둥글게 웅크렸다가 360도 전신을 회전하며 대검을 휘두릅니다. 보스의 뒤를 잡아 후방 딜을 넣으려는 플레이어를 완벽히 견제하는 전방위 참격 패턴입니다.'
    },
    8: {
      phase: 'PHASE 1B (70% ~ 50%) 해금',
      title: '08. Delayed Slash (엇박자 구르기 낚기)',
      dmg: '22 DMG',
      range: '0 ~ 4.5m',
      timing: '선딜 1.0s (0.7초 정지) / 판정 0.2s / 후딜 0.6s',
      parry: '패링 가능 (타이밍 주의)',
      parryable: true,
      desc: '소울라이크의 상징적인 "박자 꼬기" 패턴입니다. 팔을 번쩍 든 채 무려 0.7초 동안 모션을 멈추며 정지했다가 갑작스럽게 내리칩니다. 지레짐작으로 조기 구르기를 누른 플레이어의 후딜레이를 정확히 타격합니다.'
    },
    9: {
      phase: 'PHASE 1B (70% ~ 50%) 해금',
      title: '09. Counter (십자 가드 & 즉각 리포스트)',
      dmg: '25 DMG',
      range: '0 ~ 3.5m',
      timing: '선딜 0.2s / 가드 유지 1.5s / 즉시 반격',
      parry: '패링 불가 (가드 상태)',
      parryable: false,
      desc: '대검을 세워 십자 방어 자세를 취합니다. 이 1.5초 동안 플레이어가 보스를 타격하면 타격이 튕겨 나가며, 보스가 즉시 3.5m를 전진하며 플레이어의 빈틈을 꿰뚫는 강력한 리포스트 카운터를 날립니다.'
    },
    10: {
      phase: 'PHASE 1B (70% ~ 50%) 해금',
      title: '10. Four Combo (4연격 폭풍 연계)',
      dmg: '총 62 DMG (치명적)',
      range: '0 ~ 4.5m',
      timing: '선딜 0.5s / 4단 복합 연계 / 후딜 1.3s (대경직)',
      parry: '1~3타 가능, 막타 불가',
      parryable: true,
      desc: '좌베기 → 우베기 → 찌르기 → 지면 강타로 이어지는 무자비한 4연속 콤보입니다. 풀 히트 시 체력이 크게 깎이지만, 4타를 모두 흘려내면 보스가 1.3초간 긴 숨을 고르는 확정 프리딜 기회가 주어집니다.'
    },
    11: {
      phase: 'PHASE 2 ENRAGE (50% ~ 30%) 해금',
      title: '11. Rage Combo (광폭화 6연타 난무)',
      dmg: '총 77 DMG (원콤 주의)',
      range: '0 ~ 10.0m (맵 전역 추적)',
      timing: '선딜 0.7s / 6연타 고속 콤보 / 후딜 1.5s',
      parry: '초반부만 가능, 후반 불가',
      parryable: false,
      desc: '체력 50% 각성 시 해금되는 광폭화 전용 난무 패턴입니다. 돌진으로 거리를 좁힌 후 좌베기, 우베기, 찌르기, 360도 회전, 대지 강타 충격파를 쉴 새 없이 몰아쳐 플레이어의 스태미나를 한계까지 시험합니다.'
    },
    12: {
      phase: 'FINAL PHASE (30% ~ 0%) 필살기',
      title: '12. Ultimate Ashen Ruin (잿빛 대파쇄)',
      dmg: '50 DMG + 광역 넉백',
      range: '0 ~ 12.0m (아레나 초토화)',
      timing: '선딜 1.5s (공중 부양) / 판정 0.35s / 후딜 1.5s',
      parry: '패링 절대 불가',
      parryable: false,
      desc: '체력 30% 이하 최종 결전 시 발동하는 보스의 궁극기입니다. 공중 2.2m로 부양하여 암흑 잿빛 심연 에너지를 대검에 응집한 뒤, 지면으로 급강하하며 아레나 전체를 뒤흔드는 충격파를 방출합니다.'
    }
  };

  const patternModal = $('#patternModal');
  const patternModalClose = $('#patternModalClose');
  const pmPhase = $('#pmPhase');
  const pmTitle = $('#pmTitle');
  const pmDmg = $('#pmDmg');
  const pmRange = $('#pmRange');
  const pmTiming = $('#pmTiming');
  const pmParry = $('#pmParry');
  const pmDesc = $('#pmDesc');

  function openPatternModal(id) {
    const data = PATTERNS_DB[id];
    if (!data) return;
    playUiOpen();
    if (pmPhase) pmPhase.textContent = data.phase;
    if (pmTitle) pmTitle.textContent = data.title;
    if (pmDmg) pmDmg.textContent = data.dmg;
    if (pmRange) pmRange.textContent = data.range;
    if (pmTiming) pmTiming.textContent = data.timing;
    if (pmParry) {
      pmParry.textContent = data.parry;
      pmParry.className = 'parry-tag' + (data.parryable ? '' : ' no');
    }
    if (pmDesc) pmDesc.textContent = data.desc;
    if (patternModal) patternModal.classList.add('open');
  }

  $$('.pt[data-pid]').forEach((card) => {
    card.addEventListener('click', () => {
      openPatternModal(card.dataset.pid);
    });
  });

  if (patternModalClose) {
    patternModalClose.addEventListener('click', () => {
      playUiClick(400);
      patternModal.classList.remove('open');
    });
  }

  /* ── 8. 제작 완성 리포트 모달 ── */
  const todayModal = $('#todayModal');
  const todayModalClose = $('#todayModalClose');
  const todayBadgeBtn = $('#todayBadgeBtn');
  const openTodaySummary = $('#openTodaySummary');

  function openToday() {
    playUiOpen();
    if (todayModal) todayModal.classList.add('open');
  }
  function closeToday() {
    playUiClick(400);
    if (todayModal) todayModal.classList.remove('open');
  }

  if (todayBadgeBtn) todayBadgeBtn.addEventListener('click', openToday);
  if (openTodaySummary) openTodaySummary.addEventListener('click', openToday);
  if (todayModalClose) todayModalClose.addEventListener('click', closeToday);

  [patternModal, todayModal].forEach((m) => {
    if (m) {
      m.addEventListener('click', (e) => {
        if (e.target === m) {
          playUiClick(400);
          m.classList.remove('open');
        }
      });
    }
  });

  /* ── 9. 키보드 인터랙션: Space / 좌·우 / 숫자키 / P(대본) / T(타이머) / M(모드) ── */
  window.addEventListener('keydown', (e) => {
    if (e.target.closest('video, input, textarea')) return;

    // ESC: 모달 닫기
    if (e.key === 'Escape') {
      if (patternModal?.classList.contains('open')) {
        patternModal.classList.remove('open');
        return;
      }
      if (todayModal?.classList.contains('open')) {
        todayModal.classList.remove('open');
        return;
      }
      if (presenterBar?.classList.contains('active')) {
        togglePresenter(false);
        return;
      }
    }

    // P: 발표자 대본 가이드 토글
    if (['p', 'P', 'ㅔ', 'ㅖ'].includes(e.key)) {
      e.preventDefault();
      togglePresenter();
      return;
    }

    // T: 발표 4분 타이머 시작/일시정지
    if (['t', 'T', 'ㅅ', 'ㅆ'].includes(e.key)) {
      e.preventDefault();
      toggleTimer();
      return;
    }

    // M: 스피드 슬라이드 스냅 모드 토글
    if (['m', 'M', 'ㅡ'].includes(e.key)) {
      e.preventDefault();
      toggleDeckMode();
      return;
    }

    // F: 전체화면 토글
    if (['f', 'F', 'ㄹ'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      toggleFullScreen();
      return;
    }

    // 좌/우, Space, PageUp/PageDown: 슬라이드 즉시 전환
    let dir = 0;
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) dir = e.shiftKey && e.key === ' ' ? -1 : 1;
    if (['ArrowLeft', 'PageUp'].includes(e.key)) dir = -1;
    if (dir !== 0) {
      e.preventDefault();
      // 첫 슬라이드에서 다음으로 넘어갈 때 타이머가 아직 안 돌고 있으면 자동 시작
      if (dir === 1 && getCurrentSectionIndex() === 0 && !timerRunning && timerSeconds === 0) {
        toggleTimer();
      }
      goToSlide(getCurrentSectionIndex() + dir);
    }
  });

  /* ── 10. 소울라이크 잿가루/불씨 실시간 캔버스 시뮬레이션 ── */
  const cv = $('#emberCanvas');
  if (cv) {
    const ctx = cv.getContext('2d');
    let W, H;
    let embers = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.width = window.innerWidth * dpr;
      H = cv.height = window.innerHeight * dpr;
    }

    function spawn(initial = false) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      return {
        x: Math.random() * W,
        y: initial ? Math.random() * H : H + 10,
        r: (Math.random() * 1.5 + 0.4) * dpr,
        vy: (Math.random() * 0.35 + 0.14) * dpr,
        vx: (Math.random() - 0.5) * 0.16 * dpr,
        alpha: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
      };
    }

    resize();
    window.addEventListener('resize', resize);

    const COUNT = window.innerWidth < 900 ? 20 : 38;
    for (let i = 0; i < COUNT; i++) embers.push(spawn(true));

    (function loop(time) {
      ctx.clearRect(0, 0, W, H);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      embers.forEach((p, i) => {
        p.y -= p.vy;
        p.x += p.vx + Math.sin(time / 1500 + p.phase) * 0.2 * dpr;

        if (p.y < -15) embers[i] = spawn(false);

        const flicker = 0.75 + Math.sin(time / 450 + p.phase) * 0.25;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(228, 195, 145, ${p.alpha * flicker})`;
        ctx.shadowBlur = 8 * dpr;
        ctx.shadowColor = 'rgba(215, 135, 60, 0.75)';
        ctx.fill();
      });

      requestAnimationFrame(loop);
    })(0);
  }

  /* ── 11. 3D 모델링 & PBR 에셋 실시간 뷰어 (Three.js + FBXLoader) ── */
  (function init3DModelStudio() {
    const mount = $('#threeViewport');
    if (!mount || typeof THREE === 'undefined') return;

    const mvLoading = $('#mvLoading');
    const mvLoadingText = $('#mvLoadingText');
    const mvModelTitle = $('#mvModelTitle');
    const mvFileBadge = $('#mvFileBadge');
    const mvVertCount = $('#mvVertCount');
    const mvTriCount = $('#mvTriCount');
    const mvRigSpec = $('#mvRigSpec');
    const msbHeading = $('#msbHeading');
    const msbSub = $('#msbSub');
    const msbDesc = $('#msbDesc');

    const pbrImgAlbedo = $('#pbrImgAlbedo');
    const pbrImgNormal = $('#pbrImgNormal');
    const pbrImgMetallic = $('#pbrImgMetallic');
    const pbrImgRoughness = $('#pbrImgRoughness');

    const btnAutoRotate = $('#btnAutoRotate');
    const btnWireframe = $('#btnWireframe');
    const btnClayMode = $('#btnClayMode');
    const btnResetCam = $('#btnResetCam');
    const mvLightRange = $('#mvLightRange');

    const MODEL_CATALOG = {
      knight: {
        title: 'THE WANDERER (방랑 기사)',
        file: 'Meshy_Knight_Mixamo.fbx',
        rig: 'Humanoid 65 Bones',
        heading: '01 · THE WANDERER (플레이어 기사 아바타)',
        sub: 'HDRP/Lit 4-Channel PBR · Mixamo Rig',
        desc: 'Mixamo 휴머노이드 65본 스켈레톤과 호환되는 다크 판타지 판금 갑옷 기사 모델입니다. 오른손 무기 소켓(Socket_Weapon_R) 정밀 보정 및 8방향 이동 블렌드트리·5단 콤보 애니메이션이 바인딩되어 있습니다.',
        fbxKey: 'knight',
        texPrefix: 'knight',
        targetSize: 2.75,
        camPos: [0, 1.45, 3.6],
        camTarget: [0, 1.15, 0],
        metalness: 0.72,
        roughness: 0.38,
        maps: {
          albedo: 'assets/models/knight_albedo.png',
          normal: 'assets/models/knight_normal.png',
          metallic: 'assets/models/knight_metallic.png',
          roughness: 'assets/models/knight_roughness.png'
        }
      },
      longsword: {
        title: "KNIGHT'S LONGSWORD (한손 장검)",
        file: 'SM_Wep_Sword_03.fbx',
        rig: 'Socket_Weapon_R (15°,0°,-15°)',
        heading: "02 · KNIGHT'S LONGSWORD (주무기 한손 장검)",
        sub: 'Metallic Blade Shader · Right-Hand Socket',
        desc: '플레이어가 상시 발도 하이가드(One Hand Up) 스탠스로 파지하는 주력 한손 장검입니다. 손바닥 중심과 검자루가 오차 없이 맞물리도록 회전(15°, 0°, -15°)과 그립 피벗(-0.08m)을 정밀 캘리브레이션했습니다.',
        fbxKey: 'longsword',
        texPrefix: null,
        targetSize: 2.85,
        camPos: [0, 1.2, 3.3],
        camTarget: [0, 1.1, 0],
        metalness: 0.88,
        roughness: 0.22,
        rotOffset: [0, 0, Math.PI * 0.18],
        maps: {
          albedo: 'assets/models/greatsword_albedo.png',
          normal: 'assets/models/greatsword_normal.png',
          metallic: 'assets/models/greatsword_metallic.png',
          roughness: 'assets/models/greatsword_roughness.png'
        }
      },
      greatsword: {
        title: 'ASHEN GREATSWORD (잿빛 대검)',
        file: 'Meshy_AI_Greatsword.fbx',
        rig: 'Heavy Weapon Mesh · 4K PBR',
        heading: '03 · ASHEN GREATSWORD (잿빛 대검 모델)',
        sub: 'Custom Sculpted FBX · 4K PBR Maps',
        desc: '다크 판타지 세계관의 중량감 있는 대검 3D 모델입니다. 검신의 미세한 마모 자국과 고딕 코등이 장식을 노멀맵(Normal Map)과 메탈릭/러프니스 채널로 정교하게 베이킹했습니다.',
        fbxKey: 'greatsword',
        texPrefix: 'greatsword',
        targetSize: 2.85,
        camPos: [0, 1.25, 3.4],
        camTarget: [0, 1.15, 0],
        metalness: 0.78,
        roughness: 0.34,
        maps: {
          albedo: 'assets/models/greatsword_albedo.png',
          normal: 'assets/models/greatsword_normal.png',
          metallic: 'assets/models/greatsword_metallic.png',
          roughness: 'assets/models/greatsword_roughness.png'
        }
      },
      statue: {
        title: 'GUARDIAN STATUE (고딕 수호 대석상)',
        file: 'SM_Big_Statue.fbx',
        rig: 'Citadel Landmark · 7m Scale',
        heading: '04 · GUARDIAN STATUE (성채 수호 대석상)',
        sub: 'Gothic Architecture Prop · Weathered Stone',
        desc: '고딕 성채의 45m 진입 회랑 좌우(4기)와 27m 대성문 전면(2기)에 배치되어 압도적인 위압감을 형성하는 7m급 수호 기사 조각상 메쉬입니다.',
        fbxKey: 'statue',
        texPrefix: 'wall',
        targetSize: 2.8,
        camPos: [0, 1.4, 3.6],
        camTarget: [0, 1.15, 0],
        metalness: 0.18,
        roughness: 0.78,
        maps: {
          albedo: 'assets/models/wall_albedo.png',
          normal: 'assets/models/wall_normal.png',
          metallic: 'assets/models/wall-render.png',
          roughness: 'assets/models/wall_roughness.png'
        }
      },
      stone_floor: {
        title: 'MODULAR STONE FLOOR (석재 바닥)',
        file: 'stone floor.fbx',
        rig: 'Seamless 5m×5m Tile · PBR',
        heading: '05 · MODULAR STONE FLOOR (성채 석재 바닥)',
        sub: 'Courtyard Arena Tile · Normal/Roughness Baked',
        desc: '결투 광장(45m×35m)과 진입 회랑 바닥을 구성하는 모듈러 석재 타일 FBX 메쉬입니다. 젖은 암석 표면의 질감과 틈새 음영이 노멀·러프니스 맵으로 구현되어 있습니다.',
        fbxKey: 'stone_floor',
        texPrefix: 'floor',
        targetSize: 2.6,
        camPos: [0, 1.85, 3.3],
        camTarget: [0, 0.85, 0],
        metalness: 0.15,
        roughness: 0.82,
        maps: {
          albedo: 'assets/models/floor_albedo.png',
          normal: 'assets/models/floor_normal.png',
          metallic: 'assets/models/floor-render.png',
          roughness: 'assets/models/floor_roughness.png'
        }
      },
      stone_wall: {
        title: 'MODULAR STONE WALL (성채 암석 성벽)',
        file: 'Stone wall_texture.fbx',
        rig: 'Modular Citadel Wall · PBR',
        heading: '06 · MODULAR STONE WALL (모듈러 암석 성벽)',
        sub: 'High-Relief Stone Masonry · 4K Normal Map',
        desc: '고딕 성채의 외곽 성벽을 이루는 암석 블록 모델입니다. 고해상도 스컬프팅에서 추출한 노멀맵과 러프니스맵을 통해 야간 횃불 조명(1800lm) 아래서 입체적인 암석 음영을 드리웁니다.',
        fbxKey: 'procedural_wall',
        texPrefix: 'wall',
        targetSize: 2.65,
        camPos: [0, 1.35, 3.5],
        camTarget: [0, 1.05, 0],
        metalness: 0.15,
        roughness: 0.84,
        maps: {
          albedo: 'assets/models/wall_albedo.png',
          normal: 'assets/models/wall_normal.png',
          metallic: 'assets/models/wall-render.png',
          roughness: 'assets/models/wall_roughness.png'
        }
      }
    };

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0e14, 0.065);

    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 1.45, 3.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.1;
    controls.maxDistance = 8.0;
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.target.set(0, 1.15, 0);

    // lights (3-point Dark Fantasy Rim + Warm Torch Key + Cool Moon Fill)
    const hemiLight = new THREE.HemisphereLight(0xc8d8f0, 0x1a1510, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffdfba, 2.3);
    keyLight.position.set(3.2, 4.8, 3.2);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7aa2d4, 1.45);
    rimLight.position.set(-3.5, 3.2, -3.0);
    scene.add(rimLight);

    const torchPoint = new THREE.PointLight(0xe49b48, 1.25, 9);
    torchPoint.position.set(-2.0, 1.6, 2.2);
    scene.add(torchPoint);

    // Turntable Pedestal (Golden Gothic Ring Platform)
    const pedestalGroup = new THREE.Group();
    const baseGeo = new THREE.CylinderGeometry(1.38, 1.48, 0.08, 64);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x141822,
      metalness: 0.6,
      roughness: 0.4
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.04;
    baseMesh.receiveShadow = true;
    pedestalGroup.add(baseMesh);

    const ringGeo = new THREE.RingGeometry(1.26, 1.33, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xb89065, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.003;
    pedestalGroup.add(ringMesh);

    const innerRingGeo = new THREE.RingGeometry(0.92, 0.94, 64);
    innerRingGeo.rotateX(-Math.PI / 2);
    const innerRingMat = new THREE.MeshBasicMaterial({ color: 0x785d42, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
    const innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRingMesh.position.y = 0.003;
    pedestalGroup.add(innerRingMesh);

    scene.add(pedestalGroup);

    // State & caches
    const texLoader = new THREE.TextureLoader();
    const texCache = {};
    const modelCache = {};
    let currentRoot = null;
    let autoRotate = true;
    let wireframeMode = false;
    let clayMode = false;
    let activeChannel = 'pbr'; // 'pbr' | 'albedo' | 'normal' | 'metallic' | 'roughness'
    let activeModelKey = 'knight';

    function getBundledTexture(name, isSRGB = false) {
      if (!name) return null;
      if (texCache[name]) return texCache[name];
      const bundle = window.ASHEN_3D_BUNDLE;
      const src = (bundle && bundle.textures && bundle.textures[name]) ? bundle.textures[name] : `assets/models/${name}.png`;
      const tex = texLoader.load(src);
      if (isSRGB) tex.encoding = THREE.sRGBEncoding;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      texCache[name] = tex;
      return tex;
    }

    function base64GzipToArrayBuffer(b64) {
      const bin = atob(b64);
      const compressed = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) compressed[i] = bin.charCodeAt(i);
      const decompressed = window.fflate.gunzipSync(compressed);
      return decompressed.buffer.slice(decompressed.byteOffset, decompressed.byteOffset + decompressed.byteLength);
    }

    function buildProceduralStoneWallMesh() {
      const group = new THREE.Group();
      // Main sculpted masonry wall block + battlements + columns
      const mainWall = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.85, 0.48, 24, 18, 6));
      mainWall.position.y = 0.925;
      group.add(mainWall);

      const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.68, 0.26, 0.62, 12, 4, 4));
      plinth.position.y = 0.13;
      group.add(plinth);

      const cornice = new THREE.Mesh(new THREE.BoxGeometry(2.66, 0.18, 0.58, 12, 4, 4));
      cornice.position.y = 1.92;
      group.add(cornice);

      // Left & Right Gothic Buttress Pillars
      [-1.12, 1.12].forEach((x) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 2.15, 0.66, 8, 16, 8));
        pillar.position.set(x, 1.075, 0);
        group.add(pillar);
      });

      // 4 Crenellations (Battlements)
      [-0.75, -0.25, 0.25, 0.75].forEach((x) => {
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.52, 6, 6, 6));
        merlon.position.set(x, 2.16, 0);
        group.add(merlon);
      });

      // Subtle organic rock surface displacement on vertices
      group.traverse((child) => {
        if (child.isMesh) {
          const pos = child.geometry.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
            const n = (Math.sin(vx * 7.5 + vy * 5.2) * Math.cos(vz * 8.1 + vx * 4.3)) * 0.018;
            pos.setXYZ(i, vx + n, vy + n * 0.5, vz + n);
          }
          child.geometry.computeVertexNormals();
        }
      });
      return group;
    }

    function applyMaterialSettings(root, cfg) {
      if (!root) return;
      const prefix = cfg.texPrefix;
      const albedoMap = prefix ? getBundledTexture(`${prefix}_albedo`, true) : null;
      const normalMap = prefix ? getBundledTexture(`${prefix}_normal`, false) : null;
      const metallicMap = (prefix && window.ASHEN_3D_BUNDLE?.textures?.[`${prefix}_metallic`])
        ? getBundledTexture(`${prefix}_metallic`, false)
        : null;
      const roughnessMap = prefix ? getBundledTexture(`${prefix}_roughness`, false) : null;

      root.traverse((child) => {
        if (!child.isMesh) return;

        if (clayMode) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0xc2b29b,
            roughness: 0.62,
            metalness: 0.08,
            normalMap: normalMap || null,
            wireframe: wireframeMode
          });
          return;
        }

        if (activeChannel !== 'pbr' && prefix) {
          const previewTex =
            activeChannel === 'albedo' ? albedoMap :
            activeChannel === 'normal' ? normalMap :
            activeChannel === 'metallic' ? (metallicMap || roughnessMap) :
            roughnessMap;
          child.material = new THREE.MeshBasicMaterial({
            map: previewTex || albedoMap,
            wireframe: wireframeMode
          });
          return;
        }

        // Standard Full PBR Material
        if (cfg.fbxKey === 'longsword') {
          // Polished Steel Blade & Gold Guard look for SM_Wep_Sword_03
          child.material = new THREE.MeshStandardMaterial({
            color: 0xd8dee9,
            metalness: 0.88,
            roughness: 0.22,
            normalMap: getBundledTexture('greatsword_normal', false),
            normalScale: new THREE.Vector2(0.4, 0.4),
            wireframe: wireframeMode
          });
        } else {
          child.material = new THREE.MeshStandardMaterial({
            color: albedoMap ? 0xffffff : 0xc8c0b4,
            map: albedoMap,
            normalMap: normalMap,
            normalScale: new THREE.Vector2(1.0, 1.0),
            metalnessMap: metallicMap,
            roughnessMap: roughnessMap,
            metalness: cfg.metalness ?? 0.5,
            roughness: cfg.roughness ?? 0.55,
            wireframe: wireframeMode
          });
        }
        child.castShadow = true;
        child.receiveShadow = true;
      });
    }

    function loadAndDisplayModel(modelKey) {
      const cfg = MODEL_CATALOG[modelKey];
      if (!cfg) return;
      activeModelKey = modelKey;
      activeChannel = 'pbr';
      $$('.pbr-map-card').forEach((c) => c.classList.remove('active'));

      // Update UI labels & PBR thumbnails
      if (mvModelTitle) mvModelTitle.textContent = cfg.title;
      if (mvFileBadge) mvFileBadge.textContent = cfg.file;
      if (mvRigSpec) mvRigSpec.textContent = cfg.rig;
      if (msbHeading) msbHeading.textContent = cfg.heading;
      if (msbSub) msbSub.textContent = cfg.sub;
      if (msbDesc) msbDesc.textContent = cfg.desc;

      if (pbrImgAlbedo) pbrImgAlbedo.src = cfg.maps.albedo;
      if (pbrImgNormal) pbrImgNormal.src = cfg.maps.normal;
      if (pbrImgMetallic) pbrImgMetallic.src = cfg.maps.metallic;
      if (pbrImgRoughness) pbrImgRoughness.src = cfg.maps.roughness;

      if (mvLoading) mvLoading.classList.remove('hidden');
      if (mvLoadingText) mvLoadingText.textContent = `${cfg.file} 3D 메쉬 로딩 중...`;

      setTimeout(() => {
        try {
          if (currentRoot) {
            scene.remove(currentRoot);
            currentRoot = null;
          }

          let wrapper = modelCache[modelKey];
          if (!wrapper) {
            let parsedObj;
            if (cfg.fbxKey === 'procedural_wall') {
              parsedObj = buildProceduralStoneWallMesh();
            } else {
              const b64 = window.ASHEN_3D_BUNDLE?.fbxGzip?.[cfg.fbxKey];
              const arrayBuffer = base64GzipToArrayBuffer(b64);
              const loader = new THREE.FBXLoader();
              parsedObj = loader.parse(arrayBuffer, '');
            }

            if (cfg.rotOffset) {
              parsedObj.rotation.set(cfg.rotOffset[0], cfg.rotOffset[1], cfg.rotOffset[2]);
              parsedObj.updateMatrixWorld(true);
            }

            // Normalize scale & center on pedestal (y = 0)
            const box = new THREE.Box3().setFromObject(parsedObj);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);

            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const scale = (cfg.targetSize || 2.6) / maxDim;

            wrapper = new THREE.Group();
            parsedObj.scale.multiplyScalar(scale);
            parsedObj.updateMatrixWorld(true);

            const scaledBox = new THREE.Box3().setFromObject(parsedObj);
            const scaledCenter = new THREE.Vector3();
            scaledBox.getCenter(scaledCenter);

            parsedObj.position.x -= scaledCenter.x;
            parsedObj.position.z -= scaledCenter.z;
            parsedObj.position.y -= scaledBox.min.y;

            // Count vertices & triangles
            let verts = 0, tris = 0;
            parsedObj.traverse((ch) => {
              if (ch.isMesh && ch.geometry) {
                const posAttr = ch.geometry.attributes.position;
                if (posAttr) {
                  verts += posAttr.count;
                  tris += ch.geometry.index ? Math.round(ch.geometry.index.count / 3) : Math.round(posAttr.count / 3);
                }
              }
            });

            wrapper.add(parsedObj);
            wrapper.userData = { verts, tris };
            modelCache[modelKey] = wrapper;
          }

          currentRoot = wrapper;
          applyMaterialSettings(currentRoot, cfg);
          scene.add(currentRoot);

          if (mvVertCount) mvVertCount.textContent = (currentRoot.userData.verts || 0).toLocaleString();
          if (mvTriCount) mvTriCount.textContent = (currentRoot.userData.tris || 0).toLocaleString();

          // Smooth camera framing
          camera.position.set(...cfg.camPos);
          controls.target.set(...cfg.camTarget);
          controls.update();
        } catch (err) {
          console.error('[3D Viewer Error]', err);
        } finally {
          if (mvLoading) mvLoading.classList.add('hidden');
        }
      }, 30);
    }

    // Tab clicks
    $$('.model-tab[data-model]').forEach((btn) => {
      btn.addEventListener('click', () => {
        playUiClick(580);
        $$('.model-tab').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        loadAndDisplayModel(btn.dataset.model);
      });
    });

    // PBR Map channel click -> preview texture directly on 3D mesh
    $$('.pbr-map-card[data-map]').forEach((card) => {
      card.addEventListener('click', () => {
        playUiClick(640);
        const ch = card.dataset.map;
        if (activeChannel === ch) {
          activeChannel = 'pbr';
          $$('.pbr-map-card').forEach((c) => c.classList.remove('active'));
        } else {
          activeChannel = ch;
          $$('.pbr-map-card').forEach((c) => c.classList.toggle('active', c === card));
        }
        applyMaterialSettings(currentRoot, MODEL_CATALOG[activeModelKey]);
      });
    });

    // Toolbar buttons
    if (btnAutoRotate) {
      btnAutoRotate.addEventListener('click', () => {
        playUiClick(520);
        autoRotate = !autoRotate;
        btnAutoRotate.classList.toggle('active', autoRotate);
      });
    }
    if (btnWireframe) {
      btnWireframe.addEventListener('click', () => {
        playUiClick(520);
        wireframeMode = !wireframeMode;
        btnWireframe.classList.toggle('active', wireframeMode);
        applyMaterialSettings(currentRoot, MODEL_CATALOG[activeModelKey]);
      });
    }
    if (btnClayMode) {
      btnClayMode.addEventListener('click', () => {
        playUiClick(520);
        clayMode = !clayMode;
        btnClayMode.classList.toggle('active', clayMode);
        applyMaterialSettings(currentRoot, MODEL_CATALOG[activeModelKey]);
      });
    }
    if (btnResetCam) {
      btnResetCam.addEventListener('click', () => {
        playUiClick(480);
        const cfg = MODEL_CATALOG[activeModelKey];
        if (cfg) {
          camera.position.set(...cfg.camPos);
          controls.target.set(...cfg.camTarget);
          controls.update();
        }
        if (currentRoot) currentRoot.rotation.y = 0;
      });
    }
    if (mvLightRange) {
      mvLightRange.addEventListener('input', (e) => {
        const rad = (+e.target.value * Math.PI) / 180;
        keyLight.position.set(Math.cos(rad) * 4.5, 4.8, Math.sin(rad) * 4.5);
      });
    }

    // Resize handling
    window.addEventListener('resize', () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    });

    // Initial load: The Wanderer (Knight FBX)
    loadAndDisplayModel('knight');

    // Render loop
    (function animate3D() {
      requestAnimationFrame(animate3D);
      if (autoRotate && currentRoot) {
        currentRoot.rotation.y += 0.0065;
        pedestalGroup.rotation.y += 0.0065;
      }
      controls.update();
      renderer.render(scene, camera);
    })();
  })();

  /* ── 12. PDF 인쇄 / 헤드리스 모드 사전 렌더링 ── */
  function prepareForPrint() {
    $$('.rv, .rv-l, .rv-r, .rv-scale').forEach((el) => {
      el.classList.add('in');
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.filter = 'none';
    });

    $$('.track i').forEach((bar) => {
      if (bar.dataset.w) bar.style.width = bar.dataset.w + '%';
    });

    $$('[data-count]').forEach((el) => {
      el.dataset.done = '1';
      el.textContent = (+el.dataset.count).toLocaleString();
    });

    const ringEl = $('.ring[data-ring]');
    if (ringEl) {
      const pct = +ringEl.dataset.ring;
      const fg = $('#ringFg');
      if (fg) {
        const C = 2 * Math.PI * 88;
        fg.style.strokeDasharray = `${C}`;
        fg.style.strokeDashoffset = `${C * (1 - pct / 100)}`;
      }
      const num = $('#ringNum');
      if (num) num.textContent = pct;
    }
  }

  window.addEventListener('beforeprint', prepareForPrint);
  if (window.location.search.includes('print') || navigator.userAgent.includes('Headless')) {
    prepareForPrint();
  }
})();
