(function() {
  'use strict';

  // Конфигурация виджета из window.GridixWidgetConfig
  const config = window.GridixWidgetConfig || {};
  const baseUrl = window.location.protocol + '//' + window.location.host;
  
  // ID контейнера для виджета
  const containerId = 'gridix-widget-container';
  
  // Функция для загрузки CSS
  function loadCSS(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }
  
  // Функция для загрузки данных
  function loadData(url) {
    return fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      });
  }
  
  // Функция для создания HTML структуры виджета
  function createWidgetHTML(data) {
    const { projects } = data;
    
    if (config.type === 'projects') {
      return createProjectsListHTML(projects);
    } else if (config.type === 'project') {
      const project = projects[0]; // Для одного проекта
      return createProjectWidgetHTML(project);
    }
    
    return '<div>Ошибка конфигурации виджета</div>';
  }
  
  // Создание HTML для списка проектов
  function createProjectsListHTML(projects) {
    const projectsHTML = projects.map(project => `
      <div class="gridix-project-card" data-project-id="${project.id}">
        <div class="gridix-project-image">
          ${project.image_url ? `<img src="${project.image_url}" alt="${project.name}" />` : '<div class="gridix-placeholder-image"></div>'}
        </div>
        <div class="gridix-project-info">
          <h3 class="gridix-project-title">${project.name}</h3>
          <p class="gridix-project-description">${project.description || ''}</p>
          ${project.min_price ? `<div class="gridix-project-price">от ${project.min_price.toLocaleString()} ₽</div>` : ''}
          <button class="gridix-project-button" onclick="GridixWidget.openProject('${project.id}', '${project.slug || ''}')">
            Подробнее
          </button>
        </div>
      </div>
    `).join('');
    
    return `
      <div class="gridix-widget">
        <div class="gridix-projects-grid">
          ${projectsHTML}
        </div>
      </div>
    `;
  }
  
  // Создание HTML для одного проекта
  function createProjectWidgetHTML(project) {
    return `
      <div class="gridix-widget">
        <div class="gridix-project-single">
          <div class="gridix-project-header">
            <h2 class="gridix-project-title">${project.name}</h2>
            <p class="gridix-project-description">${project.description || ''}</p>
          </div>
          <div class="gridix-project-content">
            ${project.image_url ? `<img src="${project.image_url}" alt="${project.name}" class="gridix-project-main-image" />` : ''}
            <button class="gridix-project-button" onclick="GridixWidget.openProject('${project.id}', '${project.slug || ''}')">
              Смотреть планировки
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  // CSS стили для виджета
  const widgetCSS = `
    .gridix-widget {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      max-width: 100%;
      margin: 0 auto;
    }
    
    .gridix-projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      padding: 20px 0;
    }
    
    .gridix-project-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      background: white;
    }
    
    .gridix-project-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .gridix-project-image {
      height: 200px;
      overflow: hidden;
      background: #f8fafc;
    }
    
    .gridix-project-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .gridix-placeholder-image {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
    }
    
    .gridix-project-info {
      padding: 20px;
    }
    
    .gridix-project-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #1e293b;
    }
    
    .gridix-project-description {
      font-size: 14px;
      color: #64748b;
      margin: 0 0 12px 0;
      line-height: 1.5;
    }
    
    .gridix-project-price {
      font-size: 18px;
      font-weight: 700;
      color: #059669;
      margin: 0 0 16px 0;
    }
    
    .gridix-project-button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;
      width: 100%;
    }
    
    .gridix-project-button:hover {
      background: #2563eb;
    }
    
    .gridix-project-single {
      text-align: center;
      padding: 40px 20px;
    }
    
    .gridix-project-header {
      margin-bottom: 30px;
    }
    
    .gridix-project-main-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    @media (max-width: 768px) {
      .gridix-projects-grid {
        grid-template-columns: 1fr;
        padding: 10px 0;
        gap: 15px;
      }
      
      .gridix-project-info {
        padding: 15px;
      }
      
      .gridix-project-single {
        padding: 20px 10px;
      }
    }
  `;
  
  // Главный объект виджета
  window.GridixWidget = {
    init: function() {
      this.loadWidget();
    },
    
    loadWidget: function() {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error('Gridix Widget: Container not found');
        return;
      }
      
      // Добавляем CSS стили
      this.injectCSS();
      
      // Загружаем данные и создаем виджет
      this.loadWidgetData()
        .then(data => {
          container.innerHTML = createWidgetHTML(data);
        })
        .catch(error => {
          console.error('Gridix Widget: Error loading data', error);
          container.innerHTML = '<div class="gridix-widget"><p>Ошибка загрузки виджета</p></div>';
        });
    },
    
    injectCSS: function() {
      const style = document.createElement('style');
      style.textContent = widgetCSS;
      document.head.appendChild(style);
    },
    
    loadWidgetData: function() {
      let apiUrl = '';
      
      if (config.type === 'projects' && config.userId) {
        apiUrl = `${baseUrl}/api/widget/projects/${config.userId}?lang=${config.language || 'ru'}`;
      } else if (config.type === 'project') {
        if (config.projectSlug) {
          apiUrl = `${baseUrl}/api/widget/project/${config.projectSlug}?lang=${config.language || 'ru'}`;
        } else if (config.projectId) {
          apiUrl = `${baseUrl}/api/widget/project/id/${config.projectId}?lang=${config.language || 'ru'}`;
        }
      }
      
      if (!apiUrl) {
        return Promise.reject(new Error('Invalid widget configuration'));
      }
      
      return loadData(apiUrl);
    },
    
    openProject: function(projectId, projectSlug) {
      const url = projectSlug 
        ? `${baseUrl}/${config.language || 'ru'}/project/${projectSlug}`
        : `${baseUrl}/${config.language || 'ru'}/project/id/${projectId}`;
      
      window.open(url, '_blank');
    }
  };
  
  // Автоматическая инициализация виджета
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      GridixWidget.init();
    });
  } else {
    GridixWidget.init();
  }
  
})();
