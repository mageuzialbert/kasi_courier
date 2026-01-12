'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Building2 } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  logo_url: string | null;
}

interface BusinessPartnersProps {
  businesses: Business[];
  totalBusinesses: number;
  totalDeliveries: number;
}

export default function BusinessPartners({ businesses, totalBusinesses, totalDeliveries }: BusinessPartnersProps) {
  // Limit displayed businesses to 20
  const displayBusinesses = businesses.slice(0, 20);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Statistics */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Who We Work With
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Trusted by businesses across Tanzania
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                {totalBusinesses}+
              </div>
              <div className="text-gray-600">Businesses</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                {totalDeliveries}+
              </div>
              <div className="text-gray-600">Deliveries</div>
            </div>
          </div>
        </div>

        {/* Business Logos Grid */}
        {displayBusinesses.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {displayBusinesses.map((business) => (
              <div
                key={business.id}
                className="bg-gray-50 rounded-lg p-4 flex items-center justify-center h-24 md:h-32 hover:bg-gray-100 transition-colors"
              >
                {business.logo_url ? (
                  <Image
                    src={business.logo_url}
                    alt={business.name}
                    width={120}
                    height={80}
                    className="object-contain max-w-full max-h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Building2 className="w-8 h-8 mb-2" />
                    <span className="text-xs text-center">{business.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No business logos available yet</p>
          </div>
        )}
      </div>
    </section>
  );
}
