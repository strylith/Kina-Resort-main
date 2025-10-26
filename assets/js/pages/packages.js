import { createLuxuryCard, createPackagesGrid, samplePackages, allPackages, createCategoryCard } from '../components/luxuryCard.js';
import { initPackagesSlider } from '../components/packagesSlider.js';
import { openCalendarModal } from '../components/calendarModal.js';
import { openBookingModal } from '../components/bookingModal.js';
import { bookingState } from '../utils/bookingState.js';

export async function PackagesPage(){
  const data = [
    { id:'lux-rooms', title:'Luxury Rooms', img:'images/kina1.jpg', price:'₱6,500+/night', desc:'Spacious rooms with ocean views, modern bath, and breakfast.' },
    { id:'infinity-pool', title:'Infinity Pool Access', img:'images/kina2.jpg', price:'Included', desc:'Sweeping horizon pool perfect for sunny afternoons.' },
    { id:'beach-cottages', title:'Beachfront Cottages', img:'images/kina3.jpg', price:'₱7,500+/night', desc:'Private veranda, direct beach access, ideal for couples.' },
    { id:'dining', title:'Gourmet Dining Options', img:'images/kina1.jpg', price:'Varies', desc:'Seafood-forward menus and tropical cocktails.' },
    { id:'water-sports', title:'Water Sports', img:'images/kina2.jpg', price:'₱800+/hour', desc:'Kayaks, paddleboards, and snorkeling gear.' },
    { id:'day-pass', title:'Day Pass', img:'images/kina3.jpg', price:'₱1,200', desc:'Pool + facilities access for day visitors.' },
  ];

  function card(p){
    return `
    <article class="package-card" data-id="${p.id}">
      <div class="package-media" style="background-image:url('${p.img}')"></div>
      <div class="package-meta">
        <div class="package-title">${p.title}</div>
        <div class="package-price">${p.price}</div>
      </div>
      <div class="package-overlay">
        <h4>${p.title}</h4>
        <p>${p.desc}</p>
        <small>💡 Perfect for clear weather days</small>
        <div class="package-cta">
          <a class="btn primary" href="#/rooms">Book Now</a>
          <a class="btn" href="#/rooms">Learn More</a>
        </div>
      </div>
    </article>`;
  }

  window.kinaFilterPackages = (q) => {
    const val = (q||'').toLowerCase();
    document.querySelectorAll('.package-card').forEach(node => {
      const id = node.getAttribute('data-id')||'';
      node.style.display = id.includes(val) ? '' : 'none';
    });
  };

      return `
        <section class="packages-section">
          <!-- Header spacer to prevent overlap -->
          <div class="header-spacer"></div>
          
          <div class="container">
            <!-- Modern Search and Filter Controls -->
            <div class="search-filter-wrapper" style="background: linear-gradient(135deg, var(--color-accent) 0%, #2c5aa0 100%); position: relative; overflow: hidden; margin: -20px -20px 40px -20px; border-radius: 0 0 20px 20px; padding: 20px 0;">
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('images/kina1.jpg') center/cover; opacity: 0.1; z-index: 0;"></div>
              <div style="position: relative; z-index: 1;">
            <div class="search-filter-container">
              <div class="search-box">
                <div class="search-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </div>
                <input 
                  type="text" 
                  id="package-search" 
                  placeholder="Search packages..." 
                  class="search-input"
                  onkeyup="filterPackages()"
                />
                <button class="clear-search" onclick="clearSearch()" style="display: none;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              <div class="filter-tabs">
                <button class="filter-tab active" data-category="" onclick="setActiveFilter(this, '')">All</button>
                <button class="filter-tab" data-category="rooms" onclick="setActiveFilter(this, 'rooms')">Rooms</button>
                <button class="filter-tab" data-category="cottages" onclick="setActiveFilter(this, 'cottages')">Cottages</button>
                <button class="filter-tab" data-category="function-halls" onclick="setActiveFilter(this, 'function-halls')">Function Halls</button>
              </div>
            </div>
              </div>
            </div>
        
        <!-- Rooms Section -->
        <div class="package-section" id="rooms-section">
          <h3 class="section-title">Rooms & Suites</h3>
          <div class="category-card-container" id="rooms-container">
            <!-- Category card will be inserted here -->
          </div>
        </div>
        
        <!-- Cottages Section -->
        <div class="package-section" id="cottages-section">
          <h3 class="section-title">Cottage</h3>
          <div class="category-cards-grid" id="cottages-container">
            <!-- Cottage cards will be inserted here -->
          </div>
        </div>
        
        <!-- Function Halls Section -->
        <div class="package-section" id="function-halls-section">
          <h3 class="section-title">Function Hall Services</h3>
          <div class="category-card-container" id="function-halls-container">
            <!-- Category card will be inserted here -->
          </div>
        </div>
      </div>
      
      <style>
        .packages-hero {
          background: linear-gradient(135deg, var(--color-accent) 0%, #2c5aa0 100%);
          padding: 120px 0 40px 0;
          margin: 0 -20px 0 -20px;
          border-radius: 0 0 20px 20px;
          position: relative;
          overflow: hidden;
        }
        
        .packages-hero .container {
          max-width: 1000px;
          position: relative;
          z-index: 1;
        }
        
        .packages-hero::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('images/kina2.jpg') center/cover;
          opacity: 0.1;
          z-index: 0;
        }
        
        .packages-hero h2 {
          color: white;
          font-size: 42px;
          font-weight: 700;
          margin: 0 0 24px 0;
          text-align: center;
        }
        
        .search-filter-container {
          background: white;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 0;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          border: none;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .search-box {
          position: relative;
          margin-bottom: 16px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #64748b;
          pointer-events: none;
          z-index: 2;
        }
        
        .search-input {
          width: 100%;
          height: 40px;
          padding: 0 40px 0 36px;
          border: 1px solid #d1d5db;
          border-radius: 20px;
          font-size: 14px;
          background: #f9fafb;
          transition: all 0.2s ease;
          outline: none;
          font-weight: 400;
        }
        
        .search-input:focus {
          background: white;
          border-color: #38b6ff;
          box-shadow: 0 0 0 3px rgba(56, 182, 255, 0.1);
        }
        
        .search-input::placeholder {
          color: #9ca3af;
          font-weight: 400;
        }
        
        .clear-search {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 2;
        }
        
        .clear-search:hover {
          color: #64748b;
          transform: translateY(-50%) scale(1.1);
        }
        
        .filter-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .filter-tab {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 16px;
          background: #f9fafb;
          color: #6b7280;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          white-space: nowrap;
        }
        
        .filter-tab:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }
        
        .filter-tab.active {
          background: #38b6ff;
          border-color: #38b6ff;
          color: white;
          box-shadow: 0 2px 8px rgba(56, 182, 255, 0.2);
        }
        
        .filter-tab.active:hover {
          background: #2a9ce8;
          border-color: #2a9ce8;
        }
        
        @media (max-width: 768px) {
          .search-filter-container {
            padding: 16px;
            margin-bottom: 20px;
            margin-left: 16px;
            margin-right: 16px;
          }
          
          .search-box {
            max-width: 100%;
          }
          
          .search-input {
            height: 38px;
            font-size: 14px;
          }
          
          .filter-tabs {
            gap: 4px;
          }
          
          .filter-tab {
            padding: 6px 12px;
            font-size: 12px;
          }
        }
        
        .package-section {
          margin-bottom: 60px;
          background: transparent;
          border-radius: 0;
          padding: 0;
          box-shadow: none;
        }
        
        .section-title {
          font-size: 36px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }
        
        .section-title::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 0;
          width: 100px;
          height: 3px;
          background: linear-gradient(90deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
          border-radius: 2px;
          box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
        }
        
        
        .packages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
          margin: 30px 0;
        }
        
        .package-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          position: relative;
          min-height: 320px;
        }
        
        .package-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        
        .package-media {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transition: filter 0.4s ease, transform 0.4s ease;
        }
        
        .package-card:hover .package-media {
          filter: blur(2px) brightness(0.9);
          transform: scale(1.05);
        }
        
        .package-meta {
          position: absolute;
          left: 16px;
          bottom: 16px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(8px);
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.2);
        }
        
        .package-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 4px;
          color: var(--color-text);
        }
        
        .package-price {
          color: var(--color-accent);
          font-weight: 600;
          font-size: 16px;
        }
        
        .package-overlay {
          position: absolute;
          top: 0;
          right: -100%;
          bottom: 0;
          width: 100%;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(8px);
          transition: right 0.4s ease;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 20px;
          border-left: 1px solid rgba(255,255,255,0.2);
        }
        
        .package-card:hover .package-overlay {
          right: 0;
        }
        
        .package-overlay h4 {
          margin: 0;
          font-size: 22px;
          color: var(--color-text);
          font-weight: 600;
        }
        
        .package-overlay p {
          color: var(--color-muted);
          margin: 0;
          line-height: 1.5;
          flex: 1;
        }
        
        .package-overlay small {
          color: var(--color-muted);
          font-style: italic;
        }
        
        .package-cta {
          display: flex;
          gap: 8px;
          margin-top: auto;
        }
        
        .package-cta .btn {
          flex: 1;
          text-align: center;
        }
        
        .package-cta .btn.primary {
          font-weight: 600;
        }
        
        @media (max-width: 768px) {
          .packages-grid {
            grid-template-columns: 1fr;
          }
          
          .package-section {
            padding: 20px;
            margin-bottom: 40px;
          }
          
          .package-overlay {
            position: static;
            right: auto;
            width: auto;
            background: white;
            backdrop-filter: none;
            border-left: 0;
            padding: 16px;
            transition: none;
          }
          
          .package-card:hover .package-media {
            filter: none;
            transform: none;
          }
          
          .package-card:hover .package-overlay {
            right: auto;
          }
        }

        /* Category Card Styles */
        .category-card-container {
          display: flex;
          justify-content: center;
          margin: 30px 0;
        }

        .category-card-container .category-card {
          max-width: 800px;
        }

        #rooms-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .category-cards-grid {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin: 30px 0;
          align-items: flex-start;
        }

        .category-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          padding: 0;
          max-width: 100%;
          width: 100%;
          transition: box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1), flex-grow 0.4s ease;
          cursor: pointer;
          position: relative;
          overflow: visible;
          display: flex;
          flex-direction: column;
        }

        .category-card:hover {
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        /* Cottages grid - allow horizontal expansion */
        .category-cards-grid .category-card {
          flex: 1;
          min-width: 300px;
          max-width: 400px;
          transition: box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .category-cards-grid .category-card:hover {
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
          z-index: 10;
        }

        .category-content {
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 20px;
        }

        .category-image {
          width: 100%;
          height: 250px;
          border-radius: 12px 12px 0 0;
          overflow: hidden;
          flex-shrink: 0;
        }

        .category-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .category-card:hover .category-image img {
          transform: scale(1.05);
        }

        .category-info-collapsed {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .category-title {
          font-size: 28px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
          flex: 1;
        }

        .category-price {
          font-size: 24px;
          font-weight: 600;
          color: var(--color-accent);
          white-space: nowrap;
          position: relative;
          z-index: 1;
        }

        .category-meta {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 4px;
          line-height: 1.5;
        }

        .category-capacity,
        .category-count,
        .category-discount {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-muted);
          font-size: 14px;
          white-space: nowrap;
          height: 24px;
        }

        .category-capacity svg,
        .category-count svg {
          color: var(--color-accent);
        }

        .category-discount {
          color: #b8860b;
          font-weight: 600;
        }

        .category-discount svg {
          color: #b8860b;
        }

        .category-info-expanded {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e7efef;
          opacity: 0;
          max-height: 0;
          overflow: hidden;
          transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .category-card:hover .category-info-expanded {
          opacity: 1;
          max-height: 800px;
        }

        .category-description {
          color: var(--color-muted);
          line-height: 1.6;
          margin: 0 0 20px 0;
          font-size: 15px;
        }

        .discount-details h4 {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 12px 0;
        }

        .discount-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          color: var(--color-muted);
          font-size: 14px;
        }

        .discount-item svg {
          color: var(--color-accent);
          flex-shrink: 0;
        }

        .discount-item strong {
          color: var(--color-text);
          font-weight: 600;
        }

        .category-book-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px 24px;
          background: var(--color-accent);
          color: white;
          border: none;
          border-radius: 999px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 16px;
        }

        .category-book-btn:hover {
          background: #2a9ce8;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(56, 182, 255, 0.4);
        }

        .category-book-btn:active {
          transform: translateY(0);
        }

        @media (max-width: 1200px) {
          .category-cards-grid .category-card {
            min-width: 280px;
            max-width: 350px;
          }
        }

        @media (max-width: 768px) {
          .category-card {
            padding: 20px;
          }

          .category-image {
            height: 180px;
          }

          .category-cards-grid {
            flex-direction: column;
          }

          .category-title {
            font-size: 22px;
          }

          .category-price {
            font-size: 20px;
          }

          .category-info-expanded {
            max-height: none !important;
            opacity: 1 !important;
            margin-top: 20px;
          }
        }

        /* Room Selection Styles */
        .back-to-calendar-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--color-accent);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .back-to-calendar-btn:hover {
          background: #2a9ce8;
          transform: translateY(-2px);
        }

        .exit-selection-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .exit-selection-btn:hover {
          background: #dc2626;
          transform: translateY(-2px);
        }

        .room-selection-header {
          width: 100%;
          margin-bottom: 30px;
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: space-between;
        }

        .room-selection-header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .room-selection-header-right {
          display: flex;
          gap: 12px;
        }

        .room-selection-header > div {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .room-selection-header h4 {
          font-size: 24px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
        }

        .room-selection-header p {
          color: var(--color-muted);
          font-size: 14px;
          margin: 0;
        }

        .room-selection-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin: 30px auto;
          max-width: 100%;
        }

        .room-selection-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .room-selection-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .room-selection-card.selected {
          border-color: var(--color-accent);
          background: #f0f9ff;
          box-shadow: 0 8px 24px rgba(56, 182, 255, 0.2);
        }

        .room-card-image {
          position: relative;
          width: 100%;
          height: 200px;
          overflow: hidden;
        }

        .room-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .room-selection-card:hover .room-card-image img {
          transform: scale(1.05);
        }

        .room-selection-indicator {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          background: var(--color-accent);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .room-selection-card.selected .room-selection-indicator {
          opacity: 1;
        }

        .room-selection-indicator svg {
          color: white;
        }

        .room-card-content {
          padding: 20px;
        }

        .room-card-content h4 {
          font-size: 20px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 8px 0;
        }

        .room-price {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-accent);
          margin: 0 0 16px 0;
        }

        .room-select-btn {
          width: 100%;
          padding: 12px 24px;
          background: var(--color-accent);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .room-select-btn:hover {
          background: #2a9ce8;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(56, 182, 255, 0.4);
        }

        .room-selection-card.selected .room-select-btn {
          background: #2a9ce8;
        }

        .floating-continue-btn {
          position: fixed;
          bottom: 30px;
          right: 30px;
          padding: 16px 32px;
          background: var(--color-accent);
          color: white;
          border: none;
          border-radius: 999px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(56, 182, 255, 0.4);
          transition: all 0.3s ease;
          z-index: 1000;
        }

        .floating-continue-btn:hover:not(:disabled) {
          background: #2a9ce8;
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(56, 182, 255, 0.5);
        }

        .floating-continue-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          transform: none;
        }

        .no-rooms-available {
          text-align: center;
          padding: 60px 20px;
          background: #f8fafc;
          border-radius: 12px;
        }

        .no-rooms-available p {
          font-size: 16px;
          color: var(--color-muted);
          margin-bottom: 24px;
        }

        @media (max-width: 1024px) {
          .room-selection-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .room-selection-grid {
            grid-template-columns: 1fr;
          }

          .room-selection-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .room-selection-header-left,
          .room-selection-header-right {
            width: 100%;
          }

          .floating-continue-btn {
            bottom: 20px;
            right: 20px;
            left: 20px;
            width: auto;
          }
        }
      </style>
    </section>`;
}

