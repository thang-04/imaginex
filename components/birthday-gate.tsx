'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const CORRECT_DATE = '2004-03-09'; // yyyy-mm-dd format for <input type="date">

const STORAGE_KEY = 'imaginex_birthday_verified';

// Fun text scenarios for wrong answers
const WRONG_MESSAGES = [
  'Sai rồi bạn ơi! 😭 Bạn không phải chủ nhân của web này đâu~',
  'Hmm... Ngày sinh không đúng rồi! Thử lại nha, đừng bỏ cuộc! 💪',
  'Không đúng! Gợi ý: Chủ nhân sinh vào tháng 3 đấy~ 💙💙',
  'Ố ồ! Sai bét rồi! Bạn có chắc mình không bị mất trí nhớ không? 🤔',
  'Vẫn sai! Bạn đoán mò à? Tập trung lên nào! 🎯',
  'Đáp án chưa chính xác! Mình biết bạn làm được mà~ ✨',
  'Sai tiếp rồi! Hay là bạn thử hỏi Google xem? 😏',
  'Nope! Không phải ngày đó đâu! Cố lên~ 🔥',
];

// Fun text for trying to close the modal / dodge
const DODGE_MESSAGES = [
  'Hehe, không thoát được đâu! 😜',
  'Bắt được tui thì mới tắt được nha! 🏃‍♂️💨',
  'Nhanh hơn nữa đi! Tui nhanh lắm đó! ⚡',
  'Đừng cố nữa, nhập ngày sinh cho đúng đi! 😂',
  'Tui né nhanh hơn cả Flash luôn á! 🦸',
  'Ê ê, đừng chơi ăn gian! Trả lời câu hỏi đi! 🤣',
  'Tưởng bắt được tui hả? Nahhh~ 🐱‍👤',
  'Pro gamer mà bắt modal không được à? 😎',
];

const CORRECT_MESSAGES = [
  'Chào mừng 💙💙 trở lại! 🎉🎊',
  'Xin chào  D nhaa! Mời vào ạ~ 💙💙',
];

