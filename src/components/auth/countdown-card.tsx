interface CountdownCardProps {
  countdown: number
  formatCountdown: (seconds: number) => string
}

export function CountdownCard({ countdown, formatCountdown }: CountdownCardProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 shadow-sm p-6 rounded-xl mb-6">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_50%,transparent_75%)] bg-[length:8px_8px] opacity-20"></div>

      <div className="relative z-10 text-center">
        {/* Countdown display */}
        <div className="inline-flex items-center justify-center bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg px-4 py-2 mb-3">
          <div className="text-2xl font-mono font-semibold text-slate-800 tracking-wider">
            {formatCountdown(countdown)}
          </div>
        </div>

        <div className="flex flex-row gap-4">
          {/* Main message */}
          <div className="font-medium mb-3">
            Acesso temporariamente suspenso
          </div>
        </div>

        {/* Explanation text */}
        <div className="text-sm">
          Sistema detectou atividade incomum. O acesso será liberado automaticamente.
        </div>
      </div>
    </div>
  )
}