import type { Step } from '../lib/types/recipe'

export function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-4">
      {steps.sort((a, b) => a.order - b.order).map(step => (
        <li key={step.order} className="flex gap-4">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#C0622F] text-white flex items-center justify-center font-medium text-sm">
            {step.order}
          </span>
          <p className="flex-1 pt-1">{step.text}</p>
        </li>
      ))}
    </ol>
  )
}
