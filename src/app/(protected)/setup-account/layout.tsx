import '@/app/ui/global.css';
import { geist } from '@/app/ui/fonts';

export default function SetupLayout({
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
