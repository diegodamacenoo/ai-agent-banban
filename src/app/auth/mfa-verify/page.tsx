import { Metadata } from "next";
import MFAVerification from "../components/mfa-verification";

export const metadata: Metadata = {
  title: "VerificaÃ§Ã£o de Dois Fatores",
  description: "VerificaÃ§Ã£o de autenticaÃ§Ã£o em dois fatores",
};

export default function MFAVerifyPage() {
  return (
    <div className="container max-w-md mx-auto p-4">
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-12">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
          <MFAVerification redirectUrl="/" />
        </div>
      </div>
    </div>
  );
} 
