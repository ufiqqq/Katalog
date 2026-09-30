import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuthClient from "@/components/AuthClient";

interface PageProps {
  searchParams: {
    callbackUrl?: string;
  };
}

export default async function AuthPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect(searchParams.callbackUrl || "/");
  }

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <AuthClient callbackUrl={searchParams.callbackUrl} />
    </div>
  );
}
