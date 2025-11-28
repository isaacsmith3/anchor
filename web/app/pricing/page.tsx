import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default function PricingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-lg w-full text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">Pricing</h1>

          <div className="border border-border rounded-xl p-8 mt-8">
            <div className="text-5xl font-bold mb-2">Free</div>
            <p className="text-muted-foreground mb-8">
              Anchor is completely free to use
            </p>

            <ul className="text-left space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-xs">
                  ✓
                </span>
                <span>Unlimited blocking sessions</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-xs">
                  ✓
                </span>
                <span>Browser extension</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-xs">
                  ✓
                </span>
                <span>Mobile app</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-xs">
                  ✓
                </span>
                <span>Real-time sync</span>
              </li>
            </ul>

            <a
              href="/auth/sign-up"
              className="inline-block w-full border-2 border-foreground bg-foreground text-background hover:bg-transparent hover:text-foreground font-semibold px-8 py-3 rounded-lg transition-all duration-200"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