// Initialize category cards after page loads
export function initLuxuryPackages() {
  // Wait for DOM to be ready
  setTimeout(() => {
    // Initialize each section
    initializeCategorySection('rooms', allPackages.rooms);
    initializeCottagesSection('cottages', allPackages.cottages);
    initializeCategorySection('function-halls', allPackages.functionHalls);
  }, 100);
}

// Initialize a specific category section (for single cards)
function initializeCategorySection(sectionId, packages) {
  const container = document.getElementById(`${sectionId}-container`);
  if (!container || !packages || packages.length === 0) return;
  
  // Clear existing content
  container.innerHTML = '';
  
  // Create category data based on section
  let categoryData;
  
  if (sectionId === 'rooms') {
    categoryData = {
      title: 'Standard Room',
      price: '₱5,500/night',
      capacity: 4,
      availableCount: '4 rooms',
      description: 'Comfortable rooms with air conditioning, private bathroom, and garden view. All 4 rooms are identically designed with modern amenities and stunning garden views.',
      category: 'rooms',
      image: 'images/kina1.jpg'
    };
  } else if (sectionId === 'function-halls') {
    const hallCount = packages.length;
    const minCapacity = Math.min(...packages.map(p => p.capacity || 100));
    const maxCapacity = Math.max(...packages.map(p => p.capacity || 200));
    
    categoryData = {
      title: 'Function Hall',
      price: '₱10,000 - ₱15,000/day',
      capacity: maxCapacity,
      availableCount: `${hallCount} halls`,
      description: 'Spacious function halls perfect for weddings, conferences, and large events. Includes tables, chairs, sound system, and air conditioning.',
      category: 'function-halls',
      image: 'images/Function Hall.JPG'
    };
  }
  
  // Create and append category card
  const categoryCard = createCategoryCard(categoryData);
  container.appendChild(categoryCard);
}

