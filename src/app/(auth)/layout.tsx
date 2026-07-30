import Image from "next/image";
import { BackButton } from "@/components/shared/back-button";
import logo from "../../../public/logo.png";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6">
        <div className="flex items-center gap-2">
          <Image
            src={logo}
            alt="Beevia"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-heading text-lg font-bold">Beevia</span>
        </div>
        <BackButton />
      </header>
      <main className="flex flex-1 items-center justify-center bg-[#F9FAFB] px-4">
        {children}
      </main>
    </div>
  );
}
