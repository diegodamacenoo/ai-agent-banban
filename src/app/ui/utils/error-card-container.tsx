import { FrownIcon } from "lucide-react";

interface ErrorCardContainerProps {
    title: string;
    description: string;
}

export function ErrorCardContainer() {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-12">
            <FrownIcon className="w-10 h-10" />
            <div className="flex flex-col items-center justify-center">
                <span className="font-semibold">Falha ao obter dados.</span>
                <span className="text-sm text-muted-foreground">Por favor, contate o administrador da sua organizaÃ§Ã£o.</span>
            </div>
        </div>
    );
}

export function CustomErrorCardContainer({ title, description }: ErrorCardContainerProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-12">
            <FrownIcon className="w-10 h-10" />
            <div className="flex flex-col items-center justify-center">
                <span className="font-semibold">{title}</span>
                <span className="text-sm text-muted-foreground">{description}</span>
            </div>
        </div>
    );
}
