import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default function ContactPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-lg w-full text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">Contact</h1>
          <p className="text-muted-foreground mb-8">
            Have questions? Get in touch with us.
          </p>

          <div className="border border-border rounded-xl p-8">
            <p className="text-muted-foreground text-sm mb-4">Email us at</p>
            <a
              href="mailto:hello@anchor.app"
              className="text-xl font-semibold hover:underline text-foreground transition"
            >
              hello@anchor.app
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