// Initialize cottages section with individual expandable cards
function initializeCottagesSection(sectionId, packages) {
  const container = document.getElementById(`${sectionId}-container`);
  if (!container || !packages || packages.length === 0) return;
  
  // Clear existing content
  container.innerHTML = '';
  
  // Create individual cards for each cottage
  packages.forEach((cottageData) => {
    const categoryData = {
      title: cottageData.title,
      price: cottageData.price,
      capacity: cottageData.capacity || 6,
      availableCount: '1 cottage',
      description: cottageData.description,
      category: cottageData.category,
      image: cottageData.image
    };
    
    const cottageCard = createCategoryCard(categoryData);
    container.appendChild(cottageCard);
  });
}




// Modern search and filter functions
window.filterPackages = function() {
  const searchTerm = document.getElementById('package-search')?.value.toLowerCase() || '';
  const activeTab = document.querySelector('.filter-tab.active');
  const categoryFilter = activeTab?.getAttribute('data-category') || '';
  
  // Show/hide clear button
  const clearBtn = document.querySelector('.clear-search');
  if (clearBtn) {
    clearBtn.style.display = searchTerm ? 'block' : 'none';
  }
  
  // Get all package sections
  const sections = ['rooms', 'cottages', 'function-halls'];
  
  sections.forEach(sectionId => {
    const section = document.getElementById(`${sectionId}-section`);
    const card = section?.querySelector('.category-card');
    
    if (!card) return;
    
    const title = card.querySelector('.category-title')?.textContent.toLowerCase() || '';
    const description = card.querySelector('.category-description')?.textContent.toLowerCase() || '';
    const category = card.getAttribute('data-category') || '';
    
    const matchesSearch = !searchTerm || title.includes(searchTerm) || description.includes(searchTerm);
    const matchesCategory = !categoryFilter || category === categoryFilter;
    
    if (matchesSearch && matchesCategory) {
      section.style.display = 'block';
    } else {
      section.style.display = 'none';
    }
  });
};

