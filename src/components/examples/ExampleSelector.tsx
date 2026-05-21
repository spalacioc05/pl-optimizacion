import type { ExampleModel } from "@/lib/linear-programming/types";
import { ExampleCard } from "./ExampleCard";

interface Props {
  examples: ExampleModel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ExampleSelector({ examples, selectedId, onSelect }: Props) {
  return (
    <section className="md-surface p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Ejemplos precargados
          </h2>
          <p className="text-xs text-muted-foreground/80">Selecciona uno para comenzar</p>
        </div>
        <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary-dark">
          {examples.length} disponibles
        </span>
      </div>
      <div className="space-y-3">
        {examples.map((m) => (
          <ExampleCard
            key={m.id}
            model={m}
            selected={m.id === selectedId}
            onSelect={() => onSelect(m.id)}
          />
        ))}
      </div>
    </section>
  );
}
