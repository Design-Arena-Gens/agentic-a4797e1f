import VideoRequestForm from "@/components/VideoRequestForm";

export default function HomePage() {
  return (
    <main className="container mx-auto max-w-5xl px-6 py-12">
      <section className="space-y-8">
        <header className="space-y-3 text-center md:text-left">
          <p className="text-sm uppercase tracking-widest text-accent">
            Sora 2 Video Studio
          </p>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Gere vídeos incríveis com controle absoluto sobre o Sora 2
          </h1>
          <p className="text-slate-400 md:text-lg">
            Ajuste com precisão modelo, duração, prompts e parâmetros avançados
            para entregar experiências cinematográficas que cabem no seu budget.
          </p>
        </header>
        <VideoRequestForm />
      </section>
    </main>
  );
}
