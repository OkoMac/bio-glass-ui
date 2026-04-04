/**
 * Example Component: Location-Based Provider List
 * 
 * This demonstrates how to use the geolocation system in a real BION component.
 * Shows providers sorted by distance from user's current location.
 */

import { useState } from 'react';
import { useProviderDistance } from '@/hooks/useProviderDistance';
import { MapPin, Navigation, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import ProviderCard from './ProviderCard';

interface LocationBasedProviderListProps {
  providers: Array<{
    id: string;
    name: string;
    specialty: string;
    rating: number;
    reviews: number;
    image: string;
    vertical: "indigo" | "teal" | "coral" | "amber";
    service: string;
    address: string;
    location: string;
    price: string;
    isFree?: boolean;
  }>;
  radiusKm?: number;
  maxResults?: number;
  title?: string;
}

export default function LocationBasedProviderList({
  providers,
  radiusKm = 50,
  maxResults = 10,
  title = "Providers Near You"
}: LocationBasedProviderListProps) {
  const {
    providers: nearbyProviders,
    isLoading,
    error,
    stats,
    refresh
  } = useProviderDistance(providers, {
    radiusKm,
    maxResults,
    autoSort: true
  });

  const [showStatistics, setShowStatistics] = useState(true);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Searching...' : 'Refresh'}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Location Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <p className="text-xs text-red-600 mt-2">
              Make sure location services are enabled in your browser settings.
            </p>
          </div>
        </div>
      )}

      {/* Statistics */}
      {stats && showStatistics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <p className="text-xs text-blue-600 font-medium">PROVIDERS FOUND</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              {stats.providersCount}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <p className="text-xs text-green-600 font-medium">AVG DISTANCE</p>
            <p className="text-2xl font-bold text-green-900 mt-1">
              {stats.averageDistance}km
            </p>
          </div>

          {stats.nearestProvider && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <p className="text-xs text-purple-600 font-medium">NEAREST</p>
              <p className="text-sm font-bold text-purple-900 mt-1">
                {stats.nearestProvider.name}
              </p>
              <p className="text-xs text-purple-600 mt-0.5">
                {stats.nearestProvider.distanceFormatted}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && nearbyProviders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">
            <Navigation className="w-4 h-4 inline mr-2" />
            Finding providers near you...
          </p>
          <p className="text-xs text-gray-500">Using your current location</p>
        </div>
      )}

      {/* Providers Grid */}
      {nearbyProviders.length > 0 && (
        <div className="space-y-3">
          {nearbyProviders.map((provider) => (
            <div key={provider.id} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-200 transition-colors">
              {/* Provider Avatar/Image */}
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {provider.name.charAt(0)}
              </div>

              {/* Provider Info */}
              <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                    <p className="text-sm text-gray-600">{provider.service}</p>
                  </div>
                  
                  {/* Distance Badge */}
                  <div className="flex-shrink-0 text-right">
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      <MapPin className="w-3 h-3" />
                      {provider.distanceFormatted}
                    </div>
                  </div>
                </div>

                {/* Rating and Price */}
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-yellow-500">★ {provider.rating}</span>
                  <span className="text-gray-600">{provider.price}</span>
                  {provider.location && (
                    <span className="text-gray-500 text-xs">{provider.location}</span>
                  )}
                </div>
              </div>

              {/* CTA Button */}
              <button className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                View
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && nearbyProviders.length === 0 && !error && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-1">No providers found</h3>
          <p className="text-gray-600 text-sm mb-4">
            No providers available within {radiusKm}km of your location
          </p>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-xs text-gray-500 text-center pt-4">
        <p>Distances calculated from your current location</p>
        <p>Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}