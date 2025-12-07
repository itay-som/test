import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { loadGoogleMapsAPI } from '@/services/googleMaps';
import { MapPin, Loader2 } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({ 
  value, 
  onChange, 
  placeholder = "הזן כתובת...",
  className 
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initAutocomplete = async () => {
      try {
        await loadGoogleMapsAPI();
        
        if (!mounted || !inputRef.current) return;

        // Create autocomplete instance
        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'il' }, // Restrict to Israel
          fields: ['formatted_address', 'geometry', 'name', 'address_components'],
          types: ['address'],
        });

        // Listen for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) {
            onChange(place.formatted_address, place);
          } else if (place?.name) {
            onChange(place.name, place);
          }
        });

        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize Google Places Autocomplete:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAutocomplete();

    return () => {
      mounted = false;
      // Cleanup autocomplete listeners
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
        {isLoading ? (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
        ) : (
          <MapPin className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`pr-10 ${className || ''}`}
        disabled={isLoading}
      />
    </div>
  );
}
