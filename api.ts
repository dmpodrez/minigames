const API_BASE_URL =
  "https://faxb76kxra.execute-api.eu-central-1.amazonaws.com/api";

export interface Game {
  slug: string;
  name: string;
  category: string;
  price: string;
  shortDescription: string;
  rating: number;
  likesCount: number;
  cardImage: string;
  featured: boolean;
}

export interface Player {
  rank: number;
  playerName: string;
  gamesPlayed: number;
  totalScore: number;
  streakDays: number;
  favoriteGameSlug: string;
  favoriteGameName: string;
}

export interface Category {
  slug: string;
  label: string;
  isDefault: boolean;
}

export interface TopRecord {
  position: number;
  playerName: string;
  score: number;
  achievedAt: string;
}

export interface GameDetails {
  slug: string;
  name: string;
  heroImage: string;
  rating: number;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  fullDescription: string;
  specs: {
    genre: string;
    players: string;
    duration: string;
    price: string;
  };
  topRecords: TopRecord[];
}

export interface GameComment {
  commentId: string;
  authorName: string;
  text: string;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface GamesResponse {
  data: Game[];
  meta: PaginationMeta;
}

export interface LeaderboardResponse {
  data: Player[];
  meta?: {
    totalItems?: number;
    description?: string;
  };
}

export interface CategoriesResponse {
  data: Category[];
}

export interface GameDetailsResponse {
  data: GameDetails;
}

export interface CommentsResponse {
  data: GameComment[];
  meta?: {
    totalItems?: number;
    totalPages?: number;
  };
}

export type GameSort = "rating-desc" | "rating-asc" | "name-asc" | "name-desc";

export interface GamesQuery {
  category?: string;
  sort?: GameSort;
  page?: number;
  limit?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new ApiError(
      `API request failed: ${response.status}`,
      response.status,
    );
  }

  return (await response.json()) as T;
}

export function getFeaturedGames(): Promise<GamesResponse> {
  return request<GamesResponse>("/games", {
    featured: true,
  });
}

export function getLeaderboard(): Promise<LeaderboardResponse> {
  return request<LeaderboardResponse>("/leaderboard");
}

export function getCategories(): Promise<CategoriesResponse> {
  return request<CategoriesResponse>("/categories");
}

export function getGames({
  category = "all",
  sort = "rating-desc",
  page = 1,
  limit = 6,
}: GamesQuery = {}): Promise<GamesResponse> {
  return request<GamesResponse>("/games", {
    category,
    sort,
    page,
    limit,
  });
}

export function getGameDetails(slug: string): Promise<GameDetailsResponse> {
  return request<GameDetailsResponse>(`/games/${encodeURIComponent(slug)}`);
}

export function getGameComments(slug: string): Promise<CommentsResponse> {
  return request<CommentsResponse>(
    `/games/${encodeURIComponent(slug)}/comments`,
    {
      limit: 3,
      sort: "newest",
    },
  );
}
