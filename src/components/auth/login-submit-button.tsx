import { Button } from "@/shared/ui/button"

interface LoginSubmitButtonProps {
  isLoading: boolean
  isBlocked: boolean
  countdown: number | null
  formatCountdown: (seconds: number) => string
}

export function LoginSubmitButton({ 
  isLoading, 
  isBlocked, 
  countdown, 
  formatCountdown 
}: LoginSubmitButtonProps) {
  return (
    <Button
      type="submit"
      className={`w-full transition-all duration-300 ${isBlocked
          ? 'bg-slate-100 hover:bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
          : ''
        }`}
      disabled={isLoading || isBlocked}
    >
      {isBlocked
        ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border border-slate-300 border-t-slate-400 rounded-full animate-spin"></div>
            <span>Aguarde {formatCountdown(countdown!)}</span>
          </div>
        )
        : isLoading
          ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Entrando...</span>
            </div>
          )
          : 'Entrar'
      }
    </Button>
  )
}