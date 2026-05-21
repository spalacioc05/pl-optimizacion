import { motion } from "framer-motion";

interface Props {
  current: number;
  total: number;
  playing: boolean;
  showAll: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onToggleAll: () => void;
}

function CtrlBtn({
  children,
  onClick,
  primary,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid place-items-center rounded-full transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
        primary
          ? "h-12 w-12 gradient-primary text-primary-foreground shadow-elevation-2 hover:shadow-elevation-3"
          : "h-10 w-10 bg-surface-alt text-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

export function FloatingStepControls({
  current,
  total,
  playing,
  showAll,
  onPrev,
  onNext,
  onPlay,
  onPause,
  onReset,
  onToggleAll,
}: Props) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.3 }}
      className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 px-3"
    >
      <div className="md-floating flex items-center gap-1.5 px-2.5 py-1.5">
        <CtrlBtn label="Anterior" onClick={onPrev} disabled={current === 0 || showAll}>
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </CtrlBtn>

        {playing ? (
          <CtrlBtn label="Pausar" onClick={onPause} primary>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <rect x="7" y="5" width="3.5" height="14" rx="1" />
              <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
            </svg>
          </CtrlBtn>
        ) : (
          <CtrlBtn label="Reproducir automático" onClick={onPlay} primary>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M7 5l12 7-12 7V5z" />
            </svg>
          </CtrlBtn>
        )}

        <CtrlBtn label="Siguiente" onClick={onNext} disabled={current === total - 1 || showAll}>
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </CtrlBtn>

        <div className="mx-1 h-7 w-px bg-border" />

        <CtrlBtn label="Reiniciar" onClick={onReset}>
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </CtrlBtn>

        <CtrlBtn label={showAll ? "Modo paso a paso" : "Mostrar todo"} onClick={onToggleAll}>
          {showAll ? (
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <rect x="4" y="5" width="16" height="6" rx="2" />
              <rect x="4" y="13" width="16" height="6" rx="2" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M4 10h16M10 4v16" />
            </svg>
          )}
        </CtrlBtn>

        <div className="ml-1 mr-2 hidden items-center gap-2 sm:flex">
          <div className="font-mono text-[11px] font-semibold text-muted-foreground">
            {showAll ? "Todos" : `${current + 1}/${total}`}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
