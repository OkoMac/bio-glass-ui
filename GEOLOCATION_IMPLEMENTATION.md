# BION Geolocation Implementation Guide

## Overview

A complete geolocation system for BION that enables:
- User location detection via browser geolocation API
- Provider address geocoding to coordinates (using OpenStreetMap)
- Real distance calculations between user and providers
- Location-based provider filtering and sorting
- Caching for improved performance

## Components

### 1. **useGeolocation Hook** (`src/hooks/useGeolocation.ts`)
Provides user's current location coordinates and error handling.

**Features:**
- Browser geolocation API integration
- High accuracy option
- Error handling with user-friendly messages
- Location refresh capability
- Watch location for continuous tracking

**Usage:**
```typescript
import { useGeolocation } from '@/hooks/useGeolocation';

const MyComponent = () => {
  const { coordinates, error, isLoading, refreshLocation } = useGeolocation();
  
  if (isLoading) return <p>Getting location...</p>;
  if (error) return <p>Error: {error}</p>;
  
  return (
    <div>
      <p>Your location: {coordinates?.latitude}, {coordinates?.longitude}</p>
      <button onClick={refreshLocation}>Refresh</button>
    </div>
  );
};
```

### 2. **Geocoding Service** (`src/lib/geocoding.ts`)
Converts addresses to coordinates using OpenStreetMap Nominatim API.

**Features:**
- Free, no API key required
- Batch geocoding support
- Automatic caching (30 days)
- LocalStorage persistence
- Accuracy levels (rooftop, range_interpolated, geometric_center, approximate)

**Usage:**
```typescript
import { geocodingService } from '@/lib/geocoding';

// Geocode single address
const coords = await geocodingService.geocodeAddress(
  '123 Main St',
  'Pretoria'
);

// Batch geocoding
const results = await geocodingService.geocodeBatch([
  { address: '123 Main St', city: 'Pretoria', providerId: 'p1' },
  { address: '456 Oak Ave', city: 'Johannesburg', providerId: 'p2' },
]);
```

### 3. **Provider Geolocation Library** (`src/lib/providerGeolocation.ts`)
High-level API for provider distance calculations and filtering.

**Key Functions:**

#### `enrichProvidersWithDistance()`
Adds distance data to providers.
```typescript
const providersWithDistance = await enrichProvidersWithDistance(
  providers,
  { latitude: -25.7479, longitude: 28.2293 }
);
```

#### `getNearestProviders()`
Get providers within radius, sorted by distance.
```typescript
const nearest = await getNearestProviders(
  providers,
  userLocation,
  radiusKm = 50,
  maxResults = 10
);
```

#### `filterProvidersByDistance()`
Filter providers by distance radius.
```typescript
const nearby = await filterProvidersByDistance(
  providers,
  userLocation,
  50 // km radius
);
```

### 4. **useProviderDistance Hook** (`src/hooks/useProviderDistance.ts`)
High-level React hook combining geolocation + provider distance calculations.

**Usage:**
```typescript
import { useProviderDistance } from '@/hooks/useProviderDistance';

const ProviderList = ({ providers }) => {
  const { 
    providers: nearestProviders, 
    isLoading, 
    error, 
    stats,
    refresh 
  } = useProviderDistance(providers, {
    radiusKm: 50,
    maxResults: 10,
    autoSort: true
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <p>Showing {nearestProviders.length} providers within {stats?.averageDistance}km</p>
      {nearestProviders.map(provider => (
        <ProviderCard
          key={provider.id}
          {...provider}
          distance={provider.distanceFormatted}
        />
      ))}
      <button onClick={refresh}>Find nearby</button>
    </div>
  );
};
```

## Integration Examples

### Example 1: Enhanced Provider Search Page

```typescript
import { useProviderDistance } from '@/hooks/useProviderDistance';
import allProviders from '@/data/bion_pretoria_data.json';

export default function SearchPage() {
  const { 
    providers, 
    isLoading, 
    error, 
    stats,
    refresh 
  } = useProviderDistance(allProviders.providers);

  return (
    <div className="space-y-4">
      <h1>Providers Near You</h1>
      
      {stats && (
        <div className="bg-blue-50 p-4 rounded">
          <p>Found {stats.providersCount} providers</p>
          <p>Average distance: {stats.averageDistance}km</p>
          {stats.nearestProvider && (
            <p>Nearest: {stats.nearestProvider.name} ({stats.nearestProvider.distanceFormatted})</p>
          )}
        </div>
      )}

      {isLoading && <p>Calculating distances...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map(provider => (
          <ProviderCard
            key={provider.id}
            {...provider}
            distance={provider.distanceFormatted}
          />
        ))}
      </div>

      <button 
        onClick={refresh}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Refresh Location
      </button>
    </div>
  );
}
```

