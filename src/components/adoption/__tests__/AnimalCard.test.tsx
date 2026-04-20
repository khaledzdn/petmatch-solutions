import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AnimalCard } from "../AnimalCard";
import type { Animal } from "@/types/animals";

const mockAnimal: Animal = {
  id: "animal-1",
  shelter_id: "shelter-1",
  name: "Buddy",
  species: "dog",
  breed: "Labrador",
  age_months: 24,
  description: "A friendly and energetic dog.",
  photo_urls: [],
  health_status: "healthy",
  status: "available",
  created_at: "2026-04-20T00:00:00Z",
  shelter: { id: "shelter-1", name: "Happy Paws", location: "Vienna" },
};

describe("AnimalCard", () => {
  let onSwipeRight: (id: string) => void;
  let onSwipeLeft: (id: string) => void;

  beforeEach(() => {
    onSwipeRight = vi.fn<(id: string) => void>();
    onSwipeLeft = vi.fn<(id: string) => void>();
  });

  it("renders animal name, species, breed, and shelter", () => {
    render(<AnimalCard animal={mockAnimal} onSwipeRight={onSwipeRight} onSwipeLeft={onSwipeLeft} />);
    expect(screen.getByText("Buddy")).toBeInTheDocument();
    expect(screen.getByText("dog")).toBeInTheDocument();
    expect(screen.getByText("Labrador")).toBeInTheDocument();
    expect(screen.getByText("Happy Paws")).toBeInTheDocument();
  });

  it("renders age in years when >= 12 months", () => {
    render(<AnimalCard animal={mockAnimal} onSwipeRight={onSwipeRight} onSwipeLeft={onSwipeLeft} />);
    expect(screen.getByText("2yr")).toBeInTheDocument();
  });

  it("renders age in months when < 12 months", () => {
    const young = { ...mockAnimal, age_months: 3 };
    render(<AnimalCard animal={young} onSwipeRight={onSwipeRight} onSwipeLeft={onSwipeLeft} />);
    expect(screen.getByText("3mo")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<AnimalCard animal={mockAnimal} onSwipeRight={onSwipeRight} onSwipeLeft={onSwipeLeft} />);
    expect(screen.getByText("A friendly and energetic dog.")).toBeInTheDocument();
  });

  it("calls onSwipeRight when favourite button is clicked", () => {
    render(<AnimalCard animal={mockAnimal} onSwipeRight={onSwipeRight} onSwipeLeft={onSwipeLeft} />);
    fireEvent.click(screen.getByRole("button", { name: /save to favourites/i }));
    expect(onSwipeRight).toHaveBeenCalledWith("animal-1");
  });

  it("calls onSwipeLeft when skip button is clicked", () => {
    render(<AnimalCard animal={mockAnimal} onSwipeRight={onSwipeRight} onSwipeLeft={onSwipeLeft} />);
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(onSwipeLeft).toHaveBeenCalledWith("animal-1");
  });

  it("does not call handlers when disabled", () => {
    render(
      <AnimalCard animal={mockAnimal} onSwipeRight={onSwipeRight} onSwipeLeft={onSwipeLeft} disabled />
    );
    fireEvent.click(screen.getByRole("button", { name: /save to favourites/i }));
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(onSwipeRight).not.toHaveBeenCalled();
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it("renders placeholder when no photo", () => {
    render(<AnimalCard animal={mockAnimal} onSwipeRight={onSwipeRight} onSwipeLeft={onSwipeLeft} />);
    expect(screen.getByText("🐾")).toBeInTheDocument();
  });

  it("has accessible article landmark", () => {
    render(<AnimalCard animal={mockAnimal} onSwipeRight={onSwipeRight} onSwipeLeft={onSwipeLeft} />);
    expect(screen.getByTestId("animal-card")).toBeInTheDocument();
  });
});
