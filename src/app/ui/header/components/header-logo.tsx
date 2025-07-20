import { PyramidIcon } from "lucide-react";

export function HeaderLogo() {
    return (
        <div className="flex items-center">
            <div className="flex items-center gap-2 ">
                <div className="p-1 bg-white rounded-full hidden lg:block">
                    <PyramidIcon className="size-6 stroke-black" />
                </div>
                <span className="text-md text-[#D4D4D8] hidden lg:block">/</span>
                <h1 className="text-md font-semibold tracking-tight inline-flex items-center gap-1">
                    <span className="hidden lg:block">BanBan CalÃ§ados</span>
                    {/* Mostrar Ã­cone em telas menores se o texto estiver escondido */}
                    <PyramidIcon className="size-6 stroke-black lg:hidden" />
                </h1>
            </div>
        </div>
    );
} 
