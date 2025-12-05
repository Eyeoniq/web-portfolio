'use client';

import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { Menu, X, Mail, ExternalLink, Image as ImageIcon, Moon, Sun } from 'lucide-react';
import Image from 'next/image';
import * as THREE from 'three';
import { InteractiveGallery } from '@/app/components/InteractiveGallery';

interface ModelProps {
  url: string;
  scale?: number;
  position?: [number, number, number];
}

// Model Component
function Model({ url, scale = 1, position = [0, 0, 0] }: ModelProps) {
  const modelRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url) as any;
  
  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.005;
    }
  });

  return (
    <primitive 
      ref={modelRef}
      object={scene.clone()} 
      scale={scale} 
      position={position}
    />
  );
}

// Scene Component
function Scene({ url }: { url: string }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <OrbitControls 
        enableZoom={true}
        enablePan={false}
        minDistance={2}
        maxDistance={10}
        autoRotate={false}
      />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      <Suspense fallback={null}>
        <Model url={url} scale={1} />
        <Environment preset="studio" />
      </Suspense>
    </>
  );
}



export default function Portfolio() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      setIsDarkMode(savedMode === 'true');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white'
        : 'bg-linear-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full backdrop-blur-md z-50 border-b transition-colors duration-300 ${
        isDarkMode
          ? 'bg-slate-900/80 border-slate-700'
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              EARL VALDEZ
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8 items-center">
              {['home', 'about', 'gallery', 'renders', 'contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className={`capitalize hover:text-cyan-400 transition-colors ${
                    activeSection === item ? 'text-cyan-400' : ''
                  }`}
                >
                  {item === 'renders' ? 'animations' : item}
                </button>
              ))}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-t transition-colors duration-300 ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="px-4 py-4 space-y-3">
              {['home', 'about', 'gallery', 'renders', 'contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className="block w-full text-left capitalize hover:text-cyan-400 transition-colors"
                >
                  {item === 'renders' ? 'animations' : item}
                </button>
              ))}
              <button
                onClick={toggleDarkMode}
                className="flex items-center gap-2 w-full py-2 hover:text-cyan-400 transition-colors"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section with Avatar */}
      <section id="home" className="min-h-screen flex items-center justify-center pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4 md:space-y-6 text-center md:text-left order-2 md:order-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
                <span className="block">Mechatronics Engineer</span>
                <span className="block bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  3D Artist & Modeler
                </span>
              </h1>
              <p className={`text-base sm:text-lg md:text-xl transition-colors ${
                isDarkMode ? 'text-slate-300' : 'text-gray-600'
              }`}>
                Creating detailed hard-surface models, cosplay props, and bringing concepts to life through 3D design and animation.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
                <a 
                  href="https://cults3d.com/en/users/niqEyeo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition-colors inline-flex items-center justify-center gap-2"
                >
                  Go to Store <ExternalLink size={18} />
                </a>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className="px-6 py-3 border border-cyan-500 hover:bg-cyan-500/10 rounded-lg font-semibold transition-colors"
                >
                  Contact Me
                </button>
              </div>
            </div>
            
            {/* Avatar */}
            <div className="flex justify-center order-1 md:order-2">
              <div className={`relative w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] rounded-full overflow-hidden border-4 transition-colors ${
                isDarkMode ? 'bg-slate-800/50 border-cyan-500/30' : 'bg-gray-200 border-cyan-400/50'
              }`}>
                <Image
                  src="/avatar.jpg"
                  alt="Earl Valdez"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className={`min-h-screen py-16 md:py-20 transition-colors ${
        isDarkMode ? 'bg-slate-800/30' : 'bg-gray-100/50'
      }`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 md:mb-12 text-center">About Me</h2>
          
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Background</h3>
              <p className={`mb-3 md:mb-4 text-sm sm:text-base transition-colors ${
                isDarkMode ? 'text-slate-300' : 'text-gray-600'
              }`}>
                Mechatronics Engineer and freelance 3D artist specializing in hard-surface modeling and cosplay prop design. Graduate from Saint Louis University with a passion for bringing digital concepts to life.
              </p>
              <p className={`text-sm sm:text-base transition-colors ${
                isDarkMode ? 'text-slate-300' : 'text-gray-600'
              }`}>
                I combine technical engineering knowledge with artistic creativity to produce high-quality 3D models optimized for manufacturing and 3D printing.
              </p>
            </div>

            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Skills & Tools</h3>
              <div className="space-y-3 md:space-y-4">
                <div>
                  <h4 className="font-semibold text-cyan-400 mb-2">3D Modeling</h4>
                  <p className={`text-sm sm:text-base transition-colors ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>Blender, Hard-surface modeling, Shader setup, Product animation</p>
                </div>
                <div>
                  <h4 className="font-semibold text-cyan-400 mb-2">Product Design</h4>
                  <p className={`text-sm sm:text-base transition-colors ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>Electronics, Robotics, Mechanical design, Rapid prototyping</p>
                </div>
                <div>
                  <h4 className="font-semibold text-cyan-400 mb-2">Manufacturing</h4>
                  <p className={`text-sm sm:text-base transition-colors ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>3D printing optimization, Cura Slicer, Support generation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Experience Timeline */}
          <div className="mt-12 md:mt-16">
            <h3 className="text-xl md:text-2xl font-bold mb-6 md:mb-8">Experience</h3>
            <div className="space-y-6">
              <div className="border-l-2 border-cyan-500 pl-4 md:pl-6">
                <div className="text-cyan-400 font-semibold text-sm md:text-base">2024 - Present</div>
                <h4 className="text-lg md:text-xl font-bold mt-2">Freelance 3D Artist</h4>
                <p className={`mt-2 text-sm sm:text-base transition-colors ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-600'
                }`}>Designing cosplay props and optimizing models for 3D printing. Creating concept animations for prototype products.</p>
              </div>
              <div className={`border-l-2 pl-4 md:pl-6 transition-colors ${
                isDarkMode ? 'border-slate-600' : 'border-gray-300'
              }`}>
                <div className={`font-semibold text-sm md:text-base transition-colors ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>June 2024 - July 2024</div>
                <h4 className="text-lg md:text-xl font-bold mt-2">On-the-Job Training - Baguio City Hall</h4>
                <p className={`mt-2 text-sm sm:text-base transition-colors ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-600'
                }`}>3D modeled vintage sceneries for commemoration projects. Maintained manufacturing equipment including 3D printers.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="min-h-screen py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 md:mb-12 text-center">Featured Models</h2>
          <InteractiveGallery isDarkMode={isDarkMode} folder="models" subfolderColumns={3} />
        </div>
      </section>

      {/* Animations/Renders Section */}
      <section id="renders" className={`min-h-screen py-16 md:py-20 transition-colors ${
        isDarkMode ? 'bg-slate-800/30' : 'bg-gray-100/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 md:mb-12 text-center">Animations & Renders</h2>
          <InteractiveGallery isDarkMode={isDarkMode} folder="renders" maintainAspectRatio={true} />
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className={`min-h-screen py-16 md:py-20 transition-colors ${
        isDarkMode ? 'bg-slate-800/30' : 'bg-gray-100/50'
      }`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 md:mb-6">Let's Work Together</h2>
          <p className={`text-base sm:text-lg md:text-xl mb-8 md:mb-12 transition-colors ${
            isDarkMode ? 'text-slate-300' : 'text-gray-600'
          }`}>
            I'm available for freelance projects, collaborations, and commissions. Let's bring your ideas to life!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-12 max-w-2xl mx-auto">
            <a 
              href="mailto:earlernestovaldez@gmail.com"
              className={`p-5 md:p-6 rounded-xl border hover:border-cyan-500 transition-all group ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
              }`}>
              <Mail className="mx-auto mb-3 md:mb-4 text-cyan-400 group-hover:scale-110 transition-transform" size={32} />
              <h3 className="font-semibold mb-2">Email</h3>
              <p className={`text-xs sm:text-sm break-all transition-colors ${
                isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>earlernestovaldez@gmail.com</p>
            </a>

            <a 
              href="https://cults3d.com/en/users/niqEyeo"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-5 md:p-6 rounded-xl border hover:border-cyan-500 transition-all group ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
              }`}>
              <ExternalLink className="mx-auto mb-3 md:mb-4 text-cyan-400 group-hover:scale-110 transition-transform" size={32} />
              <h3 className="font-semibold mb-2">Cults3D Store</h3>
              <p className={`text-xs sm:text-sm transition-colors ${
                isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>View my models</p>
            </a>
          </div>

          <div className={`pt-8 md:pt-12 border-t transition-colors ${
            isDarkMode ? 'border-slate-700' : 'border-gray-200'
          }`}>
            <p className={`text-xs sm:text-sm transition-colors ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>© 2025 Earl Ernesto Valdez. All rights reserved.</p>
          </div>
        </div>
      </section>
    </div>
  );
}