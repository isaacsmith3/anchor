import { Hero } from "@/components/hero";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <Nav />
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5 items-center justify-center">
          <Hero />
        </div>

        <Footer />
      </div>
    </main>
  );
}
