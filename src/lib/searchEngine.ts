import { db, PhotoRecord } from './database';

export class SearchEngine {
  async searchPhotos(query: string): Promise<PhotoRecord[]> {
    if (!query.trim()) {
      return await db.photos.orderBy('createdAt').reverse().limit(50).toArray();
    }

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    // Get all processed photos
    const allPhotos = await db.photos.where('processed').equals(1).toArray();
    
    // Score each photo based on description, filename, and extracted_text match
    const scoredPhotos = allPhotos.map(photo => {
      const description = photo.description.toLowerCase();
      const filename = photo.filename.toLowerCase();
      const extractedText = photo.extracted_text ? photo.extracted_text.toLowerCase() : '';
      let score = 0;
      let matchedTermsCount = 0;

      // Check for exact phrase match in any field
      if (description.includes(query.toLowerCase()) || filename.includes(query.toLowerCase()) || extractedText.includes(query.toLowerCase())) {
        score += 100;
        matchedTermsCount = searchTerms.length; // All terms considered matched if exact phrase is found
      } else {
        // Check individual terms in description, filename, and extracted_text
        searchTerms.forEach(term => {
          const termFoundInDescription = description.includes(term);
          const termFoundInFilename = filename.includes(term);
          const termFoundInExtractedText = extractedText.includes(term);

          if (termFoundInDescription || termFoundInFilename || termFoundInExtractedText) {
            matchedTermsCount++;
          }

          if (termFoundInDescription) {
            const termCount = (description.match(new RegExp(term, 'g')) || []).length;
            score += termCount * 10;
            if (description.includes(' ' + term) || description.startsWith(term)) {
              score += 5;
            }
          }
          if (termFoundInFilename) {
            score += 5; // Smaller bonus for term in filename
          }
          if (termFoundInExtractedText) {
            score += 15; // Higher bonus for term in extracted text
          }
        });
      }

      return { photo, score, matchedTermsCount };
    });

    // Filter: Only include photos where all search terms are matched and score is positive
    return scoredPhotos
      .filter(item => item.score > 0 && item.matchedTermsCount === searchTerms.length)
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

  async getAllPhotos(): Promise<PhotoRecord[]> {
    return await db.photos
      .where('processed')
      .equals(1)
      .reverse()
      .toArray();
  }

  async getPhotosByClassification(classification: string): Promise<PhotoRecord[]> {
    return await db.photos
      .where('classification')
      .equals(classification)
      .reverse()
      .toArray();
  }

  async getUniqueClassifications(): Promise<string[]> {
    const photos = await db.photos.toArray();
    const classifications = new Set(photos.map(p => p.classification));
    return Array.from(classifications);
  }
}