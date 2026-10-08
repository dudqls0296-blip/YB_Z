/* ═══════════════════════════════════════════════
   ASHEN THRONE — Development Exhibition & Showcase
   스크롤 리빌 · 발표 모드 · 보스 패턴 도감 · SFX · 불씨 시뮬레이션
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

  function playUiClick(freq = 600, type = 'sine', duration = 0.06) {
    if (!sfxEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
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
      osc.frequency.setValueAtTime(280, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(840, audioCtx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (_) {}
  }

  /* ── 1. 스크롤 리빌 & 카운터 & 게이지 ── */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('in');

      // 내부 트랙 게이지 채우기
      $$('.track i', el).forEach((bar) => {
        if (bar.dataset.w) bar.style.width = bar.dataset.w + '%';
      });
      if (el.matches('.bar, .prog')) {
        $$('.track i', el).forEach((bar) => {
          if (bar.dataset.w) bar.style.width = bar.dataset.w + '%';
        });
      }

      // 숫자 카운트업
      $$('[data-count]', el).forEach(countUp);
      if (el.dataset.count) countUp(el);

      // 원형 링 애니메이션
      if (el.dataset.ring) runRing(el);

      revealIO.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

  $$('.rv, .rv-l, .rv-r, .rv-scale').forEach((el) => revealIO.observe(el));

  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const target = +el.dataset.count;
    const dur = 1600;
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

  /* ── 2. 스크롤 진행 바 / 패럴랙스 / 타임라인 ── */
  const bar = $('#scrollBar');
  const tl = $('#tl');
  const tlFill = $('#tlFill');
  const heroImg = $('#entranceImg');
  const keyHelp = $('#keyHelp');

  function onScroll() {
    const doc = document.documentElement;
    const scrollY = window.pageYOffset || doc.scrollTop || 0;
    const maxScroll = (doc.scrollHeight - doc.clientHeight) || 1;
    if (bar) bar.style.width = Math.min((scrollY / maxScroll) * 100, 100) + '%';

    if (heroImg && scrollY < window.innerHeight * 1.2) {
      heroImg.style.transform = `translateY(${scrollY * 0.28}px) scale(${1 + scrollY * 0.00015})`;
    }

    if (tl && tlFill) {
      const r = tl.getBoundingClientRect();
      const p = Math.min(Math.max((window.innerHeight * 0.6 - r.top) / r.height, 0), 1);
      tlFill.style.height = p * 100 + '%';
    }

    if (keyHelp) {
      keyHelp.classList.toggle('show', scrollY > 200);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── 3. 전시관 내비 & 발표 가이드 실시간 갱신 ── */
  const sections = $$('body > section');
  const navLinks = $$('#hallNav a');
  const pbSectionTag = $('#pbSectionTag');
  const pbSpeechText = $('#pbSpeechText');

  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));

      // 발표 가이드 멘트 자동 변경
      const secName = e.target.dataset.sectionName || id.toUpperCase();
      const speech = e.target.dataset.speech || '';
      if (pbSectionTag) pbSectionTag.textContent = secName;
      if (pbSpeechText && speech) pbSpeechText.innerHTML = speech;
    });
  }, { rootMargin: '-40% 0px -50% 0px' });

  sections.forEach((s) => navIO.observe(s));

  /* ── 4. 발표자 모드 (Presenter Bar) 토글 ── */
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

  /* ── 5. 상단 컨트롤: SFX & 전체화면 & 오늘 작업 모달 ── */
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
  if (fsToggle) {
    fsToggle.addEventListener('click', () => {
      playUiClick(500);
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
        fsToggle.classList.add('active');
      } else {
        document.exitFullscreen?.().catch(() => {});
        fsToggle.classList.remove('active');
      }
    });
  }

  /* ── 6. 보스 12가지 패턴 상세 데이터 및 모달 ── */
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
      desc: '대검을 하단으로 낮게 깔고 지면을 박차며 6m를 미끄러지듯 쇄도하여 베어 올리는 패턴입니다. 플레이어가 에스트/물약을 마시거나 거리를 벌려 정비하려고 할 때 빈틈을 놓치지 않고 급습합니다.'
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
      desc: '좌베기 → 우베기 → 찌르기 → 지면 강타로 이어지는 무자비한 4연속 콤보입니다. 풀 히트 시 체력이 거의 바닥나지만, 4타를 모두 흘려내면 보스가 1.3초간 긴 숨을 고르는 확정 프리딜 기회가 주어집니다.'
    },
    11: {
      phase: 'PHASE 2 ENRAGE (50% ~ 30%) 해금',
      title: '11. Rage Combo (광폭화 6연타 난무)',
      dmg: '총 77 DMG (원콤 주의)',
      range: '0 ~ 10.0m (맵 전역 추적)',
      timing: '선딜 0.7s / 6연타 고속 콤보 / 후딜 1.5s',
      parry: '초반부만 가능, 후반 불가',
      parryable: false,
      desc: '체력 50% 각성 시 해금되는 광폭화 전용 난무 패턴입니다. 돌진으로 거리를 좁힌 후 좌베기, 우베기, 찌르기, 360도 회전, 대지 강타 충격파를 쉴 새 없이 몰아쳐 플레이어의 멘탈과 스태미나를 한계까지 시험합니다.'
    },
    12: {
      phase: 'FINAL PHASE (30% ~ 0%) 필살기',
      title: '12. Ultimate Ashen Ruin (잿빛 대파쇄)',
      dmg: '50 DMG + 광역 넉백',
      range: '0 ~ 12.0m (아레나 초토화)',
      timing: '선딜 1.5s (공중 부양) / 판정 0.35s / 후딜 1.5s',
      parry: '패링 절대 불가',
      parryable: false,
      desc: '체력 30% 이하 최종 결전 시 발동하는 보스의 궁극기입니다. 공중 2.2m로 부양하여 암흑 잿빛 심연 에너지를 대검에 응집한 뒤, 지면으로 급강하하며 아레나 전체를 뒤흔드는 충격파를 방출합니다. 타이밍에 맞춘 점프나 외곽 완벽 회피가 필수입니다.'
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

  /* ── 7. 오늘 작업 요약 모달 ── */
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

  // 모달 배경 클릭 시 닫기
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

  /* ── 8. 키보드 인터랙션: 발표 모드 / 이전·다음 섹션 / ESC 닫기 ── */
  function getCurrentSectionIndex() {
    const mid = window.innerHeight * 0.45;
    let idx = 0;
    sections.forEach((s, i) => {
      if (s.getBoundingClientRect().top <= mid) idx = i;
    });
    return idx;
  }

  window.addEventListener('keydown', (e) => {
    // 인풋 포커스나 비디오 조작 중이면 무시
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

    // P: 발표자 가이드 토글
    if (e.key === 'p' || e.key === 'P' || e.key === 'ㅔ' || e.key === 'ㅖ') {
      e.preventDefault();
      togglePresenter();
      return;
    }

    // 좌/우, PageUp/PageDown: 슬라이드 방식 전시관 전환
    let dir = 0;
    if (['ArrowRight', 'PageDown'].includes(e.key)) dir = 1;
    if (['ArrowLeft', 'PageUp'].includes(e.key)) dir = -1;
    if (dir !== 0) {
      e.preventDefault();
      playUiClick(520, 'sine');
      const cur = getCurrentSectionIndex();
      const targetIdx = Math.min(Math.max(cur + dir, 0), sections.length - 1);
      sections[targetIdx].scrollIntoView({ behavior: 'smooth' });
    }
  });

  /* ── 9. 소울라이크 잿가루/불씨 실시간 캔버스 시뮬레이션 ── */
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

    const COUNT = window.innerWidth < 900 ? 25 : 45;
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
})();
