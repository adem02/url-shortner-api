import { UrlValidator } from '../../src/services/validator/url-validator';
import { describe, it, expect } from 'vitest';

describe('Url Validator Class', () => {
  it('should throw exception if url is empty', () => {
    expect(() => UrlValidator.validate('')).toThrow('URL cannot be empty');
  });

  it('should throw exception if url is too long', () => {
    const longUrl = 'http://example.com/' + 'a'.repeat(2048);
    expect(() => UrlValidator.validate(longUrl)).toThrow('URL too long (max 2048)');
  });

  it('should throw exception if url does not start with http:// or https://', () => {
    expect(() => UrlValidator.validate('ftp://example.com')).toThrow('URL must start with http:// or https://');
    expect(() => UrlValidator.validate('example.com')).toThrow('URL must start with http:// or https://');
  });

  it('should throw exception if url has invalid format', () => {
    expect(() => UrlValidator.validate('http://')).toThrow('Invalid URL format');
  });

  describe('SSRF protection — blacklisted domains and IP ranges', () => {
    it('should throw exception if url contains credentials', () => {
      expect(() => UrlValidator.validate('http://user:pass@example.com')).toThrow('Credentials in URL are not allowed');
    });
    
    it('blocks localhost', () => {
      expect(() => UrlValidator.validate('http://localhost')).toThrow('This domain/IP is not allowed');
      expect(() => UrlValidator.validate('http://localhost:3000')).toThrow('This domain/IP is not allowed');
    });

    it('blocks .localhost subdomains', () => {
      expect(() => UrlValidator.validate('http://api.localhost')).toThrow('This domain/IP is not allowed');
    });

    it('blocks 127.0.0.1 and 127.x.x.x range', () => {
      expect(() => UrlValidator.validate('http://127.0.0.1')).toThrow('This domain/IP is not allowed');
      expect(() => UrlValidator.validate('http://127.0.0.2')).toThrow('This domain/IP is not allowed');
    });

    it('blocks 0.0.0.0', () => {
      expect(() => UrlValidator.validate('http://0.0.0.0')).toThrow('This domain/IP is not allowed');
    });

    it('blocks 10.x.x.x range', () => {
      expect(() => UrlValidator.validate('http://10.0.0.1')).toThrow('This domain/IP is not allowed');
      expect(() => UrlValidator.validate('http://10.255.255.255')).toThrow('This domain/IP is not allowed');
    });

    it('blocks 192.168.x.x range', () => {
      expect(() => UrlValidator.validate('http://192.168.1.1')).toThrow('This domain/IP is not allowed');
      expect(() => UrlValidator.validate('http://192.168.0.1')).toThrow('This domain/IP is not allowed');
    });

    it('blocks 172.16.x.x — 172.31.x.x range', () => {
      expect(() => UrlValidator.validate('http://172.16.0.1')).toThrow('This domain/IP is not allowed');
      expect(() => UrlValidator.validate('http://172.31.255.255')).toThrow('This domain/IP is not allowed');
    });

    it('blocks 169.254.x.x range (APIPA)', () => {
      expect(() => UrlValidator.validate('http://169.254.0.1')).toThrow('This domain/IP is not allowed');
    });
  });

  describe('valid URLs', () => {
    it('accepts standard http and https URLs', () => {
      expect(() => UrlValidator.validate('https://www.example.com')).not.toThrow();
      expect(() => UrlValidator.validate('http://www.example.com')).not.toThrow();
    });

    it('accepts URLs with path, query and fragment', () => {
      expect(() => UrlValidator.validate('https://example.com/path?query=string#fragment')).not.toThrow();
    });

    it('accepts URLs with port', () => {
      expect(() => UrlValidator.validate('https://example.com:8080/path')).not.toThrow();
    });
  });
});