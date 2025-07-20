import { PyramidIcon } from "lucide-react";

export function SidebarLogo() {
    return (
        <div className="flex items-center px-1 py-3">
            <div className="flex items-center gap-2 ">
                <div className="p-1 bg-white rounded-full hidden lg:block">
                    <PyramidIcon className="size-5 stroke-black" />
                </div>
                <span className="text-md text-[#D4D4D8] hidden lg:block">/</span>
                <h1 className="text-md font-semibold tracking-tight inline-flex items-center gap-1">
                    <span className="hidden lg:block">BanBan</span>
                    {/* Mostrar ícone em telas menores se o texto estiver escondido */}
                    <PyramidIcon className="size-6 stroke-black lg:hidden" />
                </h1>
            </div>
        </div>
    );
} 
