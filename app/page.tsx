import { Game } from '@/components/Game';

// The entire viewport is the game — no scrolling, no extra padding.
export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden">
      <Game />
    </main>
  );
}
