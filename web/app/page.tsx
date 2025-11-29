import { Hero } from "@/components/hero";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Demo } from "@/components/demo";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Nav />

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <Hero />
      </section>

      {/* Demo Section */}
      <section className="px-6 py-20 border-border">
        <Demo />
      </section>

      <Footer />
    </main>
  );
}