### Example 2: Filter by Service & Distance

```typescript
import { useProviderDistance } from '@/hooks/useProviderDistance';
import allProviders from '@/data/bion_pretoria_data.json';

export default function ServicePage({ service = 'Physiotherapy' }) {
  const serviceProviders = allProviders.providers.filter(
    p => p.service === service
  );

  const { providers, stats } = useProviderDistance(serviceProviders, {
    radiusKm: 25,
    maxResults: 5,
    autoSort: true
  });

  return (
    <div>
      <h1>{service} Providers Nearby</h1>
      {stats && (
        <p>{stats.providersCount} {service} providers within 25km</p>
      )}
      {/* Render providers */}
    </div>
  );
}
```

## How Distance Calculation Works

### Algorithm: Haversine Formula

The system uses the Haversine formula to calculate great-circle distance between two coordinates:

```
a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
c = 2 ⋅ atan2(√a, √(1−a))
d = R ⋅ c

Where:
- φ is latitude, λ is longitude, R is earth's radius (6,371 km)
```

### Accuracy Levels

- **Rooftop** (importance > 0.8): Building-level precision
- **Range Interpolated** (importance > 0.6): Street segment precision
- **Geometric Center** (importance > 0.4): Administrative boundary precision
- **Approximate** (importance ≤ 0.4): Approximate location (city center fallback)

## Performance Optimization

### Caching Strategy

1. **Browser Cache**: 30-day validity for each address
2. **LocalStorage**: Persistent cache across sessions
3. **Batch Operations**: Geocode multiple addresses in single batch
4. **Preloading**: Background geocoding of provider addresses

```typescript
import { preloadProviderCoordinates } from '@/lib/providerGeolocation';

// Preload all provider coordinates on app startup
useEffect(() => {
  preloadProviderCoordinates(allProviders.providers);
}, []);
```

## Data Structure

### Provider (Original)
```typescript
{
  id: string;
  name: string;
  address: string;
  location: string;
  service: string;
  rating: number;
  reviewCount: number;
  price: string;
  // ... other fields
}
```

### ProviderWithDistance (Enhanced)
```typescript
{
  ...Provider,
  distance: number;           // in km
  distanceFormatted: string;  // e.g., "12.5km", "500m"
  coordinates?: {             // optional
    latitude: number;
    longitude: number;
    accuracy: string;
  }
}
```

## Integration with MCP Server

The MCP server can now use these utilities for accurate distance calculations:

```typescript
import { enrichProvidersWithDistance } from '@/lib/providerGeolocation';

// In MCP search handler
const providers = await providerService.searchProviders(query);
const enriched = await enrichProvidersWithDistance(
  providers,
  userLocation
);
```

## Testing Locations (South Africa)

Pre-configured city coordinates for quick testing:
- Pretoria: -25.7479, 28.2293
- Johannesburg: -26.2041, 28.0473
- Cape Town: -33.9249, 18.4241
- Durban: -29.8587, 31.0218
- Bloemfontein: -29.0852, 26.1596
- Port Elizabeth: -33.9608, 25.6022

## Browser Compatibility

- ✅ Chrome/Edge 51+
- ✅ Firefox 24+
- ✅ Safari 10+
- ✅ Opera 38+
- ❌ IE 11 (no native geolocation)

## Security & Privacy

- User location only accessed with explicit permission
- User can deny location access (falls back to manual location)
- Coordinates stored locally only, never sent to server without user action
- OpenStreetMap Nominatim respects user privacy (no tracking)

## Future Enhancements

- [ ] Map visualization (Leaflet or Mapbox)
- [ ] Real-time location tracking
- [ ] Location history
- [ ] Geofencing for notifications
- [ ] Route optimization
- [ ] Traffic-aware distance estimates
- [ ] Integration with booking system