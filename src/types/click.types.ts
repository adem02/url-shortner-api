export interface RedirectToUrlByCodeParams {
  code: string;
}

export interface SaveClickDataPayload {
  linkId: string;
  country: string | null;
  device: string | null;
  browser: string | null;
  clickedAt: Date;
}

export interface GetShortenUrlStatsParams {
  code: string;
}

export interface StatsLink {
  code: string;
  longUrl: string;
  shortUrl: string;
  createdAt: Date;
}

export interface StatsDevices {
  mobile: number;
  desktop: number;
  tablet: number;
}

export interface ClicksPerHour {
  hour: string;
  clicks: number;
}

export interface StatsCountry {
  country: string;
  clicks: number;
  percentage: number;
}

export interface RecentClick {
  timestamp: string;
  country: string;
  device: keyof StatsDevices;
  browser: string;
}

export interface GetShortenUrlStatsOutputDTO {
  success: boolean;
  data: {
    link: StatsLink;
    stats: ClickStats;
  };
}

export interface ClickStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  clicksPerHour: ClicksPerHour[];
  topCountries: StatsCountry[];
  devices: StatsDevices;
  recentClicks: RecentClick[];
}

export interface ClicksMetrics {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}
