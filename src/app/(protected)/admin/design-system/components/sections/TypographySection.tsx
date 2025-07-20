import { Card, CardContent } from '@/shared/ui/card';

export function TypographySection() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h1 className="text-4xl font-bold">Título Principal (h1)</h1>
        <h2 className="text-3xl font-semibold">Título de Seção (h2)</h2>
        <h3 className="text-2xl font-semibold">Título de Card (h3)</h3>
        <h4 className="text-xl font-semibold">Sub-título (h4)</h4>
        <p className="text-base text-gray-700">
          Parágrafo padrão. Usado para a maioria do texto do corpo. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>
        <p className="text-sm text-muted-foreground">
          Texto silenciado/descrição. Usado para descrições abaixo de títulos ou texto de ajuda.
        </p>
        <a href="#" className="text-sm text-primary hover:underline">
          Este é um link padrão.
        </a>
        <blockquote className="mt-6 border-l-2 pl-6 italic">
          "Isto é um blockquote, útil para destacar citações ou notas importantes."
        </blockquote>
      </CardContent>
    </Card>
  );
}