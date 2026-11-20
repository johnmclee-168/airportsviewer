/**
 * Home page (/)
 * Entry screen of the app. During the setup stage it renders a responsive
 * placeholder card; later stages replace it with the airport list.
 */
export default function Home() {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight">Airports</h1>
      <p className="mt-2 text-muted">
        Browse the airports Qantas operates from. The list is coming soon.
      </p>
    </section>
  );
}
