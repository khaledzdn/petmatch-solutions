import { BrowseFeed } from "@/components/adoption/BrowseFeed";

export const metadata = {
  title: "Browse Animals — PetMatch",
  description: "Swipe through animals available for adoption near you.",
};

export default function AdoptPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b px-4 py-3 flex items-center">
        <h1 className="text-lg font-semibold text-gray-900">Find Your Match</h1>
      </header>
      <BrowseFeed />
    </main>
  );
}
