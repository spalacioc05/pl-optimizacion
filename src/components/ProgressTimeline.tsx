interface TimelineStage {
  id: string;
  shortLabel: string;
}

interface ProgressTimelineProps {
  stages: TimelineStage[];
  activeIndex: number;
  revealedIndex: number;
  idle: boolean;
  onSelectStage: (index: number) => void;
}

const ProgressTimeline = ({
  stages,
  activeIndex,
  revealedIndex,
  idle,
  onSelectStage,
}: ProgressTimelineProps) => {
  return (
    <div className="progress-timeline" aria-label="Progreso de la explicación paso a paso">
      {stages.map((stage, index) => {
        const isCompleted = !idle && index < revealedIndex;
        const isCurrent = !idle && index === activeIndex;
        const isUnlocked = !idle && index <= revealedIndex;

        return (
          <button
            key={stage.id}
            type="button"
            className={[
              'timeline-step',
              isCompleted ? 'completed' : '',
              isCurrent ? 'current' : '',
              !isUnlocked ? 'locked' : '',
            ].join(' ').trim() || undefined}
            onClick={() => onSelectStage(index)}
            disabled={!isUnlocked}
          >
            <span className="timeline-step-index">{index + 1}</span>
            <span className="timeline-step-label">{stage.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ProgressTimeline;