// Set active filter tab
window.setActiveFilter = function(button, category) {
  // Remove active class from all tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Add active class to clicked tab
  button.classList.add('active');
  
  // Trigger filter
  filterPackages();
};

// Clear search function
window.clearSearch = function() {
  const searchInput = document.getElementById('package-search');
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
    filterPackages();
  }
};

// Show available rooms after date selection
window.showAvailableRooms = async function(checkinDate, checkoutDate) {
  console.log('[showAvailableRooms] Starting with dates:', checkinDate, checkoutDate);
  
  // Set dates in booking state
  bookingState.setDates(checkinDate, checkoutDate);
  
  // Get available rooms from database
  const availableRooms = await bookingState.getAvailableRooms(checkinDate, checkoutDate);
  
  console.log('[showAvailableRooms] Available rooms count:', availableRooms.length, 'Rooms:', availableRooms);
  
  // Find rooms section and replace with room selection view
  const roomsSection = document.getElementById('rooms-section');
  const roomsContainer = document.getElementById('rooms-container');
  
  if (!roomsSection || !roomsContainer) return;
  
  // Clear existing content
  roomsContainer.innerHTML = '';
  
  // Add header with Change Dates button
  const headerInfo = document.createElement('div');
  headerInfo.className = 'room-selection-header';
  headerInfo.innerHTML = `
    <div class="room-selection-header-left">
      <button class="back-to-calendar-btn" onclick="openCalendarModal('Standard Room', 4, 'rooms')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Change Dates
      </button>
      <div>
        <h4>Select Your Rooms</h4>
        <p>Check-in: ${checkinDate} | Check-out: ${checkoutDate}</p>
      </div>
    </div>
    <div class="room-selection-header-right">
      <button class="exit-selection-btn" onclick="exitRoomSelection()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Cancel
      </button>
    </div>
  `;
  
  roomsContainer.appendChild(headerInfo);
  
  // Create grid for room cards
  const roomsGrid = document.createElement('div');
  roomsGrid.className = 'room-selection-grid';
  roomsGrid.id = 'room-selection-grid';
  
  if (availableRooms.length === 0) {
    // No rooms available
    console.log('[showAvailableRooms] No rooms available, showing message');
    roomsGrid.innerHTML = `
      <div class="no-rooms-available" style="grid-column: 1 / -1; padding: 40px; text-align: center; background: #fff3cd; border-radius: 12px; margin: 20px 0;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f57c00" stroke-width="2" style="margin: 0 auto 16px;">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <h3 style="color: #d84315; margin-bottom: 12px;">No Rooms Available</h3>
        <p style="color: #666; margin-bottom: 20px;">All rooms are fully booked for the selected dates (${checkinDate} to ${checkoutDate}).</p>
        <button class="btn" onclick="openCalendarModal('Standard Room', 4, 'rooms')" style="background: #1976d2; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">Try Different Dates</button>
      </div>
    `;
  } else {
    // Create room cards
    availableRooms.forEach(roomId => {
      const roomCard = createRoomSelectionCard(roomId);
      roomsGrid.appendChild(roomCard);
    });
  }
  
  roomsContainer.appendChild(roomsGrid);
  
  // Add floating continue button
  addFloatingContinueButton();
};

