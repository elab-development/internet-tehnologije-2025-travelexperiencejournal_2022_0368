interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export async function geocodeDestination(
  name: string,
  country: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const query = encodeURIComponent(`${name}, ${country}`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'TravelJournal/1.0 (student project)',
        },
        next: { revalidate: 86400 }, // keš 24h
      }
    );

    if (!response.ok) {
      console.error('Nominatim error:', response.status);
      return null;
    }

    const results: NominatimResult[] = await response.json();

    if (results.length === 0) {
      console.warn(`Geocoding: nema rezultata za "${name}, ${country}"`);
      return null;
    }

    return {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
