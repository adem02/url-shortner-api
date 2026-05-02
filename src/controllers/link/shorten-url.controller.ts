import { linkRepository } from '@/repositories/link.repository';
import { ShortenUrlService } from '@/services/shorten-url.service';
import { UrlValidator } from '@/services/validator/url-validator';
import { ShortenUrlInputDTO, ShortenUrlOutputDTO } from '@/types/link.types';
import { Request, Response, NextFunction } from 'express';

export const ShortenLinkController = async (
  req: Request<object, object, ShortenUrlInputDTO>,
  res: Response<ShortenUrlOutputDTO>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { url } = req.body;

    UrlValidator.validate(url);

    const shortenService = new ShortenUrlService(linkRepository);
    const shortenedUrl = await shortenService.shortenUrl(url);

    res.status(201).send({
      success: true,
      data: shortenedUrl,
    });
  } catch (error) {
    next(error);
  }
};
