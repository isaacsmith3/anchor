import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default function ContactPage() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <Nav />
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <div className="flex-1 flex flex-col gap-8 max-w-3xl p-5 items-center justify-center text-center">
          <h1 className="text-4xl lg:text-5xl font-bold">Contact</h1>
          <p className="text-lg text-muted-foreground mt-4">
            Get in touch with us
          </p>
          <a
            href="mailto:contact@app"
            className="text-xl font-semibold hover:underline text-foreground transition mt-4"
          >
            contact@app
          </a>
        </div>

        <Footer />
      </div>
    </main>
  );
}
