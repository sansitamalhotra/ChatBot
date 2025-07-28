import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import DOMPurify from "dompurify";

import PSPLClip01 from "./images/PSPLClip-01.mp4" 

import './Hero.css';

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slideIntervalRef = useRef(null);
  
  // Define carousel content
  const slides = [
    {
      title: "Fostering <br>Technological Excellence",
      subtitle: "Linking Tech Experts to the Success Stories of Tomorrow",
      cta: { text: "HIRE TECH TALENT", link: "/Search-Jobs" },
      videoSrc: "https://videos.pexels.com/video-files/7844879/7844879-hd_1920_1080_30fps.mp4",
    },
    {
      title: "Cutting-Edge<br>Healthcare Staffing <br>Solutions",
      subtitle: "Revolutionizing the Way Organizations Identify and Retain Leading Healthcare Professionals",
      cta: { text: "EXPLORE SOLUTIONS", link: "/Healthcare-&-Medical-Recruitment" },
      videoSrc: "https://videos.pexels.com/video-files/8348322/8348322-uhd_2560_1440_25fps.mp4",
    },
    {
      title: "Accelerate<br>Your IT Career",
      subtitle: "Discover Opportunities That Match Your Skills and Ambitions",
      cta: { text: "FIND OPPORTUNITIES", link: "/Search-Jobs" },
      videoSrc: "https://videos.pexels.com/video-files/5519942/5519942-uhd_2560_1440_30fps.mp4",
    },
    {
      title: "Future of Tech<br>Starts Here",
      subtitle: "Join Us in Shaping Tomorrow's Innovations",
      cta: { text: "FIND TALENTS", link: "/Search-Jobs" },
      videoSrc: "https://videos.pexels.com/video-files/3196062/3196062-uhd_2560_1440_25fps.mp4",
    },
    {
      title: "Your Path to<br>Success",
      subtitle: "Unlock Your Potential with Our Expertise",
      cta: { text: "GET STARTED", link: "/Search-Jobs" },
      videoSrc: "https://videos.pexels.com/video-files/3191422/3191422-uhd_2732_1440_25fps.mp4",
    }
  ];
  
  const totalSlides = slides.length;
  
  // Memoized navigation functions
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);
  
  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
  }, []);
  
  // Handle carousel auto-play and pause
  const startSlideInterval = useCallback(() => {
    if (slideIntervalRef.current) clearInterval(slideIntervalRef.current);
    slideIntervalRef.current = setInterval(nextSlide, 8000);
  }, [nextSlide]);
  
  const pauseSlideInterval = useCallback(() => {
    if (slideIntervalRef.current) {
      clearInterval(slideIntervalRef.current);
      slideIntervalRef.current = null;
    }
    setIsPaused(true);
  }, []);
  
  const resumeSlideInterval = useCallback(() => {
    startSlideInterval();
    setIsPaused(false);
  }, [startSlideInterval]);
  
  // Initialize auto-play on component mount
  useEffect(() => {
    startSlideInterval();
    return () => {
      if (slideIntervalRef.current) clearInterval(slideIntervalRef.current);
    };
  }, [startSlideInterval]);
  
  // Scroll to next section
  const scrollToNextSection = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  // Render HTML content safely
  const createMarkup = (htmlContent) => {
    return { __html: DOMPurify.sanitize(htmlContent) };
  };

  // Keyboard navigation handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          prevSlide();
          break;
        case 'ArrowRight':
          nextSlide();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  return (
    <section 
      className="hero"
      onMouseEnter={pauseSlideInterval}
      onMouseLeave={resumeSlideInterval}
      aria-label="Hero carousel"
      role="region"
    >
      <div className="hero-slides" aria-live="polite">
        {slides.map((slide, index) => (
          <div 
            key={index} 
            className={`slide ${index === currentSlide ? 'active' : ''}`}
            aria-hidden={index !== currentSlide}
          >
            <video 
              className="hero-video" 
              autoPlay 
              muted 
              loop
              aria-hidden="true"
            >
              <source src={slide.videoSrc} type="video/mp4" />
            </video>
            <div className="hero-overlay" aria-hidden="true"></div>
            <div className="hero-content mt-5">
              <h1 
                className="hero-title mt-5"
                dangerouslySetInnerHTML={createMarkup(slide.title)}
              ></h1>
              <p className="hero-subtitle">{slide.subtitle}</p>
              <div className="hero-cta">
                <Link 
                  to={slide.cta.link} 
                  className="cta-btn secondary-btn"
                  role="button"
                >
                  {slide.cta.text}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="slide-arrows">
        <button 
          className="slide-arrow prev" 
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          className="slide-arrow next" 
          onClick={nextSlide}
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>
      </div>
      
      <button 
        className="scroll-icon" 
        onClick={scrollToNextSection}
        aria-label="Scroll to next section"
      >
        <ChevronDown size={68} />
      </button>
    </section>
  );
};

export default HeroCarousel;
