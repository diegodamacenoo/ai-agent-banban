import '@/app/ui/global.css';

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            {children}
        </div>
    );
}