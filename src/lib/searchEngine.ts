import { db, PhotoRecord } from './database';

export class SearchEngine {
  async searchPhotos(query: string): Promise<PhotoRecord[]> {
    if (!query.trim()) {
      return await db.photos.orderBy('createdAt').reverse().limit(50).toArray();
    }

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    // Get all processed photos
    const allPhotos = await db.photos.where('processed').equals(1).toArray();
    
    // Score each photo based on description match
    const scoredPhotos = allPhotos.map(photo => {
      const description = photo.description.toLowerCase();
      let score = 0;
      
      // Exact phrase match gets highest score
      if (description.includes(query.toLowerCase())) {
        score += 100;
      }
      
      // Individual term matches
      searchTerms.forEach(term => {
        const termCount = (description.match(new RegExp(term, 'g')) || []).length;
        score += termCount * 10;
        
        // Bonus for term at start of words
        if (description.includes(' ' + term) || description.startsWith(term)) {
          score += 5;
        }
      });
      
      // Filename match bonus
      if (photo.filename.toLowerCase().includes(query.toLowerCase())) {
        score += 20;
      }
      
      return { photo, score };
    });
    
    // Filter and sort by score
    return scoredPhotos
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.photo)
      .slice(0, 100);
  }

  async getRecentPhotos(limit: number = 20): Promise<PhotoRecord[]> {
    return await db.photos
      .where('processed')
      .equals(1)
      .reverse()
      .limit(limit)
      .toArray();
  }

  async getPhotosByFolder(folderId: string): Promise<PhotoRecord[]> {
    return await db.photos
      .where('folderId')
      .equals(folderId)
      .toArray();
  }
}