import { LinkRepository } from '../../src/repositories/link.repository';
import { ClickRepository } from '../../src/repositories/click.repository';

const linkRepo = new LinkRepository();
const clickRepo = new ClickRepository();

export interface CreateLinkFixture {
  code?: string;
  longUrl?: string;
  createdAt?: Date;
}

export interface CreateClickFixture {
  linkId: string;
  country?: string | null;
  device?: 'mobile' | 'desktop' | 'tablet';
  browser?: string | null;
  clickedAt?: Date;
}

let codeCounter = 0;

function uniqueCode(): string {
  codeCounter++;
  return `tst${String(codeCounter).padStart(3, '0')}`;
}

export async function createLink(overrides: CreateLinkFixture = {}): Promise<{ id: string; code: string; longUrl: string }> {
  const code = overrides.code ?? uniqueCode();
  const longUrl = overrides.longUrl ?? 'https://example.com';
  const createdAt = overrides.createdAt ?? new Date();

  const id = await linkRepo.create({ code, longUrl, createAt: createdAt });

  return { id, code, longUrl };
}

export async function createClick(overrides: CreateClickFixture): Promise<void> {
  await clickRepo.create({
    linkId: overrides.linkId,
    country: overrides.country ?? null,
    device: overrides.device ?? 'desktop',
    browser: overrides.browser ?? null,
    clickedAt: overrides.clickedAt ?? new Date(),
  });
}

export async function createLinkWithClicks(
  linkOverrides: CreateLinkFixture = {},
  clicks: Omit<CreateClickFixture, 'linkId'>[],
): Promise<{ id: string; code: string; longUrl: string }> {
  const link = await createLink(linkOverrides);

  for (const click of clicks) {
    await createClick({ ...click, linkId: link.id });
  }

  return link;
}
