/// <reference types="google.maps" />

const GOOGLE_MAPS_API_KEY = 'AIzaSyAFcjjQ8OuE28K3SYA-aQe2hm04Gsru7Fk';

let isLoaded = false;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

export function getApiKey(): string {
  return GOOGLE_MAPS_API_KEY;
}

// Helper function to format duration in Hebrew
function formatDurationHebrew(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours} שעות ${minutes} דקות`;
  }
  return `${minutes} דקות`;
}

// Helper function to format distance in Hebrew
function formatDistanceHebrew(meters: number): string {
  const km = (meters / 1000).toFixed(1);
  return `${km} ק"מ`;
}

// Load Google Maps JavaScript API
export function loadGoogleMapsAPI(): Promise<void> {
  if (isLoaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      isLoaded = true;
      resolve();
      return;
    }

    isLoading = true;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=he`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
    };
    
    script.onerror = () => {
      isLoading = false;
      loadPromise = null;
      reject(new Error('Failed to load Google Maps API'));
    };
    
    document.head.appendChild(script);
  });

  return loadPromise;
}

export interface StopWithDrivingTime {
  stopId: string;
  address: string;
  drivingTime: string;
  drivingTimeSeconds: number;
  distance: string;
  distanceMeters: number;
  cumulativeSeconds?: number;
  estimatedArrival?: string;
}

export interface OptimizedRoute {
  totalDuration: string;
  totalDistance: string;
  optimizedOrder: number[];
  stopsWithTime: StopWithDrivingTime[];
}

// Get sequential driving times using Google Maps JavaScript API
export async function getSequentialDrivingTimes(
  startAddress: string,
  stops: { id: string; address: string }[]
): Promise<StopWithDrivingTime[]> {
  if (stops.length === 0) return [];

  await loadGoogleMapsAPI();

  const service = new google.maps.DistanceMatrixService();
  const results: StopWithDrivingTime[] = [];
  
  // Process in batches (API limit is 25 origins/destinations)
  const allAddresses = [startAddress, ...stops.map(s => s.address)];
  
  try {
    // Get distances from each point to the next
    for (let i = 0; i < stops.length; i++) {
      const origin = i === 0 ? startAddress : stops[i - 1].address;
      const destination = stops[i].address;

      const response = await new Promise<google.maps.DistanceMatrixResponse>((resolve, reject) => {
        service.getDistanceMatrix({
          origins: [origin],
          destinations: [destination],
          travelMode: google.maps.TravelMode.DRIVING,
        }, (response, status) => {
          if (status === 'OK' && response) {
            resolve(response);
          } else {
            reject(new Error(`Distance Matrix failed: ${status}`));
          }
        });
      });

      const element = response.rows[0]?.elements[0];
      if (element?.status === 'OK') {
        results.push({
          stopId: stops[i].id,
          address: stops[i].address,
          drivingTime: element.duration?.text || 'לא זמין',
          drivingTimeSeconds: element.duration?.value || 0,
          distance: element.distance?.text || 'לא זמין',
          distanceMeters: element.distance?.value || 0,
        });
      } else {
        results.push({
          stopId: stops[i].id,
          address: stops[i].address,
          drivingTime: 'לא זמין',
          drivingTimeSeconds: 0,
          distance: 'לא זמין',
          distanceMeters: 0,
        });
      }
    }

    // Calculate cumulative times and estimated arrivals
    let cumulativeSeconds = 0;
    const now = new Date();
    
    results.forEach(result => {
      cumulativeSeconds += result.drivingTimeSeconds;
      result.cumulativeSeconds = cumulativeSeconds;
      
      const arrivalTime = new Date(now.getTime() + cumulativeSeconds * 1000);
      result.estimatedArrival = arrivalTime.toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit'
      });
    });

    return results;
  } catch (error) {
    console.error('Failed to get driving times:', error);
    throw error;
  }
}

export async function optimizeRoute(
  origin: string,
  destinations: { id: string; address: string }[]
): Promise<OptimizedRoute | null> {
  if (destinations.length === 0) return null;

  await loadGoogleMapsAPI();

  const directionsService = new google.maps.DirectionsService();

  try {
    // For a single destination, no waypoints needed
    if (destinations.length === 1) {
      const response = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route({
          origin: origin,
          destination: destinations[0].address,
          travelMode: google.maps.TravelMode.DRIVING,
        }, (response, status) => {
          if (status === 'OK' && response) {
            resolve(response);
          } else {
            reject(new Error(`Directions failed: ${status}`));
          }
        });
      });

      const route = response.routes[0];
      const leg = route.legs[0];
      const now = new Date();
      const durationSeconds = leg.duration?.value || 0;
      const distanceMeters = leg.distance?.value || 0;
      const arrivalTime = new Date(now.getTime() + durationSeconds * 1000);

      return {
        totalDuration: formatDurationHebrew(durationSeconds),
        totalDistance: formatDistanceHebrew(distanceMeters),
        optimizedOrder: [0],
        stopsWithTime: [{
          stopId: destinations[0].id,
          address: destinations[0].address,
          drivingTime: formatDurationHebrew(durationSeconds),
          drivingTimeSeconds: durationSeconds,
          distance: formatDistanceHebrew(distanceMeters),
          distanceMeters: distanceMeters,
          cumulativeSeconds: durationSeconds,
          estimatedArrival: arrivalTime.toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit'
          }),
        }],
      };
    }

    // For multiple destinations, make ALL destinations waypoints
    // Set destination = origin (round trip) so Google optimizes ALL stops
    // Then we ignore the return leg
    const waypoints = destinations.map(d => ({
      location: d.address,
      stopover: true,
    }));

    console.log('Optimizing route with', destinations.length, 'destinations');
    console.log('Waypoints:', waypoints.length);

    const response = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
      directionsService.route({
        origin: origin,
        destination: origin, // Round trip - return to start
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
      }, (response, status) => {
        if (status === 'OK' && response) {
          resolve(response);
        } else {
          reject(new Error(`Directions failed: ${status}`));
        }
      });
    });

    const route = response.routes[0];
    // waypoint_order gives the optimized order of ALL waypoints
    const waypointOrder = route.waypoint_order || destinations.map((_, i) => i);
    
    console.log('Waypoint order from Google:', waypointOrder);
    console.log('Number of legs:', route.legs.length);
    
    let totalDurationSeconds = 0;
    let totalDistanceMeters = 0;
    const stopsWithTime: StopWithDrivingTime[] = [];
    
    // Calculate cumulative times
    let cumulativeSeconds = 0;
    const now = new Date();

    // Process only the legs that go to destinations (exclude the return leg)
    // legs.length = waypoints.length + 1 (includes return to origin)
    const legsToProcess = route.legs.slice(0, destinations.length);
    
    legsToProcess.forEach((leg, legIndex) => {
      const durationSeconds = leg.duration?.value || 0;
      const distanceMeters = leg.distance?.value || 0;
      
      totalDurationSeconds += durationSeconds;
      totalDistanceMeters += distanceMeters;
      cumulativeSeconds += durationSeconds;

      // Get the destination for this leg from waypointOrder
      const destIndex = waypointOrder[legIndex];
      const stop = destinations[destIndex];

      console.log(`Leg ${legIndex}: destIndex=${destIndex}, stop=`, stop?.id);

      const arrivalTime = new Date(now.getTime() + cumulativeSeconds * 1000);

      if (stop) {
        stopsWithTime.push({
          stopId: stop.id,
          address: stop.address,
          drivingTime: formatDurationHebrew(durationSeconds),
          drivingTimeSeconds: durationSeconds,
          distance: formatDistanceHebrew(distanceMeters),
          distanceMeters: distanceMeters,
          cumulativeSeconds: cumulativeSeconds,
          estimatedArrival: arrivalTime.toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit'
          }),
        });
      }
    });

    console.log('Stops with time:', stopsWithTime.length);

    const hours = Math.floor(totalDurationSeconds / 3600);
    const minutes = Math.floor((totalDurationSeconds % 3600) / 60);
    const totalDuration = hours > 0 ? `${hours} שעות ${minutes} דקות` : `${minutes} דקות`;
    
    const km = (totalDistanceMeters / 1000).toFixed(1);
    const totalDistance = `${km} ק"מ`;

    return {
      totalDuration,
      totalDistance,
      optimizedOrder: waypointOrder,
      stopsWithTime,
    };
  } catch (error) {
    console.error('Failed to optimize route:', error);
    throw error;
  }
}

export function openGoogleMapsNavigation(addresses: string[]): void {
  if (addresses.length === 0) return;
  
  if (addresses.length === 1) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addresses[0])}`, '_blank');
    return;
  }

  const origin = addresses[0];
  const destination = addresses[addresses.length - 1];
  const waypoints = addresses.slice(1, -1).map(a => encodeURIComponent(a)).join('|');
  
  let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
  if (waypoints) {
    url += `&waypoints=${waypoints}`;
  }
  
  window.open(url, '_blank');
}

export function openWazeNavigation(address: string): void {
  window.open(`https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`, '_blank');
}

// Type declarations for Google Maps
declare global {
  interface Window {
    google: typeof google;
  }
}
