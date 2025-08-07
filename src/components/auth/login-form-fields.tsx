import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

interface LoginFormFieldsProps {
  isBlocked: boolean
}

export function LoginFormFields({ isBlocked }: LoginFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="seu@email.com"
          required
          disabled={isBlocked}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="********"
          required
          disabled={isBlocked}
        />
      </div>
    </>
  )
}