'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Github, Twitter, ExternalLink, ShieldCheck } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  
  const mintPrice = 0.05; // ETH
  const maxSupply = 1111;
  const openseaLink = "https://opensea.io/";

  useEffect(() => {
    setMounted(true);
    const initialItems = Array.from({ length: 4 }, (_, i) => i + 1);
    setItems(initialItems);
  }, []);

  const loadMore = () => {
    setLoading(true);
    setTimeout(() => {
      const nextItems = Array.from({ length: 4 }, (_, i) => items.length + i + 1);
      setItems((prev) => [...prev, ...nextItems]);
      setLoading(false);
    }, 800);
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
          <a href="#home">Home</a>
          <a href="#drop">The Drop</a>
          <a href="#sneak-peek">Sneak Peek</a>
          <a href="#roadmap">Roadmap</a>
        </div>
        <a href={openseaLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '12px 24px' }}>
          UNIVERSE
        </a>
      </nav>

      <main>
        {/* Hero Section */}
        <section id="home" className="hero">
          <div className="container hero-content">
            <motion.div 
              className="hero-title-container"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
            >
              <h1 className="hero-title">
                <span className="text-pink">THE</span> <span className="text-yellow">BASE</span> <br/>
                <span className="text-mint">CATS</span> <span className="text-blue">COLLECTION</span>
              </h1>
              
              {/* Floating Characters Integrated into Text */}
              <motion.img 
                src="/NFTs/cat_nft_001.png" 
                alt="Floating Cat 1"
                className="absolute -top-16 -left-10 w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white object-cover shadow-2xl z-20"
                animate={{ y: [-15, 15, -15], rotate: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <motion.img 
                src="/NFTs/cat_nft_002.png" 
                alt="Floating Cat 2"
                className="absolute top-1/2 -right-10 w-24 h-24 md:w-40 md:h-40 rounded-full border-4 border-white object-cover shadow-2xl z-20"
                animate={{ y: [15, -15, 15], rotate: [5, -5, 5] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <motion.img 
                src="/NFTs/cat_nft_003.png" 
                alt="Floating Cat 3"
                className="absolute -bottom-10 left-1/4 w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white object-cover shadow-2xl z-20"
                animate={{ y: [-10, 10, -10], rotate: [-10, 10, -10] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 2 }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </motion.div>

            <motion.p 
              className="hero-desc"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              The most playful and exclusive feline collection on the Base network. Secure your algorithmically generated Base Cat today.
            </motion.p>
            
            <motion.div 
              className="hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <a href={openseaLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Mint on OpenSea
              </a>
              <a href="#sneak-peek" className="btn btn-secondary">
                Explore Collection
              </a>
            </motion.div>
          </div>
        </section>

        {/* Drop Section */}
        <section id="drop" className="section relative">
          <div className="container relative z-10">
            <div className="section-header">
              <h2 className="section-title">
                OFFICIAL <span className="text-yellow">DROP</span>
              </h2>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mint-card max-w-lg mx-auto"
            >
              <div className="flex flex-col items-center justify-center text-center mb-8">
                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.9998 3.33331C10.7951 3.33331 3.33313 10.7952 3.33313 19.9999C3.33313 29.2046 10.7951 36.6666 19.9998 36.6666C29.2045 36.6666 36.6665 29.2046 36.6665 19.9999C36.6665 10.7952 29.2045 3.33331 19.9998 3.33331ZM24.4697 12.3857C24.4752 13.9213 23.3644 15.228 21.8402 15.4216C21.8402 15.4216 22.4239 12.3888 24.4697 12.3857ZM25.5904 26.2307C24.0858 27.2603 22.1287 27.6083 20.3013 27.2185C19.3496 27.0097 18.4237 26.5492 17.6534 25.8679C17.0601 25.3353 16.5925 24.6496 16.2917 23.8741C15.9388 22.9556 15.8236 21.9566 15.9555 20.984C16.1472 19.4673 16.8996 18.0673 18.069 17.0425C18.6657 16.5099 19.3621 16.0963 20.1245 15.8298C20.6698 15.6329 21.2386 15.5262 21.8159 15.5186C21.8159 15.5186 21.266 18.3976 19.3243 19.7289C17.9622 20.6558 16.2239 20.7229 16.2239 20.7229C16.2239 20.7229 17.6086 21.603 19.3093 21.5786C21.2223 21.5435 22.9463 20.4497 23.7548 18.6811C23.7548 18.6811 24.4623 21.6198 22.6517 23.6934C21.7583 24.7171 20.4287 25.3233 19.0494 25.3903C18.2323 25.4238 17.4182 25.2639 16.6806 24.9181C16.6806 24.9181 18.156 26.4352 20.5516 26.2646C22.6101 26.1139 24.5029 24.9395 25.5451 23.1558C25.5451 23.1558 26.1039 25.8679 25.5904 26.2307Z" fill="#89CFF0"/>
                  </svg>
                </div>
                <h3 className="display-font text-2xl mb-2 text-white">Verified OpenSea Drop</h3>
              </div>

              <div className="flex flex-col gap-4 mb-8">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="font-bold">Mint Price</span>
                  <span className="font-bold text-xl text-pink">{mintPrice} ETH</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="font-bold">Total Supply</span>
                  <span className="font-bold text-xl text-yellow">{maxSupply} Unique Cats</span>
                </div>
              </div>

              <a href={openseaLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full text-xl py-4">
                <span>MINT ON OPENSEA</span>
                <ExternalLink size={20} />
              </a>
              
              <div className="mt-6 flex justify-center items-center gap-2 text-sm text-mint">
                <ShieldCheck size={16} />
                <span className="font-bold">Verified Contract</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Sneak Peek Section */}
        <section id="sneak-peek" className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                SNEAK <span className="text-mint">PEEK</span>
              </h2>
            </div>

            <div className="gallery-grid">
              {items.map((item, index) => {
                const formattedNumber = (item + 10).toString().padStart(3, '0');
                
                return (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: (index % 4) * 0.1 }}
                    className="nft-item group"
                  >
                    <div className="nft-image-container">
                      <img 
                        src={`/NFTs/cat_nft_${formattedNumber}.png`} 
                        alt={`Base Cat Sneak Peek`}
                        onError={(e) => { e.currentTarget.src = `https://via.placeholder.com/400x400/1a1a2e/F4A7C5?text=Sneak+Peek+${formattedNumber}`; }}
                      />
                    </div>
                    <div className="nft-info">
                      <div className="nft-collection">UNREVEALED TRAIT</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {items.length < 12 && (
              <div className="flex justify-center mt-8">
                <button onClick={loadMore} disabled={loading} className="btn btn-secondary">
                  {loading ? 'LOADING...' : 'REVEAL MORE'}
                  {!loading && <ChevronDown size={20} />}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Roadmap */}
        <section id="roadmap" className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                THE <span className="text-blue">ROADMAP</span>
              </h2>
            </div>

            <div className="roadmap-container">
              {[
                { phase: "PHASE 1", title: "THE LITTER", desc: "Initial launch of 1,111 Base Cats via OpenSea Drop. Community building, marketing, and getting listed." },
                { phase: "PHASE 2", title: "CATNIP DROPS", desc: "Exclusive airdrops for holders. Merchandise store launch with premium physical apparel." },
                { phase: "PHASE 3", title: "THE SCRATCHING POST", desc: "Metaverse integration. Play-to-earn mini-games where your Base Cat serves as your avatar." },
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="roadmap-card"
                >
                  <div className="roadmap-phase">{item.phase}</div>
                  <h3 className="display-font roadmap-title">{item.title}</h3>
                  <p className="text-secondary font-medium">{item.desc}</p>
                </motion.div>
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
