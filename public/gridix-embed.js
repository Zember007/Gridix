(function() {
  'use strict';

  // Configuration
  const GRIDIX_API_BASE = 'https://gridix.live';
  
  const WIDGET_CSS = `
    .gridix-embed-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .gridix-embed-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      background: #f9fafb;
    }

    .gridix-embed-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e5e7eb;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      animation: gridix-spin 1s linear infinite;
    }

    @keyframes gridix-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .gridix-embed-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }

    .gridix-embed-title {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px 0;
    }

    .gridix-embed-subtitle {
      font-size: 16px;
      opacity: 0.9;
      margin: 0;
    }

    .gridix-embed-content {
      padding: 24px;
    }

    .gridix-project-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
      margin-top: 24px;
    }

    .gridix-project-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .gridix-project-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }

    .gridix-project-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .gridix-project-info {
      padding: 20px;
    }

    .gridix-project-name {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #1f2937;
    }

    .gridix-project-address {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 12px 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .gridix-project-price {
      font-size: 18px;
      font-weight: 600;
      color: #059669;
      margin: 0 0 16px 0;
    }

    .gridix-project-button {
      width: 100%;
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .gridix-project-button:hover {
      background: #2563eb;
    }

    .gridix-single-project {
      max-width: 100%;
    }

    .gridix-apartments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }

    .gridix-apartment-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.2s;
      cursor: pointer;
    }

    .gridix-apartment-card:hover {
      background: #f3f4f6;
      transform: translateY(-2px);
    }

    .gridix-apartment-card.available {
      border-left: 4px solid #10b981;
    }

    .gridix-apartment-card.sold {
      border-left: 4px solid #ef4444;
      opacity: 0.7;
    }

    .gridix-apartment-card.reserved {
      border-left: 4px solid #f59e0b;
    }

    .gridix-apartment-number {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }

    .gridix-apartment-details {
      font-size: 14px;
      color: #6b7280;
      margin: 4px 0;
    }

    .gridix-apartment-price {
      font-size: 16px;
      font-weight: 600;
      color: #059669;
      margin: 8px 0 0 0;
    }

    .gridix-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }

    @media (max-width: 768px) {
      .gridix-project-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .gridix-apartments-grid {
        grid-template-columns: 1fr;
      }

      .gridix-embed-header {
        padding: 16px;
      }

      .gridix-embed-title {
        font-size: 24px;
      }

      .gridix-embed-content {
        padding: 16px;
      }
    }
  `;

  // Utility functions
  function formatPrice(price, currency = 'USD') {
    if (!price) return 'Price on request';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(price);
  }

  function formatRooms(rooms) {
    if (rooms === 0) return 'Studio';
    return rooms === 1 ? '1 room' : `${rooms} rooms`;
  }

  // Main GridixEmbed class
  class GridixEmbed {
    constructor(options) {
      this.options = {
        container: null,
        projectId: null,
        userId: null,
        projectSlug: null,
        lang: 'en',
        theme: 'default',
        showHeader: true,
        ...options
      };

      this.container = typeof this.options.container === 'string' 
        ? document.querySelector(this.options.container)
        : this.options.container;

      if (!this.container) {
        console.error('GridixEmbed: Container not found');
        return;
      }

      this.init();
    }

    async init() {
      this.injectCSS();
      this.showLoading();
      
      try {
        const data = await this.fetchData();
        this.render(data);
      } catch (error) {
        console.error('GridixEmbed: Error loading data', error);
        this.showError('Failed to load project data');
      }
    }

    injectCSS() {
      if (!document.getElementById('gridix-embed-styles')) {
        const style = document.createElement('style');
        style.id = 'gridix-embed-styles';
        style.textContent = WIDGET_CSS;
        document.head.appendChild(style);
      }
    }

    showLoading() {
      this.container.innerHTML = `
        <div class="gridix-embed-container">
          <div class="gridix-embed-loading">
            <div class="gridix-embed-spinner"></div>
          </div>
        </div>
      `;
    }

    showError(message) {
      this.container.innerHTML = `
        <div class="gridix-embed-container">
          <div class="gridix-embed-content">
            <div class="gridix-error">${message}</div>
          </div>
        </div>
      `;
    }

    async fetchData() {
      const params = new URLSearchParams({
        lang: this.options.lang
      });

      if (this.options.projectId) {
        params.append('projectId', this.options.projectId);
      } else if (this.options.userId) {
        params.append('userId', this.options.userId);
      } else if (this.options.projectSlug) {
        params.append('projectSlug', this.options.projectSlug);
      }

      const response = await fetch(`${GRIDIX_API_BASE}/functions/v1/widget-embed-api?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    }

    render(data) {
      if (!data.success) {
        this.showError(data.error || 'Unknown error');
        return;
      }

      const { projects, apartments } = data;

      if (projects.length === 1 && apartments) {
        this.renderSingleProject(projects[0], apartments);
      } else {
        this.renderProjectsList(projects);
      }
    }

    renderSingleProject(project, apartments) {
      const availableApartments = apartments.filter(apt => apt.status === 'available');
      const soldApartments = apartments.filter(apt => apt.status === 'sold');
      const reservedApartments = apartments.filter(apt => apt.status === 'reserved');

      this.container.innerHTML = `
        <div class="gridix-embed-container gridix-single-project">
          ${this.options.showHeader ? `
            <div class="gridix-embed-header" style="${project.theme_color ? `background: ${project.theme_color}` : ''}">
              <h1 class="gridix-embed-title">${project.name}</h1>
              ${project.address ? `<p class="gridix-embed-subtitle">📍 ${project.address}</p>` : ''}
            </div>
          ` : ''}
          
          <div class="gridix-embed-content">
            ${project.description ? `<p>${project.description}</p>` : ''}
            
            <div style="display: flex; gap: 20px; margin: 16px 0; flex-wrap: wrap;">
              <div style="background: #ecfdf5; padding: 12px 16px; border-radius: 8px; border: 1px solid #a7f3d0;">
                <strong style="color: #065f46;">${availableApartments.length}</strong> Available
              </div>
              <div style="background: #fef2f2; padding: 12px 16px; border-radius: 8px; border: 1px solid #fecaca;">
                <strong style="color: #dc2626;">${soldApartments.length}</strong> Sold
              </div>
              <div style="background: #fffbeb; padding: 12px 16px; border-radius: 8px; border: 1px solid #fed7aa;">
                <strong style="color: #d97706;">${reservedApartments.length}</strong> Reserved
              </div>
            </div>

            <div class="gridix-apartments-grid">
              ${apartments.map(apartment => this.renderApartmentCard(apartment, project)).join('')}
            </div>
          </div>
        </div>
      `;

      this.attachApartmentClickHandlers(project);
    }

    renderProjectsList(projects) {
      this.container.innerHTML = `
        <div class="gridix-embed-container">
          ${this.options.showHeader ? `
            <div class="gridix-embed-header">
              <h1 class="gridix-embed-title">Real Estate Projects</h1>
              <p class="gridix-embed-subtitle">Discover amazing properties</p>
            </div>
          ` : ''}
          
          <div class="gridix-embed-content">
            <div class="gridix-project-grid">
              ${projects.map(project => this.renderProjectCard(project)).join('')}
            </div>
          </div>
        </div>
      `;

      this.attachProjectClickHandlers();
    }

    renderProjectCard(project) {
      return `
        <div class="gridix-project-card" data-project-id="${project.id}" data-project-slug="${project.slug || ''}">
          ${project.building_image_url ? 
            `<img src="${project.building_image_url}" alt="${project.name}" class="gridix-project-image" />` :
            `<div class="gridix-project-image"></div>`
          }
          <div class="gridix-project-info">
            <h3 class="gridix-project-name">${project.name}</h3>
            ${project.address ? `<p class="gridix-project-address">📍 ${project.address}</p>` : ''}
            ${project.min_price ? `<p class="gridix-project-price">From ${formatPrice(project.min_price, project.currency)}</p>` : ''}
            <button class="gridix-project-button">View Apartments</button>
          </div>
        </div>
      `;
    }

    renderApartmentCard(apartment, project) {
      return `
        <div class="gridix-apartment-card ${apartment.status}" data-apartment-id="${apartment.id}">
          <div class="gridix-apartment-number">Apt. ${apartment.apartment_number}</div>
          <div class="gridix-apartment-details">Floor: ${apartment.floor_number}</div>
          <div class="gridix-apartment-details">${formatRooms(apartment.rooms)}</div>
          <div class="gridix-apartment-details">${apartment.area} m²</div>
          <div class="gridix-apartment-price">${formatPrice(apartment.price, project.currency)}</div>
          <div class="gridix-apartment-details" style="text-transform: capitalize; margin-top: 8px;">
            Status: <strong>${apartment.status}</strong>
          </div>
        </div>
      `;
    }

    attachProjectClickHandlers() {
      const projectCards = this.container.querySelectorAll('.gridix-project-card');
      projectCards.forEach(card => {
        card.addEventListener('click', () => {
          const projectId = card.dataset.projectId;
          const projectSlug = card.dataset.projectSlug;
          
          const url = projectSlug 
            ? `${GRIDIX_API_BASE}/${this.options.lang}/project/${projectSlug}`
            : `${GRIDIX_API_BASE}/${this.options.lang}/project/id/${projectId}`;
            
          window.open(url, '_blank');
        });
      });
    }

    attachApartmentClickHandlers(project) {
      const apartmentCards = this.container.querySelectorAll('.gridix-apartment-card');
      apartmentCards.forEach(card => {
        if (card.classList.contains('available')) {
          card.addEventListener('click', () => {
            const apartmentId = card.dataset.apartmentId;
            const apartment = this.findApartmentById(apartmentId);
            
            if (apartment) {
              const projectPath = project.slug ? project.slug : `id/${project.id}`;
              const url = `${GRIDIX_API_BASE}/${this.options.lang}/project/${projectPath}/apartment/${apartment.apartment_number}`;
              window.open(url, '_blank');
            }
          });
        }
      });
    }

    findApartmentById(apartmentId) {
      // This would need to be stored in the class instance
      // For now, we'll construct a basic URL
      return { apartment_number: apartmentId };
    }
  }

  // Auto-initialize widgets on page load
  function autoInit() {
    const widgets = document.querySelectorAll('[data-gridix-embed]');
    widgets.forEach(widget => {
      const options = {
        container: widget,
        projectId: widget.dataset.projectId,
        userId: widget.dataset.userId,
        projectSlug: widget.dataset.projectSlug,
        lang: widget.dataset.lang || 'en',
        theme: widget.dataset.theme || 'default',
        showHeader: widget.dataset.showHeader !== 'false'
      };

      new GridixEmbed(options);
    });
  }

  // Expose to global scope
  window.GridixEmbed = GridixEmbed;

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

})();