export default function BirthdayGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [dateValue, setDateValue] = useState('');
  const [wrongMsg, setWrongMsg] = useState<string | null>(null);
  const [dodgeMsg, setDodgeMsg] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  // Modal position (for dodging as a whole)
  const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const dodgeMsgTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fireworksCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDodging = useRef(false);

  // Pre-generate particle data on client to avoid SSR hydration mismatch
  const [floatingParticles, setFloatingParticles] = useState<Array<{
    w: number; h: number; top: string; left: string; bg: string; op: number; dur: string; del: string;
  }>>([]);

  useEffect(() => {
    setFloatingParticles(
      Array.from({ length: 20 }, () => ({
        w: Math.random() * 6 + 2,
        h: Math.random() * 6 + 2,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        bg: `hsl(${Math.random() * 360}, 70%, 60%)`,
        op: Math.random() * 0.5 + 0.2,
        dur: `${Math.random() * 3 + 2}s`,
        del: `${Math.random() * 2}s`,
      })),
    );
  }, []);

  // Check localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'true') {
        setVerified(true);
      } else {
        setVerified(false);
      }
    } catch {
      setVerified(false);
    }
  }, []);

  // ── Fireworks effect ──────────────────────────────────────────────────
  const launchFireworks = useCallback(() => {
    const canvas = fireworksCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      alpha: number; decay: number;
      color: string; size: number;
    };

    const particles: Particle[] = [];
    const colors = [
      '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff',
      '#5f27cd', '#01a3a4', '#f368e0', '#ff6348', '#7bed9f',
      '#70a1ff', '#ffa502', '#ff4757', '#2ed573', '#eccc68',
    ];

    function burst(cx: number, cy: number) {
      const count = 60 + Math.floor(Math.random() * 40);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = 2 + Math.random() * 5;
        particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          decay: 0.012 + Math.random() * 0.016,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 3 + Math.random() * 4,
        });
      }
    }

    // Fire first burst immediately
    burst(
      canvas.width * (0.3 + Math.random() * 0.4),
      canvas.height * (0.2 + Math.random() * 0.3),
    );

    const burstTimers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < 10; i++) {
      burstTimers.push(
        setTimeout(() => {
          burst(
            canvas.width * (0.1 + Math.random() * 0.8),
            canvas.height * (0.1 + Math.random() * 0.6),
          );
        }, i * 300),
      );
    }

    let animId: number;
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (particles.length > 0) {
        animId = requestAnimationFrame(animate);
      }
    }

    animId = requestAnimationFrame(animate);

    setTimeout(() => {
      cancelAnimationFrame(animId);
      burstTimers.forEach(clearTimeout);
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 6000);
  }, []);

  // ── Submit handler ────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!dateValue) return;

    if (dateValue === CORRECT_DATE) {
      // Launch fireworks FIRST, then show success overlay with a slight delay
      launchFireworks();
      setTimeout(() => setShowSuccess(true), 300);
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // ignore
      }
      setTimeout(() => {
        setVerified(true);
      }, 4500);
    } else {
      setAttempts((prev) => prev + 1);
      setWrongMsg(WRONG_MESSAGES[attempts % WRONG_MESSAGES.length]);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  }, [dateValue, attempts, launchFireworks]);

  // ── Dodge: entire modal runs away from cursor ─────────────────────────
  const dodgeModal = useCallback(() => {
    if (isDodging.current || showSuccess) return;
    isDodging.current = true;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const modalW = modalRef.current?.offsetWidth ?? 420;
    const modalH = modalRef.current?.offsetHeight ?? 500;

    // Random position with padding so modal stays fully visible
    const pad = 16;
    const newX = pad + Math.random() * (vw - modalW - pad * 2);
    const newY = pad + Math.random() * (vh - modalH - pad * 2);

    setModalPos({ x: newX, y: newY });

    // Show a dodge message
    const msg = DODGE_MESSAGES[Math.floor(Math.random() * DODGE_MESSAGES.length)];
    setDodgeMsg(msg);

    if (dodgeMsgTimeoutRef.current) {
      clearTimeout(dodgeMsgTimeoutRef.current);
    }
    dodgeMsgTimeoutRef.current = setTimeout(() => {
      setDodgeMsg(null);
    }, 2000);

    // Cooldown so it doesn't fire 100 times per second
    setTimeout(() => {
      isDodging.current = false;
    }, 400);
  }, [showSuccess]);

  // Handle keyboard Enter
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  // Loading state
  if (verified === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-white" />
      </div>
    );
  }

  // Already verified
  if (verified) {
    return <>{children}</>;
  }

  // Compute modal style
  const modalStyle: React.CSSProperties = modalPos
    ? {
      position: 'fixed',
      left: `${modalPos.x}px`,
      top: `${modalPos.y}px`,
      transition: 'left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      margin: 0,
    }
    : {};

  return (
    <>
      {/* Blurred background */}
      <div
        ref={containerRef}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md"
      >
        {/* Floating particles for fun */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {floatingParticles.map((p, i) => (
            <div
              key={i}
              className="absolute animate-pulse rounded-full"
              style={{
                width: `${p.w}px`,
                height: `${p.h}px`,
                top: p.top,
                left: p.left,
                background: p.bg,
                opacity: p.op,
                animationDuration: p.dur,
                animationDelay: p.del,
              }}
            />
          ))}
        </div>

        {/* Dodge message floating toast — fixed so it stays visible even when modal moves */}
        {dodgeMsg ? (
          <div
            className="pointer-events-none fixed left-1/2 top-6 z-[10001] -translate-x-1/2 animate-bounce rounded-full px-5 py-2 text-sm font-bold text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4, #38bdf8)' }}
          >
            {dodgeMsg}
          </div>
        ) : null}

        {/* Modal — entire thing dodges */}
        <div
          ref={modalRef}
          style={modalStyle}
          className={`relative mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-blue-800/40 bg-gradient-to-b from-slate-800 via-slate-900 to-blue-950/80 shadow-2xl shadow-blue-950/40 ${shake ? 'animate-shake' : ''}`}
        >
          {/* Close button that triggers dodge */}
          <button
            type="button"
            onMouseEnter={dodgeModal}
            onClick={dodgeModal}
            className="absolute right-4 top-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-blue-900/60 text-blue-300 transition-all duration-200 hover:bg-blue-800 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>

          {/* Success overlay */}
          {showSuccess ? (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-gradient-to-b from-emerald-900/95 to-slate-900/95 backdrop-blur-sm">
              <div className="mb-4 text-6xl">💙</div>
              <p className="text-center text-xl font-bold text-white">
                {CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)]}
              </p>
              <div className="mt-4 h-1 w-32 overflow-hidden rounded-full bg-slate-700">
                <div className="h-full animate-progress rounded-full bg-emerald-400" />
              </div>
            </div>
          ) : null}

          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600/20 via-cyan-500/15 to-sky-400/20 px-6 pb-4 pt-6">
            <div className="mb-2 text-center text-4xl"></div>
            <h2 className="text-center text-xl font-bold text-white">
              Khoan đã! Bạn là ai?
            </h2>
            <p className="mt-2 text-center text-sm text-slate-300">
              Để vào được trang web này, bạn phải chứng minh mình là{' '}
              <span className="font-semibold text-cyan-400">chủ nhân thật sự</span>{' '}
              đã! 💙💙
            </p>
          </div>

          {/* Body */}
          <div className="px-6 pb-6 pt-4">
            <p className="mb-4 text-center text-sm text-slate-400">
              💡 Nhập ngày sinh của 💙💙 để được vào:
            </p>

            {/* Single date input */}
            <div className="mb-4">
              <label className="mb-2 block text-center text-xs font-semibold text-slate-400">
                Ngày sinh
              </label>
              <input
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-lg border border-blue-700/50 bg-slate-800/80 px-4 py-3 text-center text-lg font-bold text-white outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 [color-scheme:dark]"
              />
            </div>

            {/* Wrong answer message */}
            {wrongMsg ? (
              <div className="mb-4 rounded-lg border border-red-800/50 bg-red-950/40 px-4 py-2.5 text-center text-sm text-red-300">
                {wrongMsg}
              </div>
            ) : null}

            {/* Attempt counter */}
            {attempts > 0 ? (
              <p className="mb-4 text-center text-xs text-slate-500">
                Số lần thử: <span className="font-bold text-amber-400">{attempts}</span>
                {attempts >= 5 ? ' — Bạn ổn chứ? 😅' : ''}
                {attempts >= 10 ? ' — Kiên nhẫn ghê! 🫡' : ''}
              </p>
            ) : null}

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!dateValue}
              className="group relative w-full overflow-hidden rounded-xl py-3 font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-300 opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="relative">🚀 Xác nhận danh tính!</span>
            </button>

            <p className="mt-4 text-center text-[11px] text-slate-600">
              Gợi ý: Nếu bạn không biết đáp án, có lẽ bạn không nên ở đây... 🤫
            </p>
          </div>
        </div>
      </div>

      {/* Fireworks canvas — fullscreen, AFTER overlay so it renders on top */}
      <canvas
        ref={fireworksCanvasRef}
        className="pointer-events-none fixed inset-0 z-[10000]"
        style={{ width: '100vw', height: '100vh' }}
      />
    </>
  );
}
