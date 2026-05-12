'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Twitter, ChevronLeft, ChevronRight } from 'lucide-react';

const CARD_COUNT = 18;
const ANGLE_STEP = 360 / CARD_COUNT;

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(true);
  const [gifIndex, setGifIndex] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCard, setActiveCard] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [radius, setRadius] = useState(720);
  const dragStartX = useRef(0);
  const dragStartRotation = useRef(0);
  const animRef = useRef<number | null>(null);
  
  const openseaLink = "https://opensea.io/";

  // Derive active card from rotation
  useEffect(() => {
    const normalized = ((rotation % 360) + 360) % 360;
    const idx = Math.round(normalized / ANGLE_STEP) % CARD_COUNT;
    setActiveCard((CARD_COUNT - idx) % CARD_COUNT);
  }, [rotation]);

  // Responsive carousel radius
  useEffect(() => {
    const updateRadius = () => {
      setRadius(window.innerWidth <= 480 ? 420 : window.innerWidth <= 768 ? 550 : 720);
    };
    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  // Auto-spin loop
  useEffect(() => {
    setMounted(true);
    if (!isSpinning || isDragging) return;
    const spin = () => {
      setRotation(prev => prev - 0.18);
      animRef.current = requestAnimationFrame(spin);
    };
    animRef.current = requestAnimationFrame(spin);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isSpinning, isDragging]);

  // GIF cycling
  useEffect(() => {
    const gifInterval = setInterval(() => {
      setGifIndex(prev => (prev % 20) + 1);
    }, 200);
    return () => clearInterval(gifInterval);
  }, []);

  // Drag handlers for carousel
  const onDragStart = useCallback((clientX: number) => {
    setIsDragging(true);
    dragStartX.current = clientX;
    dragStartRotation.current = rotation;
  }, [rotation]);

  const onDragMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    const delta = clientX - dragStartX.current;
    setRotation(dragStartRotation.current + delta * 0.25);
  }, [isDragging]);

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const rotateNext = () => setRotation(r => r - ANGLE_STEP);
  const rotatePrev = () => setRotation(r => r + ANGLE_STEP);

  const handleComingSoon = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.preventDefault();
    const target = e.currentTarget;
    const originalText = target.innerText;
    target.innerText = "COMING SOON ⏳";
    target.style.pointerEvents = "none";
    setTimeout(() => {
      target.innerText = originalText;
      target.style.pointerEvents = "auto";
    }, 2000);
  };

  if (!mounted) return null;

  return (
    <>
      <div className="bg-effects">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <nav className="navbar">
        <div className="nav-brand">BASE CATZ</div>
        <div className="nav-links">
          <a href="#home">HOME</a>
          <a href="#collection">COLLECTION</a>
          <a href="#roadmap">ROADMAP</a>
          <a href="https://x.com/CatzBase" target="_blank" rel="noopener noreferrer" className="nav-twitter-link">
            <Twitter size={16} />
            <span>@CatzBase</span>
          </a>
        </div>
        <a href="#" onClick={handleComingSoon} className="btn-uni btn-uni-primary" style={{ padding: '12px 24px' }}>
          OPENSEA
        </a>
      </nav>

      <main>
        {/* Hero Section */}
        <section id="home" className="hero relative">
          <div className="container">
            <div className="hero-split">
              
              {/* Left Side: Text and Buttons */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
                className="hero-text-side relative z-10"
              >
                <h1 className="hero-title display-font">
                  BASE <br/>
                  <span style={{ color: '#89CFF0' }}>CATZ</span>
                </h1>

                <p className="hero-tagline">
                  🐾 1111 unique feline legends living on Base.<br/>
                  <span className="hero-tagline-sub">Cute outside. Degens inside. 👑</span><br/>
                  <span className="hero-tagline-mini">Built for collectors, gamers &amp; the Base community.</span>
                </p>

                <div className="btn-group relative z-30">
                  <a href="#" onClick={handleComingSoon} className="btn-uni btn-uni-primary">
                    MINT NOW
                  </a>
                  <a href="#collection" className="btn-uni btn-uni-outline">
                    EXPLORE
                  </a>
                  <a
                    href="https://x.com/CatzBase"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-uni btn-uni-twitter"
                  >
                    <Twitter size={16} />
                    FOLLOW US
                  </a>
                </div>
              </motion.div>

              {/* Right Side: The "GIF" Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, rotateZ: -10 }}
                animate={{ opacity: 1, scale: 1, rotateZ: 5 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.5, delay: 0.2 }}
                className="hero-image-side relative z-20"
              >
                <div className="hero-gif-card">
                  <img 
                    src={`/NFTs/cat_nft_${gifIndex.toString().padStart(3, '0')}.png`}
                    alt="Base Cats Character"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/40 pointer-events-none"></div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* Enhanced 3D Coverflow Carousel */}
        <section id="collection" className="carousel-section">
          <div className="container">
            <motion.div 
              className="uni-section-header carousel-header"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, type: 'spring' }}
            >
              <div className="carousel-eyebrow">✦ EXPLORE THE ✦</div>
              <h2 className="display-font uni-title-small">BASE CATZ</h2>
              <h2 className="display-font uni-title-large">COLLECTION</h2>
              <p className="carousel-subtitle">1111 uniquely generated feline legends living on Base Network — Cute outside. Degens inside. 👑</p>
              <div className="btn-group">
                <button onClick={handleComingSoon} className="btn-uni btn-uni-primary">CHECK WHITELIST</button>
                <a href="#" onClick={handleComingSoon} className="btn-uni btn-uni-outline">OPENSEA</a>
                <a href="https://x.com/CatzBase" target="_blank" rel="noopener noreferrer" className="btn-uni btn-uni-twitter"><Twitter size={15} /> TWITTER</a>
              </div>
            </motion.div>
          </div>

          {/* Active card info badge */}
          <div className="carousel-active-badge">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCard}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="carousel-badge-inner"
              >
                <span className="badge-hash">#</span>
                <span className="badge-num">{String(activeCard + 1).padStart(3, '0')}</span>
                <span className="badge-label">BASE CAT</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 3D Stage */}
          <div 
            className="carousel-360-wrap"
            onMouseDown={e => { setIsSpinning(false); onDragStart(e.clientX); }}
            onMouseMove={e => onDragMove(e.clientX)}
            onMouseUp={() => { onDragEnd(); setIsSpinning(true); }}
            onMouseLeave={() => { if (isDragging) { onDragEnd(); setIsSpinning(true); } }}
            onTouchStart={e => { setIsSpinning(false); onDragStart(e.touches[0].clientX); }}
            onTouchMove={e => onDragMove(e.touches[0].clientX)}
            onTouchEnd={() => { onDragEnd(); setIsSpinning(true); }}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            {/* Atmospheric floor glow */}
            <div className="carousel-floor-glow" />
            {/* Fog / fade edges */}
            <div className="carousel-fog-left" />
            <div className="carousel-fog-right" />

            <div className="carousel-360-stage" aria-label="Base Cats collection carousel">
              <div 
                className="carousel-360-rotator"
                style={{ transform: `translateZ(-${radius}px) rotateY(${rotation}deg)` }}
              >
                {Array.from({ length: CARD_COUNT }).map((_, index) => {
                  const angle = index * ANGLE_STEP;
                  const formattedNumber = (index + 1).toString().padStart(3, '0');
                  const isActive = activeCard === index;

                  return (
                    <div
                      key={index}
                      className={`carousel-360-card ${isActive ? 'card-active' : ''}`}
                      style={{ transform: `rotateY(${angle}deg) translateZ(${radius}px)` }}
                      onClick={() => {
                        setIsSpinning(false);
                        setRotation(r => {
                          const target = -index * ANGLE_STEP;
                          return target;
                        });
                        setTimeout(() => setIsSpinning(true), 600);
                      }}
                    >
                      <div className="card-3d-face card-3d-face--front">
                        {isActive && <div className="card-glow-ring" />}
                        <div className="card-art-shell">
                          <img
                            src={`/NFTs/cat_nft_${formattedNumber}.png`}
                            alt={`Base Cat ${formattedNumber}`}
                            onError={(e) => { e.currentTarget.src = `https://placehold.co/400x400/1a1030/A389F4?text=CAT+${formattedNumber}`; }}
                          />
                        </div>
                        <div className="card-shimmer" />
                        <div className="card-label">
                          <span className="card-label-num">#{formattedNumber}</span>
                          <span className="card-label-name">Base Cat</span>
                        </div>
                      </div>
                      <div className="card-3d-face card-3d-face--back" aria-hidden="true">
                        <div className="card-back-logo">🐱</div>
                        <div className="card-back-text">BASE CATS</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation arrows */}
          <div className="carousel-nav">
            <motion.button
              className="carousel-nav-btn"
              onClick={rotatePrev}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Previous cat"
            >
              <ChevronLeft size={28} />
            </motion.button>
            <div className="carousel-nav-dots">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`nav-dot ${Math.floor(activeCard / 3) === i ? 'nav-dot-active' : ''}`}
                />
              ))}
            </div>
            <motion.button
              className="carousel-nav-btn"
              onClick={rotateNext}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Next cat"
            >
              <ChevronRight size={28} />
            </motion.button>
          </div>
        </section>

        {/* Roadmap */}
        <section id="roadmap" className="roadmap-section">
          <div className="container">

            {/* Header — sits above the wallet, full document flow */}
            <div className="uni-section-header" style={{ marginBottom: '60px' }}>
              <h3 className="display-font uni-title-small">THE ROADMAP</h3>
              <h2 className="display-font uni-title-large">THE VISION</h2>
            </div>

            <div className="roadmap-wallet-scene">
              <div className="roadmap-wallet">
                <div className="roadmap-wallet-texture"></div>
                <div className="roadmap-wallet-stitch"></div>
                <div className="roadmap-reveal-text">SCROLL TO REVEAL</div>

                <div className="roadmap-notes-stack">
                  {[
                    { phase: "PHASE 01", title: "THE LITTER",          desc: "The official launch of 1,111 unique Base Cats. Focusing entirely on community building and a flawless minting experience.", color: "var(--uni-lavender)", rot: -2, z: 20 },
                    { phase: "PHASE 02", title: "CATNIP DROPS",        desc: "Airdrops of exclusive digital accessories and companions for early holders. Premium physical pop-art apparel.",            color: "#89CFF0",             rot:  2, z: 15 },
                    { phase: "PHASE 03", title: "THE SCRATCHING POST", desc: "Expansion into the metaverse. Your Base Cat will serve as your unique 3D avatar in play-to-earn mini-games.",           color: "var(--uni-pink)",     rot: -1, z: 10 },
                    { phase: "PHASE 04", title: "THE CAT TREE",        desc: "Real world events and continued expansion of the Base Cats brand globally. High-tier holder utility.",                    color: "var(--uni-yellow)",   rot:  3, z:  5 },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      className="roadmap-sticky-note"
                      /* start stacked → fan out when in view → collapse when out */
                      initial={{ y: 0, opacity: idx === 0 ? 1 : 0 }}
                      whileInView={{ y: idx * 170, opacity: 1 }}
                      viewport={{ once: false, margin: '-80px' }}
                      transition={{ duration: 0.55, delay: idx * 0.1, type: 'spring', bounce: 0.25 }}
                      style={{
                        '--note-color': item.color,
                        zIndex: item.z,
                        position: idx === 0 ? 'relative' : 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        rotateZ: item.rot,
                      } as any}
                      whileHover={{ rotateZ: 0, scale: 1.02, zIndex: 30 }}
                    >
                      <div className="roadmap-pin"></div>
                      <div className="roadmap-note-content">
                        <div className="roadmap-note-header">{item.phase}</div>
                        <h3 className="roadmap-note-title">{item.title}</h3>
                        <p className="roadmap-note-desc">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="roadmap-floor" aria-hidden="true"></div>
            </div>

          </div>
        </section>



        {/* FAQ Section */}
        <section id="faq" className="section">
          <div className="container">
            <div className="uni-section-header">
              <h3 className="display-font uni-title-small">GOT QUESTIONS?</h3>
              <h2 className="display-font uni-title-large">FAQ</h2>
            </div>

            <div className="faq-container">
              {[
                { q: "WHAT IS THE TOTAL SUPPLY?", a: "There will only ever be 1111 unique Base Catz in existence. Cute outside. Degens inside. 👑" },
                { q: "WHICH BLOCKCHAIN IS THIS ON?", a: "The collection is deploying exclusively on the Base Network to ensure lightning-fast transactions and virtually zero gas fees." },
                { q: "WHEN IS THE MINT?", a: "We are launching soon! Follow us on Twitter @CatzBase (https://x.com/CatzBase) and join the community to get whitelist and drop updates." },
                { q: "HOW DO I MINT?", a: "Minting will take place directly through a secure OpenSea Drop. Just connect your wallet when the drop is live." },
                { q: "WHO IS THIS FOR?", a: "BASE CATZ is built for collectors, gamers & the entire Base community. If you love feline art and on-chain culture, you belong here." }
              ].map((item, idx) => (
                <div key={idx} className={`faq-item ${openFaq === idx ? 'active' : ''}`} onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                  <div className="faq-question">
                    <h3 className="display-font">{item.q}</h3>
                    <div className="faq-icon">{openFaq === idx ? '−' : '+'}</div>
                  </div>
                  {openFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: "auto", opacity: 1 }} 
                      className="faq-answer"
                    >
                      <p>{item.a}</p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-top">
            <div className="footer-brand-col">
              <div className="nav-brand footer-brand">BASE CATZ</div>
              <p className="footer-tagline">🐾 1111 unique feline legends on Base.<br/>Cute outside. Degens inside. 👑</p>
            </div>
            <div className="footer-links-col">
              <div className="footer-link-group">
                <span className="footer-link-heading">EXPLORE</span>
                <a href="#home" className="footer-link">Home</a>
                <a href="#collection" className="footer-link">Collection</a>
                <a href="#roadmap" className="footer-link">Roadmap</a>
                <a href="#faq" className="footer-link">FAQ</a>
              </div>
              <div className="footer-link-group">
                <span className="footer-link-heading">COMMUNITY</span>
                <a href="https://x.com/CatzBase" target="_blank" rel="noopener noreferrer" className="footer-link footer-social-link"><Twitter size={13}/> @CatzBase</a>
                <a href="#" onClick={handleComingSoon} className="footer-link">OpenSea</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="text-secondary font-medium">&copy; 2026 Base Catz NFT. All rights reserved.</div>
            <div className="footer-socials">
              <a href="https://x.com/CatzBase" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Twitter">
                <Twitter size={18} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
