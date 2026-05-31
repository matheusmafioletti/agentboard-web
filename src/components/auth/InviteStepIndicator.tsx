interface InviteStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

/** Progress indicator for the invite acceptance wizard. */
export default function InviteStepIndicator({
  currentStep,
  totalSteps,
}: InviteStepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1;
        const active = step === currentStep;
        const completed = step < currentStep;
        return (
          <div key={step} className="flex items-center gap-2 flex-1 last:flex-none">
            <div
              className={[
                "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0",
                active || completed
                  ? "bg-accent text-white"
                  : "bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#6E6E73] dark:text-[#8E8E93]",
              ].join(" ")}
            >
              {step}
            </div>
            {step < totalSteps && (
              <div
                className={[
                  "h-0.5 flex-1 rounded-full",
                  completed ? "bg-accent" : "bg-black/[0.08] dark:bg-white/[0.08]",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
