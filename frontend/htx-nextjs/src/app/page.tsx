import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center  p-8 gap-8 sm:p-20 font-sans">
      <header className="w-full text-center animate-slideInDown">
        <h1 className="text-4xl font-bold">Welcome to Audio Hosting App</h1>
        <p className="mt-2 text-lg text-muted-foreground animate-fadeIn">
          Store and Play your audio files.
        </p>
      </header>

      <main className="flex flex-col items-center gap-8 animate-fadeInUp">
        <div className="max-w-2xl text-center">
          <p className="text-xl">To get started, login or create an account.</p>
          <p className="mt-4">Sign up or log in with the pre-created accounts.</p>
        </div>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">Sign Up</Link>
          </Button>
        </div>
      </main>

      <footer className="w-full text-center animate-fadeIn">
        <p className="text-sm text-muted-foreground">
         Done by John Paul Lam.
        </p>
      </footer>
    </div>
  );
}
