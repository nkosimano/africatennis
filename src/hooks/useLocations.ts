import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Location {
  id: string;
  name: string;
  address: string;
  court_surface: string;
  number_of_courts: number | null;
  latitude: number;
  longitude: number;
}

interface LocationResponse {
  id: string;
  name: string;
  address: string;
  court_surface: string;
  number_of_courts: number | null;
  latitude: number;
  longitude: number;
}

function isValidLocation(data: any): data is LocationResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.address === 'string' &&
    typeof data.court_surface === 'string' &&
    (data.number_of_courts === null || typeof data.number_of_courts === 'number') &&
    typeof data.latitude === 'number' &&
    typeof data.longitude === 'number'
  );
}

function validateLocationsData(data: any[]): LocationResponse[] {
  return data.filter((item): item is LocationResponse => {
    const isValid = isValidLocation(item);
    if (!isValid) {
      console.error('Invalid location data:', item);
    }
    return isValid;
  });
}

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('locations')
        .select('*')
        .order('name');

      if (fetchError) {
        throw new Error(
          fetchError.message === 'Failed to fetch'
            ? 'Unable to load locations. Please check your internet connection.'
            : `Error loading locations: ${fetchError.message}`
        );
      }

      if (!data || !Array.isArray(data)) {
        throw new Error('No locations data received from the server');
      }

      const validatedData = validateLocationsData(data);
      setLocations(validatedData);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while loading locations'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  return {
    locations,
    loading,
    error,
    refresh: fetchLocations
  };
}