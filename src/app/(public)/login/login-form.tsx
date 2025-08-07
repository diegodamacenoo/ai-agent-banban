'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { buttonVariants } from "@/shared/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import Link from "next/link"
import clsx from 'clsx'
import { useToast } from '@/shared/ui/toast'
import { AlertTriangle } from 'lucide-react'

import { signInWithPassword } from '@/app/actions/auth/login'
import { useLoginCountdown } from '@/hooks/useLoginCountdown'
import { useLoginBlockValidation } from '@/hooks/useLoginBlockValidation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useBlockedUserCountdown } from '@/components/auth/blocked-user-countdown'

import { CountdownCard } from '@/components/auth/countdown-card'
import { LoginFormFields } from '@/components/auth/login-form-fields'
import { LoginSubmitButton } from '@/components/auth/login-submit-button'

/**
 * Componente de formulário de login
 * Gerencia autenticação com validação de bloqueios e countdown
 */
export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  
  // Hooks customizados para funcionalidades específicas
  const { countdown, isBlocked, formatCountdown } = useLoginCountdown()
  const { validateUserBlock } = useLoginBlockValidation()
  const { currentUserId } = useCurrentUser()
  const { isBlocked: isBlockedByCountdown } = useBlockedUserCountdown(currentUserId || '')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    setIsLoading(true)
    setError(null)

    try {
      // Verificar se usuário está bloqueado antes do login
      const blockValidation = await validateUserBlock(email)
      
      if (blockValidation.isBlocked) {
        setIsLoading(false)
        return
      }

      // Verificar countdown local (fallback)
      if (isBlocked) {
        toast.warning("Login Temporariamente Bloqueado", {
          description: `Aguarde ${formatCountdown(countdown!)} para tentar fazer login novamente.`,
          duration: 5000,
          icon: <AlertTriangle className="h-4 w-4" />
        })
        setIsLoading(false)
        return
      }

      // Realizar login
      const { success, error, redirect } = await signInWithPassword({
        email,
        password
      })

      if (!success) {
        setError(error || 'Erro ao realizar login')
        return
      }

      // Redirecionar se sucesso
      if (redirect) {
        router.push(redirect)
        router.refresh()
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar fazer login')
    } finally {
      setIsLoading(false)
    }
  }

  const finalIsBlocked = isBlocked || isBlockedByCountdown

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle className="font-medium text-xl">Login</CardTitle>
        <CardDescription>Entre com suas credenciais.</CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Card de countdown se bloqueado */}
        {countdown !== null && countdown > 0 && (
          <CountdownCard countdown={countdown} formatCountdown={formatCountdown} />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded">
              {error}
            </div>
          )}

          <LoginFormFields isBlocked={finalIsBlocked} />

          <LoginSubmitButton
            isLoading={isLoading}
            isBlocked={finalIsBlocked}
            countdown={countdown}
            formatCountdown={formatCountdown}
          />
        </form>
      </CardContent>
      
      <CardFooter className="flex flex-col items-start gap-2 pt-2">
        <Link
          href="/login/forgot-password"
          className={clsx(
            buttonVariants({ variant: "link" }),
            "p-0 h-auto w-full"
          )}
        >
          Esqueci minha senha
        </Link>
      </CardFooter>
    </Card>
  )
}
