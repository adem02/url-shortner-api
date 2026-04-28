export interface ShortenUrlInputDTO {
  url: string;
}

export interface ShortenUrlOutputDTO {
  success: true;
  data: ShortenUrlInterface;
}

export interface ShortenUrlInterface {
  code: string;
  shortUrl: string;
  longUrl: string;
  statsUrl: string;
  createdAt: Date;
}

export interface CreateLinkData {
  code: string;
  longUrl: string;
  createAt: Date;
}
