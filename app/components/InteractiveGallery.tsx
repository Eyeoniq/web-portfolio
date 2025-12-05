'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Maximize, Minimize } from 'lucide-react';
import type { GalleryItem, GallerySubItem } from '@/app/lib/gallery-types';

const getMediaType = (filename: string): 'image' | 'video' | 'gif' => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) {
    return 'video';
  }
  if (['gif'].includes(ext)) {
    return 'gif';
  }
  return 'image';
};
interface InteractiveGalleryProps {
  gallery?: GalleryItem[];
  isDarkMode: boolean;
  folder?: string;
  maintainAspectRatio?: boolean;
  subfolderColumns?: number;
}

export function InteractiveGallery({ gallery: initialGallery, isDarkMode, folder, maintainAspectRatio = false, subfolderColumns = 2 }: InteractiveGalleryProps) {
  const [gallery, setGallery] = useState<GalleryItem[]>(initialGallery || []);
  const [loading, setLoading] = useState(!initialGallery);
  const [selectedFolder, setSelectedFolder] = useState<GalleryItem | null>(null);
  const [selectedSubItem, setSelectedSubItem] = useState<GallerySubItem | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialGallery) {
      const url = folder ? `/api/gallery?folder=${folder}` : '/api/gallery';
      fetch(url)
        .then(res => res.json())
        .then(data => {
          setGallery(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading gallery:', err);
          setLoading(false);
        });
    }
  }, [initialGallery, folder]);

  const getThumbnail = (item: GalleryItem): string => {
    // Try to find thumb.png in the folder
    for (const subItem of item.items) {
        if ((subItem.type === 'image' || subItem.type === 'gif') && subItem.name === 'thumb.png') {
        return subItem.path;
      }
    }
    // Otherwise get first image
      const firstImage = item.items.find(i => i.type === 'image' || i.type === 'gif' || i.type === 'video');
    if (firstImage) return firstImage.path;
    // If only folders, get first image from first subfolder
    const firstFolder = item.items.find(i => i.type === 'folder');
    if (firstFolder && firstFolder.images && firstFolder.images.length > 0) {
      return `${item.path}/${firstFolder.name}/${firstFolder.images[0]}`;
    }
    return '/placeholder.png';
  };

  const handleNextImage = () => {
    if (selectedSubItem && (selectedSubItem.type === 'image' || selectedSubItem.type === 'video' || selectedSubItem.type === 'gif')) {
      const images = selectedFolder?.items.filter(i => i.type === 'image' || i.type === 'video' || i.type === 'gif') || [];
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    } else if (selectedSubItem && selectedSubItem.images) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedSubItem.images!.length);
    }
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePrevImage = () => {
    if (selectedSubItem && (selectedSubItem.type === 'image' || selectedSubItem.type === 'video' || selectedSubItem.type === 'gif')) {
      const images = selectedFolder?.items.filter(i => i.type === 'image' || i.type === 'video' || i.type === 'gif') || [];
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    } else if (selectedSubItem && selectedSubItem.images) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedSubItem.images!.length) % selectedSubItem.images!.length);
    }
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleWheel = (e: React.WheelEvent, isImage: boolean) => {
    if (!isImage) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom + delta));
    setZoom(newZoom);
    
    // Reset pan to center when zooming out to 1x or below
    if (newZoom <= 1) {
      setPan({ x: 0, y: 0 });
    } else {
      // Constrain pan within new zoom bounds
      const container = viewerRef.current;
      if (container) {
        const maxPanX = (container.clientWidth * (newZoom - 1)) / 2;
        const maxPanY = (container.clientHeight * (newZoom - 1)) / 2;
        setPan(prev => ({
          x: Math.max(-maxPanX, Math.min(maxPanX, prev.x)),
          y: Math.max(-maxPanY, Math.min(maxPanY, prev.y))
        }));
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent, isImage: boolean) => {
    if (!isImage || zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent, isImage: boolean) => {
    if (!isDragging || !isImage || zoom <= 1) return;
    
    const container = viewerRef.current;
    if (!container) return;
    
    const maxPanX = (container.clientWidth * (zoom - 1)) / 2;
    const maxPanY = (container.clientHeight * (zoom - 1)) / 2;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    setPan({
      x: Math.max(-maxPanX, Math.min(maxPanX, newX)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    // Disable body scroll when viewer is open
    if (selectedSubItem || (selectedFolder && selectedFolder.items.length === 1)) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedSubItem, selectedFolder]);

  useEffect(() => {
    // Handle keyboard navigation
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        if (selectedSubItem) {
          setSelectedSubItem(null);
          setCurrentImageIndex(0);
          setZoom(1);
          setPan({ x: 0, y: 0 });
        } else if (selectedFolder) {
          setSelectedFolder(null);
          setZoom(1);
          setPan({ x: 0, y: 0 });
        }
      } else if (selectedSubItem && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        if (e.key === 'ArrowRight') {
          handleNextImage();
        } else if (e.key === 'ArrowLeft') {
          handlePrevImage();
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [selectedSubItem, selectedFolder, currentImageIndex]);



  const renderMedia = (src: string, isInViewer: boolean = false) => {
    const mediaType = getMediaType(src);
    
    if (mediaType === 'video') {
      return (
        <video
          src={src}
          controls
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-contain video-fast-hide"
          style={{ backgroundColor: 'black', pointerEvents: isInViewer ? 'auto' : undefined }}
        />
      );
    }
    
    return (
      <Image
        src={src}
        alt="Media"
        fill
        className="object-contain"
        sizes="(max-width: 1024px) 100vw, 80vw"
        unoptimized={mediaType === 'gif'}
      />
    );
  };
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`rounded-xl overflow-hidden h-80 animate-pulse ${
            isDarkMode ? 'bg-slate-800' : 'bg-gray-200'
          }`} />
        ))}
      </div>
    );
  }

  if (selectedSubItem) {
    // Image viewer modal
    const images = selectedSubItem.type === 'folder' 
      ? selectedSubItem.images || []
      : selectedFolder?.items.filter(i => i.type === 'image' || i.type === 'video' || i.type === 'gif').map(i => i.path) || [];

    const currentImage = selectedSubItem.type === 'folder'
      ? `${selectedFolder?.path}/${selectedSubItem.name}/${images[currentImageIndex]}`
      : images[currentImageIndex];

    const isCurrentImage = getMediaType(currentImage) === 'image' || getMediaType(currentImage) === 'gif';
    
    return (
      <div ref={viewerRef} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="relative w-full h-full flex flex-col" style={{ maxWidth: isCurrentImage ? '90vw' : '90vw', maxHeight: '90vh' }}>
          {/* Image container */}
          <div 
            className="flex-1 relative flex items-center justify-center min-h-0"
            onWheel={(e) => handleWheel(e, isCurrentImage)}
            onMouseDown={(e) => handleMouseDown(e, isCurrentImage)}
            onMouseMove={(e) => handleMouseMove(e, isCurrentImage)}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isCurrentImage && zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <div className="relative w-full h-full overflow-hidden border-2 border-white/20 rounded-lg flex items-center justify-center">
              {/* Control buttons */}
              <div className="absolute top-3 right-3 flex gap-2 z-10">
                {isCurrentImage && (
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 bg-black/50 hover:bg-black/70 text-white hover:text-cyan-400 transition-colors rounded-lg backdrop-blur-sm"
                    title="Toggle Fullscreen"
                  >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    }
                    setSelectedSubItem(null);
                    setCurrentImageIndex(0);
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="p-2 bg-black/50 hover:bg-black/70 text-white hover:text-cyan-400 transition-colors rounded-lg backdrop-blur-sm"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="relative w-full h-full" style={{ 
                transform: isCurrentImage ? `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` : 'none', 
                transition: isDragging ? 'none' : 'transform 0.1s',
                pointerEvents: isCurrentImage ? 'none' : 'auto',
                userSelect: isCurrentImage ? 'none' : 'auto'
              }}>
                {renderMedia(currentImage, true)}
              </div>
            </div>
          </div>

          {/* Navigation */}
          {images.length > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={handlePrevImage}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white hover:text-cyan-400"
              >
                <ChevronLeft size={32} />
              </button>
              
              <span className="text-white text-sm md:text-base">
                {currentImageIndex + 1} / {images.length}
              </span>

              <button
                onClick={handleNextImage}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white hover:text-cyan-400"
              >
                <ChevronRight size={32} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedFolder) {
    // If single item, display it directly
    if (selectedFolder.items.length === 1) {
      const singleItem = selectedFolder.items[0];
      const isMedia = singleItem.type === 'image' || singleItem.type === 'video' || singleItem.type === 'gif';
      
      if (isMedia) {
        const isSingleImage = singleItem.type === 'image' || singleItem.type === 'gif';
        
        return (
          <div ref={viewerRef} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative w-full h-full flex flex-col" style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
              {/* Media container */}
              <div 
                className="flex-1 relative flex items-center justify-center min-h-0"
                onWheel={(e) => handleWheel(e, isSingleImage)}
                onMouseDown={(e) => handleMouseDown(e, isSingleImage)}
                onMouseMove={(e) => handleMouseMove(e, isSingleImage)}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isSingleImage && zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
              >
                <div className="relative w-full h-full overflow-hidden border-2 border-white/20 rounded-lg flex items-center justify-center">
                  {/* Control buttons */}
                  <div className="absolute top-3 right-3 flex gap-2 z-10">
                    {isSingleImage && (
                      <button
                        onClick={toggleFullscreen}
                        className="p-2 bg-black/50 hover:bg-black/70 text-white hover:text-cyan-400 transition-colors rounded-lg backdrop-blur-sm"
                        title="Toggle Fullscreen"
                      >
                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (document.fullscreenElement) {
                          document.exitFullscreen();
                        }
                        setSelectedFolder(null);
                        setZoom(1);
                        setPan({ x: 0, y: 0 });
                      }}
                      className="p-2 bg-black/50 hover:bg-black/70 text-white hover:text-cyan-400 transition-colors rounded-lg backdrop-blur-sm"
                      title="Close"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="relative w-full h-full" style={{ 
                    transform: isSingleImage ? `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` : 'none', 
                    transition: isDragging ? 'none' : 'transform 0.1s',
                    pointerEvents: isSingleImage ? 'none' : 'auto',
                    userSelect: isSingleImage ? 'none' : 'auto'
                  }}>
                    {renderMedia(singleItem.path, true)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
    }
    
    // Subfolder/image browser
    return (
      <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4`}>
        <div className={`relative w-full max-w-7xl max-h-[90vh] rounded-xl overflow-hidden border-2 border-white/20 ${
          isDarkMode ? 'bg-slate-800' : 'bg-white'
        }`}>
          {/* Control buttons */}
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <button
              onClick={() => setSelectedFolder(null)}
              className="p-2 bg-black/50 hover:bg-black/70 text-white hover:text-cyan-400 transition-colors rounded-lg backdrop-blur-sm"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Header */}
          <div className={`flex items-center justify-between p-4 md:p-6 pr-20 border-b ${
            isDarkMode ? 'border-slate-700' : 'border-gray-200'
          }`}>
            <div>
              <button
                onClick={() => setSelectedFolder(null)}
                className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm mb-2"
              >
                ← Back
              </button>
              <h3 className="text-xl md:text-2xl font-bold">{selectedFolder.name}</h3>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-4 md:p-6">
            <div className={`grid grid-cols-1 gap-3 md:gap-4 ${subfolderColumns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
              {selectedFolder.items.map((item, itemIndex) => {
                if (item.type === 'folder' && item.images) {
                  return (
                    <button
                      key={itemIndex}
                      onClick={() => {
                        setSelectedSubItem(item);
                        setCurrentImageIndex(0);
                      }}
                      className={`relative ${maintainAspectRatio ? '' : 'aspect-square'} rounded-lg overflow-hidden group border transition-all ${
                        isDarkMode
                          ? 'bg-slate-700 border-slate-600 hover:border-cyan-500'
                          : 'bg-gray-100 border-gray-300 hover:border-cyan-500'
                      }`}
                    >
                      {maintainAspectRatio ? (
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                          {(() => {
                            const firstImage = `${selectedFolder.path}/${item.name}/${item.images[0]}`;
                            const mediaType = getMediaType(firstImage);
                            
                            if (mediaType === 'video') {
                              return (
                                <video
                                  src={firstImage}
                                  className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform"
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                />
                              );
                            }
                            
                            return (
                              <Image
                                src={firstImage}
                                alt={item.name}
                                fill
                                className="object-contain group-hover:scale-105 transition-transform"
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                unoptimized={mediaType === 'gif'}
                              />
                            );
                          })()}
                        </div>
                      ) : (
                        <>
                          {(() => {
                            const firstImage = `${selectedFolder.path}/${item.name}/${item.images[0]}`;
                            const mediaType = getMediaType(firstImage);
                            
                            if (mediaType === 'video') {
                              return (
                                <video
                                  src={firstImage}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                />
                              );
                            }
                            
                            return (
                              <Image
                                src={firstImage}
                                alt={item.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform"
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                unoptimized={mediaType === 'gif'}
                              />
                            );
                          })()}
                        </>
                      )}
                    </button>
                  );
                } else if (item.type === 'image') {
                  const mediaItems = selectedFolder.items.filter(i => i.type === 'image' || i.type === 'video' || i.type === 'gif');
                  const mediaIndex = mediaItems.findIndex(i => i.path === item.path);
                  
                  return (
                    <button
                      key={itemIndex}
                      onClick={() => {
                        setSelectedSubItem(item);
                        setCurrentImageIndex(mediaIndex);
                      }}
                      className={`relative ${maintainAspectRatio ? '' : 'aspect-square'} rounded-lg overflow-hidden group border transition-all ${
                        isDarkMode
                          ? 'bg-slate-700 border-slate-600 hover:border-cyan-500'
                          : 'bg-gray-100 border-gray-300 hover:border-cyan-500'
                      }`}
                    >
                      {maintainAspectRatio ? (
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                          <Image
                            src={item.path}
                            alt={item.name}
                            fill
                            className="object-contain group-hover:scale-105 transition-transform"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            unoptimized={getMediaType(item.path) === 'gif'}
                          />
                        </div>
                      ) : (
                        <Image
                          src={item.path}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          unoptimized={getMediaType(item.path) === 'gif'}
                        />
                      )}
                    </button>
                  );
                } else if (item.type === 'gif' || item.type === 'video') {
                  const mediaItems = selectedFolder.items.filter(i => i.type === 'image' || i.type === 'video' || i.type === 'gif');
                  const mediaIndex = mediaItems.findIndex(i => i.path === item.path);
                  
                  return (
                    <button
                      key={itemIndex}
                      onClick={() => {
                        setSelectedSubItem(item);
                        setCurrentImageIndex(mediaIndex);
                      }}
                      className={`relative ${maintainAspectRatio ? '' : 'aspect-square'} rounded-lg overflow-hidden group border transition-all ${
                        isDarkMode
                          ? 'bg-slate-700 border-slate-600 hover:border-cyan-500'
                          : 'bg-gray-100 border-gray-300 hover:border-cyan-500'
                      }`}
                    >
                      {maintainAspectRatio ? (
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                          {item.type === 'video' ? (
                            <video
                              src={item.path}
                              className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform"
                              autoPlay
                              loop
                              muted
                              playsInline
                            />
                          ) : (
                            <Image
                              src={item.path}
                              alt={item.name}
                              fill
                              className="object-contain group-hover:scale-105 transition-transform"
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              unoptimized
                            />
                          )}
                        </div>
                      ) : (
                        <>
                          {item.type === 'video' ? (
                            <video
                              src={item.path}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              autoPlay
                              loop
                              muted
                              playsInline
                            />
                          ) : (
                            <Image
                              src={item.path}
                              alt={item.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform"
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              unoptimized
                            />
                          )}
                        </>
                      )}
                    </button>
                  );
                }
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main gallery grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {gallery.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            setSelectedFolder(item);
            setCurrentImageIndex(0);
          }}
          className={`rounded-xl overflow-hidden border hover:border-cyan-500 transition-all group ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          }`}
        >
          <div className={`relative ${maintainAspectRatio ? '' : 'aspect-square'} flex items-center justify-center overflow-hidden ${
            isDarkMode ? 'bg-slate-900' : 'bg-gray-100'
          }`}>
            {maintainAspectRatio ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                {(() => {
                  const thumbnail = getThumbnail(item);
                  const mediaType = getMediaType(thumbnail);
                  
                  if (mediaType === 'video') {
                    return (
                      <video
                        src={thumbnail}
                        className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    );
                  }
                  
                  return (
                    <Image
                      src={thumbnail}
                      alt={item.name}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized={mediaType === 'gif'}
                    />
                  );
                })()}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
            ) : (
              <>
                {(() => {
                  const thumbnail = getThumbnail(item);
                  const mediaType = getMediaType(thumbnail);
                  
                  if (mediaType === 'video') {
                    return (
                      <video
                        src={thumbnail}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    );
                  }
                  
                  return (
                    <Image
                      src={thumbnail}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized={mediaType === 'gif'}
                    />
                  );
                })()}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
