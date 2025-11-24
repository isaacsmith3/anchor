import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default function PricingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <Nav />
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <div className="flex-1 flex flex-col gap-8 max-w-3xl p-5 items-center justify-center text-center">
          <h1 className="text-4xl lg:text-5xl font-bold">Pricing</h1>
          <div className="text-2xl lg:text-3xl font-semibold mt-8">Free</div>
          <p className="text-lg text-muted-foreground mt-4">
            Anchor is completely free to use.
          </p>
        </div>

        <Footer />
      </div>
    </main>
  );
}
