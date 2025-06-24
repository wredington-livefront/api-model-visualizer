import { NetworkGraphContainer } from "~/component/network-graph-container";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <NetworkGraphContainer />
      </div>
    </main>
  );
}
