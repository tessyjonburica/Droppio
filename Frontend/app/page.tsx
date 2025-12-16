import { Header } from '@/components/layout/header';

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="font-logo text-4xl text-primary">droppio</h1>
          <p className="font-body text-foreground mt-4">Welcome to Droppio</p>
        </div>
      </main>
    </>
  );
}

