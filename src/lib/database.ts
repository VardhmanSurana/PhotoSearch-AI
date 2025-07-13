import Dexie, { Table } from 'dexie';

export interface PhotoRecord {
  id?: number;
  path: string;
  description: string;
  classification: string;
  extracted_text: string;
  folderId: string;
  filename: string;
  size: number;
  lastModified: number;
  thumbnail?: string;
  processed: number; // 0 = false, 1 = true for IndexedDB compatibility
  createdAt: Date;
}

export interface FolderRecord {
  id?: number;
  name: string;
  path: string;
  photoCount: number;
  lastScanned: Date;
  thumbnail?: string;
}

export class PhotoSearchDB extends Dexie {
  photos!: Table<PhotoRecord>;
  folders!: Table<FolderRecord>;

  constructor() {
    super('PhotoSearchDB');
    this.version(3).stores({
      photos: '++id, path, folderId, filename, processed, createdAt, classification, extracted_text',
      folders: '++id, name, path, lastScanned'
    });
  }

  async deletePhoto(id: number): Promise<void> {
    await this.photos.delete(id);
  }
}

export const db = new PhotoSearchDB();