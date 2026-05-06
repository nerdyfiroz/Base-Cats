document.addEventListener('DOMContentLoaded', () => {
    // Gallery Data Generation
    const galleryContainer = document.getElementById('gallery-container');
    const loadMoreBtn = document.getElementById('load-more');
    
    let currentLoaded = 0;
    const itemsPerLoad = 8;
    
    // Function to generate a random price
    const getRandomPrice = () => {
        return (Math.random() * (0.5 - 0.05) + 0.05).toFixed(3);
    };

    // Load Gallery Items
    const loadGalleryItems = () => {
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < itemsPerLoad; i++) {
            currentLoaded++;
            // The folder has images like cat_nft_001.png, cat_nft_002.png etc.
            // Let's format the number with leading zeros
            let formattedNumber = currentLoaded.toString().padStart(3, '0');
            
            // To be safe, skip if we exceed 1111
            if(currentLoaded > 1111) {
                loadMoreBtn.style.display = 'none';
                break;
            }

            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            item.innerHTML = `
                <div class="gallery-img-wrapper">
                    <img src="NFTs/cat_nft_${formattedNumber}.png" alt="Base Cat #${currentLoaded}" loading="lazy" onerror="this.src='NFTs/cat_nft_001.png'">
                </div>
                <div class="gallery-info">
                    <h3>Base Cat #${currentLoaded}</h3>
                    <span class="price">${getRandomPrice()} ETH</span>
                </div>
            `;
            
            // Add slight stagger to animation
            item.style.animation = \`fadeInUp 0.5s ease forwards \${i * 0.1}s\`;
            item.style.opacity = '0';
            
            fragment.appendChild(item);
        }
        
        galleryContainer.appendChild(fragment);
    };

    // Initial Load
    loadGalleryItems();

    // Load More Button Event
    loadMoreBtn.addEventListener('click', loadGalleryItems);

    // Smooth Scrolling for Anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Simple Parallax Effect for Background Orbs
    window.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        const orb1 = document.querySelector('.orb-1');
        const orb2 = document.querySelector('.orb-2');
        
        if(orb1 && orb2) {
            orb1.style.transform = \`translate(\${x * 30}px, \${y * 30}px)\`;
            orb2.style.transform = \`translate(\${x * -40}px, \${y * -40}px)\`;
        }
    });
});

// Add animation keyframes via JS for dynamic styling
const style = document.createElement('style');
style.textContent = \`
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
\`;
document.head.appendChild(style);
