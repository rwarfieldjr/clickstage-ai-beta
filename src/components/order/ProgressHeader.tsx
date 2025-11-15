interface ProgressHeaderProps {
  currentStep: number;
}

export default function ProgressHeader({ currentStep }: ProgressHeaderProps) {
  const steps = [
    { number: 1, label: "Contact Info" },
    { number: 2, label: "Upload Photos" },
    { number: 3, label: "Payment" },
  ];

  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      {steps.map((step, index) => (
        <>
          <div key={step.number} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                currentStep === step.number
                  ? "bg-accent text-white"
                  : currentStep > step.number
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.number}
            </div>
            <span
              className={`text-sm font-medium transition-colors ${
                currentStep === step.number
                  ? "text-accent"
                  : currentStep > step.number
                  ? "text-green-600 dark:text-green-400"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="w-12 h-0.5 bg-border"></div>
          )}
        </>
      ))}
    </div>
  );
}
