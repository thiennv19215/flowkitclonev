import { Check } from 'lucide-react'

export interface PipelineStep {
  id: string
  label: string
  done?: boolean
}

interface Props {
  steps: PipelineStep[]
  current: string
  onSelect?: (id: string) => void
}

export default function PipelineStepper({ steps, current, onSelect }: Props) {
  return (
    <div className="flex items-center gap-1 text-sm">
      {steps.map((step, i) => {
        const active = step.id === current
        const last = i === steps.length - 1
        return (
          <div key={step.id} className="flex items-center gap-1">
            <button
              onClick={() => onSelect?.(step.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                active
                  ? 'bg-accent-purple/20 text-accent-purple'
                  : step.done
                    ? 'text-text-primary hover:bg-bg-tertiary'
                    : 'text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium ${
                  step.done
                    ? 'bg-accent-green text-white'
                    : active
                      ? 'bg-accent-purple text-white'
                      : 'bg-bg-tertiary border border-border'
                }`}
              >
                {step.done ? <Check size={10} /> : i + 1}
              </span>
              {step.label}
            </button>
            {!last && <span className="text-text-secondary text-xs">›</span>}
          </div>
        )
      })}
    </div>
  )
}
