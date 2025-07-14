import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SearchEngine } from '@/lib/searchEngine';
import { PhotoRecord } from '@/lib/database';
import PhotoGrid from '@/components/PhotoGrid';
import { Button } from '@/components/ui/button';

const ShowPhotos: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [classifications, setClassifications] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const searchEngine = useMemo(() => new SearchEngine(), []);

  useEffect(() => {
    const fetchClassifications = async () => {
      const uniqueClassifications = await searchEngine.getUniqueClassifications();
      setClassifications(uniqueClassifications);
    };
    fetchClassifications();
  }, [searchEngine]);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      let photosToShow: PhotoRecord[];
      if (activeFilter === 'All') {
        photosToShow = await searchEngine.getAllPhotos();
      } else {
        photosToShow = await searchEngine.getPhotosByClassification(activeFilter);
      }
      setPhotos(photosToShow);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  }, [searchEngine, activeFilter]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handlePhotoDelete = (deletedPhotoId: number) => {
    setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== deletedPhotoId));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{activeFilter} Photos</h2>
        <span className="text-sm text-muted-foreground">
          {photos.length} photos
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={activeFilter === 'All' ? 'default' : 'outline'}
          onClick={() => setActiveFilter('All')}
        >
          All
        </Button>
        {classifications.filter(Boolean).map(classification => (
          <Button
            key={classification}
            variant={activeFilter === classification ? 'default' : 'outline'}
            onClick={() => setActiveFilter(classification)}
          >
            {classification}
          </Button>
        ))}
      </div>
      <PhotoGrid photos={photos} loading={loading} onPhotoDelete={handlePhotoDelete} />
    </div>
  );
};

export default ShowPhotos;
