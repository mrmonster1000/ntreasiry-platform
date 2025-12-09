export default function HomePage() {
  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center px-6 bg-neuro-green">
      <div className="flex flex-col items-center text-center">
        {/* Wordmark */}
        <h1 className="font-fraunces text-neuro-offwhite text-5xl sm:text-6xl md:text-7xl font-medium tracking-tight">
          Neuro-XI
        </h1>

        {/* Tagline */}
        <p className="mt-6 font-inter text-neuro-offwhite text-lg sm:text-xl font-light tracking-wide">
          Data, Research, Intelligence
        </p>
      </div>

      {/* Contact */}
      <footer className="absolute bottom-8 sm:bottom-12">
        <a
          href="mailto:hello@neuro-xi.com"
          className="font-inter text-neuro-offwhite text-sm tracking-wide hover:opacity-80"
        >
          hello@neuro-xi.com
        </a>
      </footer>
    </main>
  );
}
