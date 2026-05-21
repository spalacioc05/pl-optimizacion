import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { LinearModel, SolverStep } from "@/lib/linear-programming/types";
import { StepTimeline } from "./StepTimeline";
import { StepCard } from "./StepCard";

interface Props {
  model: LinearModel;
  steps: SolverStep[];
  currentStep: number;
  onStepChange: (i: number) => void;
  showAll: boolean;
}

export function StepByStepPlayer({ model, steps, currentStep, onStepChange, showAll }: Props) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  // animate progress when step changes
  useEffect(() => {
    setProgress(0);
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1200);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [currentStep]);

  return (
    <div className="space-y-3">
      <StepTimeline steps={steps} current={currentStep} onJump={onStepChange} />

      {/* progress bar */}
      <div className="relative h-1 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="absolute inset-y-0 left-0 gradient-primary"
          animate={{ width: `${progress * 100}%` }}
          transition={{ ease: "linear" }}
        />
      </div>

      {showAll ? (
        <div className="space-y-4">
          {steps.map((s, i) => (
            <StepCard key={s.id} step={s} model={model} index={i} total={steps.length} />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <StepCard
            key={steps[currentStep].id}
            step={steps[currentStep]}
            model={model}
            index={currentStep}
            total={steps.length}
          />
        </AnimatePresence>
      )}
    </div>
  );
}
