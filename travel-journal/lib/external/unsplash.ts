const UNSPLASH_BASE_URL = 'https://api.unsplash.com';

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

export async function searchPhotos(
  query: string,
  perPage: number = 1
): Promise<UnsplashPhoto[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    console.warn('UNSPLASH_ACCESS_KEY is not set');
    return [];
  }

  try {
    const response = await fetch(
      `${UNSPLASH_BASE_URL}/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) {
      console.error('Unsplash API error:', response.status);
      return [];
    }

    const data: UnsplashSearchResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error('Unsplash fetch error:', error);
    return [];
  }
}

export async function getDestinationImage(
  destinationName: string,
  country: string
): Promise<{ imageURL: string; imageAttribution: string } | null> {
  const photos = await searchPhotos(`${destinationName} ${country} travel`, 1);

  if (photos.length === 0) {
    const fallback = await searchPhotos(destinationName, 1);
    if (fallback.length === 0) return null;

    return {
      imageURL: fallback[0].urls.regular,
      imageAttribution: `Photo by ${fallback[0].user.name} on Unsplash`,
    };
  }

  return {
    imageURL: photos[0].urls.regular,
    imageAttribution: `Photo by ${photos[0].user.name} on Unsplash`,
  };
}
