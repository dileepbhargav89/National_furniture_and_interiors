import { describe, it, expect, vi } from 'vitest';
import {
  GenerateUploadSignature,
  ConfirmUpload,
  ListMediaByOwner,
} from '../../../src/modules/media/application/media.use-cases';
import type { IMediaService, IMediaAssetRepository } from '../../../src/modules/media/application/ports';
import type { MediaAsset } from '../../../src/modules/media/domain/media.types';

function makeMediaService(overrides: Partial<IMediaService> = {}): IMediaService {
  return {
    generateSignature: vi.fn().mockReturnValue({
      timestamp: 123456789,
      signature: 'sig',
      apiKey: 'key',
      cloudName: 'cloud',
      folder: 'folder',
    }),
    deleteFile: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function makeMediaAssetRepo(overrides: Partial<IMediaAssetRepository> = {}): IMediaAssetRepository {
  return {
    create: vi.fn().mockResolvedValue({ id: 'media-1', url: 'test.jpg' } as MediaAsset),
    findByOwner: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe('GenerateUploadSignature', () => {
  it('generates a signature scoped to a specific folder', () => {
    const service = makeMediaService();
    const uc = new GenerateUploadSignature(service);

    const result = uc.execute({ ownerType: 'PRODUCT', ownerId: 'prod-1' });

    expect(result.signature).toBe('sig');
    expect(service.generateSignature).toHaveBeenCalledWith('nfi/product/prod-1');
  });
});

describe('ConfirmUpload', () => {
  it('persists a new media asset', async () => {
    const repo = makeMediaAssetRepo();
    const uc = new ConfirmUpload(repo);

    const result = await uc.execute({
      url: 'https://cdn/test.jpg',
      publicId: 'test.jpg',
      originalFilename: 'test.jpg',
      format: 'jpg',
      bytes: 1024,
      ownerType: 'PRODUCT',
      ownerId: 'prod-1',
    });

    expect(result.id).toBe('media-1');
    expect(repo.create).toHaveBeenCalledOnce();
  });
});

describe('ListMediaByOwner', () => {
  it('finds assets by owner', async () => {
    const repo = makeMediaAssetRepo({
      findByOwner: vi.fn().mockResolvedValue([{ id: 'media-1' } as MediaAsset]),
    });
    const uc = new ListMediaByOwner(repo);

    const result = await uc.execute('PRODUCT', 'prod-1');

    expect(result).toHaveLength(1);
    expect(repo.findByOwner).toHaveBeenCalledWith('PRODUCT', 'prod-1');
  });
});
