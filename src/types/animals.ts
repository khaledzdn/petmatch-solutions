export type AnimalSpecies = "dog" | "cat" | "rabbit" | "bird" | "other";
export type AnimalStatus = "available" | "adopted" | "pending";

export interface Animal {
  id: string;
  shelter_id: string;
  name: string;
  species: AnimalSpecies;
  breed: string | null;
  age_months: number;
  description: string;
  photo_urls: string[];
  health_status: string;
  status: AnimalStatus;
  created_at: string;
  shelter?: {
    id: string;
    name: string;
    location: string;
  };
}

export interface AnimalsResponse {
  data: Animal[];
  nextCursor: string | null;
  total: number;
}

export interface AnimalsQueryParams {
  species?: AnimalSpecies;
  maxAgeMonths?: number;
  cursor?: string;
  limit?: number;
}
