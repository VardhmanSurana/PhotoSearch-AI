import { useState, useEffect } from 'react';
import { SearchEngine } from '@/lib/searchEngine';
import { PhotoRecord } from '@/lib/database';
import { SearchBar } from '@/components/SearchBar';
import { FolderUpload } from '@/components/FolderUpload';
import { PhotoGrid } from '@/components/PhotoGrid';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Upload, Search as SearchIcon, TestTube } from 'lucide-react';
import { ConnectionTest } from '@/components/ConnectionTest';
import { PerformanceManager } from '@/lib/performance';

const Index = () => {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchEngine = new SearchEngine();

  useEffect(() => {
    loadRecentPhotos();
  }, []);

  const loadRecentPhotos = async () => {
    setLoading(true);
    try {
      const recentPhotos = await searchEngine.getRecentPhotos();
      setPhotos(recentPhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = PerformanceManager.debounce(async (query: string) => {
    setLoading(true);
    try {
      const searchResults = await searchEngine.searchPhotos(query);
      setPhotos(searchResults);
    } catch (error) {
      console.error('Error searching photos:', error);
    } finally {
      setLoading(false);
    }
  }, 300);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Image className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">PhotoSearch AI</h1>
            </div>
            <Button onClick={loadRecentPhotos} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-8">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <SearchIcon className="w-4 h-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Test
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <SearchBar 
                onSearch={handleSearch}
                placeholder="Search photos by description, objects, people..."
                className="w-full"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  {searchQuery ? `Search Results for "${searchQuery}"` : 'Recent Photos'}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {photos.length} photos
                </span>
              </div>
              <PhotoGrid photos={photos} loading={loading} />
            </div>
          </TabsContent>

          <TabsContent value="upload">
            <FolderUpload />
          </TabsContent>

          <TabsContent value="test">
            <ConnectionTest />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
