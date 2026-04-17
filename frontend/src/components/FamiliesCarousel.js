import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const FamiliesCarousel = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        const response = await axios.get(`${API}/family-deliveries`);
        setImages(response.data);
      } catch (error) {
        console.error('Error fetching family deliveries:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFamilies();
  }, []);

  // Don't render if no images
  if (loading || images.length === 0) return null;

  // Duplicate images for seamless infinite scroll
  const duplicatedImages = [...images, ...images, ...images];

  return (
    <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="text-center">
          <h2 className="font-bold text-4xl md:text-5xl text-white mb-4">
            Families Catered <span className="text-orange-500">So Far</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Join the growing family of happy TruVant customers who found their perfect car
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-orange-500"></div>
            <span className="text-4xl font-bold text-orange-500">{images.length}+</span>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-orange-500"></div>
          </div>
        </div>
      </div>

      {/* Auto-scrolling carousel */}
      <div 
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        data-testid="families-carousel"
      >
        {/* Gradient overlays for smooth edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-900 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none"></div>

        <div 
          ref={scrollRef}
          className={`flex gap-4 ${isPaused ? 'animate-pause' : 'animate-scroll'}`}
          style={{
            '--scroll-duration': `${images.length * 4}s`,
          }}
        >
          {duplicatedImages.map((image, index) => (
            <div
              key={`${image.id}-${index}`}
              className="flex-shrink-0 w-64 h-48 md:w-80 md:h-56 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 group"
            >
              <div className="relative w-full h-full">
                <img
                  src={image.image_url}
                  alt={image.caption || 'Happy family'}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%231f2937" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dominant-baseline="middle" fill="%239ca3af" font-size="10">Image</text></svg>';
                  }}
                />
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-sm font-medium truncate">{image.caption}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom CSS for animation */}
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        
        .animate-scroll {
          animation: scroll var(--scroll-duration, 40s) linear infinite;
        }
        
        .animate-pause {
          animation: scroll var(--scroll-duration, 40s) linear infinite;
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};