// Create individual room selection card
function createRoomSelectionCard(roomId) {
  const card = document.createElement('div');
  card.className = 'room-selection-card';
  card.setAttribute('data-room-id', roomId);
  
  card.innerHTML = `
    <div class="room-card-image">
      <img src="images/kina1.jpg" alt="${roomId}" loading="lazy">
      <div class="room-selection-indicator">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <path d="M20 6L9 17l-5-5"></path>
        </svg>
      </div>
    </div>
    <div class="room-card-content">
      <h4>${roomId}</h4>
      <p class="room-price">₱5,500/night</p>
      <button class="room-select-btn" onclick="toggleRoomSelection('${roomId}')">Select Room</button>
    </div>
  `;
  
  return card;
}

// Toggle room selection
window.toggleRoomSelection = function(roomId) {
  bookingState.toggleRoom(roomId);
  
  // Update visual state
  const card = document.querySelector(`.room-selection-card[data-room-id="${roomId}"]`);
  if (card) {
    if (bookingState.selectedRooms.includes(roomId)) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  }
  
  // Update continue button
  updateFloatingContinueButton();
};

// Add floating continue button
function addFloatingContinueButton() {
  // Remove existing button if present
  const existingBtn = document.getElementById('floating-continue-btn');
  if (existingBtn) {
    existingBtn.remove();
  }
  
  const btn = document.createElement('button');
  btn.id = 'floating-continue-btn';
  btn.className = 'floating-continue-btn';
  btn.onclick = function() {
    if (bookingState.selectedRooms.length > 0) {
      // Open booking modal with selected rooms
      openBookingModal('room', 'Room Booking', {
        checkin: bookingState.dates.checkin,
        checkout: bookingState.dates.checkout,
        selectedRooms: bookingState.selectedRooms,
        fromDateSelection: true
      });
    }
  };
  
  document.body.appendChild(btn);
  updateFloatingContinueButton();
}

// Update floating continue button text
function updateFloatingContinueButton() {
  const btn = document.getElementById('floating-continue-btn');
  if (btn) {
    const count = bookingState.selectedRooms.length;
    btn.textContent = count > 0 
      ? `Continue with ${count} room${count > 1 ? 's' : ''}` 
      : 'Select at least one room';
    btn.disabled = count === 0;
  }
}

// Exit room selection mode and return to standard room card
window.exitRoomSelection = function() {
  // Clear booking state
  bookingState.reset();
  
  // Remove floating continue button
  const floatingBtn = document.getElementById('floating-continue-btn');
  if (floatingBtn) {
    floatingBtn.remove();
  }
  
  // Reset rooms section to show Standard Room card
  const roomsSection = document.getElementById('rooms-section');
  const roomsContainer = document.getElementById('rooms-container');
  
  if (roomsSection && roomsContainer) {
    roomsContainer.innerHTML = '<!-- Category card will be inserted here -->';
    
    // Re-initialize the section
    setTimeout(() => {
      initializeCategorySection('rooms', allPackages.rooms);
    }, 100);
  }
};


