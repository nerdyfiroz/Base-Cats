'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Twitter, Github } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [rotation, setRotation] = useState(0);
  
  const openseaLink = "https://opensea.io/";

  useEffect(() => {
    setMounted(true);
    
    // Auto-spin the 3D carousel smoothly
    let animationFrameId: number;
    const spin = () => {
      setRotation(prev => prev - 0.15); // Adjust speed here
      animationFrameId = requestAnimationFrame(spin);
    };
    spin();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
        <div className="nav-brand">BASE CATS</div>
        <div className="nav-links">
          <a href="#home">HOME</a>
          <a href="#collection">COLLECTION</a>
          <a href="#roadmap">ROADMAP</a>
        </div>
        <a href="#" onClick={handleComingSoon} className="btn-uni btn-uni-primary" style={{ padding: '12px 24px' }}>
          OPENSEA
        </a>
      </nav>

      <main>
        {/* Hero Section */}
        <section id="home" className="hero">
          <div className="container hero-content">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
            >
              <h1 className="hero-title text-white">
                THE BASE <span className="text-yellow">CATS</span>
              </h1>
            </motion.div>

            <motion.div 
              className="btn-group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <a href="#" onClick={handleComingSoon} className="btn-uni btn-uni-primary">
                MINT NOW
              </a>
              <a href="#collection" className="btn-uni btn-uni-outline">
                EXPLORE
              </a>
            </motion.div>
          </div>
        </section>

        {/* Unishorns Style: 3D Coverflow Carousel */}
        <section id="collection" className="carousel-section">
          <div className="container">
            <div className="uni-section-header carousel-header">
              <h2 className="display-font uni-title-small">BASE CATS</h2>
              <h2 className="display-font uni-title-large">COLLECTION</h2>
              
              <div className="btn-group">
                <button onClick={handleComingSoon} className="btn-uni btn-uni-primary">CHECK WHITELIST</button>
                <a href="#" onClick={handleComingSoon} className="btn-uni btn-uni-outline">OPENSEA</a>
              </div>
            </div>
          </div>

          <div className="carousel-360-wrap">
            <div className="carousel-360-stage" role="img" aria-label="Base Cats collection 360 degree carousel">
              <div 
                className="carousel-360-rotator"
                style={{ transform: `translateZ(-720px) rotateY(${rotation}deg)` }}
              >
                {Array.from({ length: 18 }).map((_, index) => {
                  const angle = index * 20; // 360 / 18 = 20 degrees per card
                  const formattedNumber = (index + 1).toString().padStart(3, '0');
                  
                  return (
                    <div 
                      key={index}
                      className="coverflow-card carousel-360-card"
                      style={{ transform: `rotateY(${angle}deg) translateZ(720px) translateY(0px)` }}
                    >
                      <div className="card-3d-face card-3d-face--front">
                        <div className="card-art-shell">
                          <img 
                            src={`/NFTs/cat_nft_${formattedNumber}.png`} 
                            alt={`Base Cat ${formattedNumber}`}
                            onError={(e) => { e.currentTarget.src = `https://via.placeholder.com/400x400/000000/A389F4?text=CAT+${formattedNumber}`; }}
                          />
                        </div>
                      </div>
                      <div className="card-3d-face card-3d-face--back" aria-hidden="true"></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Unishorns Style: Wallet Scene Roadmap */}
        <section id="roadmap" className="roadmap-section">
          <div className="container">
            <div className="roadmap-sticky-container">
              <div className="uni-section-header roadmap-header-overlay">
                <h3 className="display-font uni-title-small">THE ROADMAP</h3>
                <h2 className="display-font uni-title-large">THE VISION</h2>
              </div>

              <div className="roadmap-wallet-scene">
                <div className="roadmap-wallet">
                  <div className="roadmap-wallet-texture"></div>
                  <div className="roadmap-wallet-stitch"></div>
                  <div className="roadmap-reveal-text">PULL TO REVEAL</div>
                  
                  <div className="roadmap-notes-stack">
                    {[
                      { phase: "PHASE 01", title: "THE LITTER", desc: "The official launch of 1,111 unique Base Cats. Focusing entirely on community building and a flawless minting experience.", color: "var(--uni-lavender)", rot: -2, z: 20 },
                      { phase: "PHASE 02", title: "CATNIP DROPS", desc: "Airdrops of exclusive digital accessories and companions for early holders. Premium physical pop-art apparel.", color: "#89CFF0", rot: 2, z: 15 },
                      { phase: "PHASE 03", title: "THE SCRATCHING POST", desc: "Expansion into the metaverse. Your Base Cat will serve as your unique 3D avatar in play-to-earn mini-games.", color: "var(--uni-pink)", rot: -1, z: 10 },
                      { phase: "PHASE 04", title: "THE CAT TREE", desc: "Real world events and continued expansion of the Base Cats brand globally. High-tier holder utility.", color: "var(--uni-yellow)", rot: 3, z: 5 },
                    ].map((item, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ y: 0, opacity: 0 }}
                        whileInView={{ y: idx * 40, opacity: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, type: "spring", bounce: 0.4, delay: idx * 0.2 }}
                        className="roadmap-sticky-note"
                        style={{ 
                          '--note-color': item.color,
                          rotateZ: `${item.rot}deg`,
                          zIndex: item.z,
                          position: idx === 0 ? 'relative' : 'absolute',
                          top: idx === 0 ? 0 : `${idx * 60}px`,
                          left: 0,
                          width: '100%',
                          transform: `translateZ(${item.z}px)`
                        } as React.CSSProperties}
                        whileHover={{ y: idx * 40 - 20, rotateZ: 0, scale: 1.02, zIndex: 30 }}
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
                { q: "WHAT IS THE TOTAL SUPPLY?", a: "There will only ever be 1,111 unique Base Cats in existence." },
                { q: "WHICH BLOCKCHAIN IS THIS ON?", a: "The collection is deploying exclusively on the Base Network to ensure lightning-fast transactions and virtually zero gas fees." },
                { q: "WHEN IS THE MINT?", a: "We are launching soon! Make sure to follow our Twitter and join the community to get whitelist and drop updates." },
                { q: "HOW DO I MINT?", a: "Minting will take place directly through a secure OpenSea Drop. Just connect your wallet when the drop is live." }
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
        <div className="container footer-content">
          <div className="nav-brand">BASE CATS</div>
          <div className="text-secondary font-medium">
            &copy; 2026 Base Cats NFT. All rights reserved.
          </div>
          <div className="flex gap-4">
            <a href="#" className="social-icon">
              <Twitter size={20} />
            </a>
            <a href="#" className="social-icon">
              <Github size={20} />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
