(function(){
  'use strict';

  // Utility: debounce
  function debounce(fn, wait){
    let t; return function(...args){
      clearTimeout(t); t = setTimeout(()=>fn.apply(this,args), wait);
    };
  }

  // Autosave UI
  const autosave = {
    el: null,
    set(status){
      if(!this.el) return;
      const dot = this.el.querySelector('.dot');
      const text = this.el.querySelector('.text');
      if(status === 'saving'){
        dot.style.background = '#f59e0b';
        text.textContent = 'Saving…';
      } else {
        dot.style.background = '#10b981';
        text.textContent = 'Saved';
      }
    }
  };

  // Live bindings map: input[data-bind] -> preview element by id prefix p_
  const bindMap = {
    name: 'p_name',
    title: 'p_title',
    email: 'p_email',
    location: 'p_location',
    linkedin: 'p_linkedin',
    github: 'p_github',
    about: 'p_about',
    eduSchool: 'p_eduSchool',
    eduDegree: 'p_eduDegree',
    eduYears: 'p_eduYears',
  };

  function updateLink(el, value){
    if(!el) return;
    if(value){
      el.textContent = el.id.includes('linkedin') ? 'LinkedIn' : 'GitHub';
      el.setAttribute('href', value);
      el.parentElement.style.display = '';
    } else {
      el.removeAttribute('href');
    }
  }

  function initBindings(){
    const inputs = document.querySelectorAll('[data-bind]');
    const preview = {};
    Object.entries(bindMap).forEach(([k,id])=>preview[k]=document.getElementById(id));

    const saveDebounced = debounce(()=>autosave.set('saved'), 600);

    inputs.forEach(input => {
      const key = input.getAttribute('data-bind');
      input.addEventListener('input', ()=>{
        autosave.set('saving');
        const val = input.value.trim();
        const targetId = bindMap[key];
        const target = targetId ? document.getElementById(targetId) : null;
        if(!target) { saveDebounced(); return; }
        if(key === 'linkedin' || key === 'github'){
          updateLink(target, val);
        } else {
          target.textContent = val || target.dataset.placeholder || target.textContent;
        }
        saveDebounced();
      });
    });
  }

  function initAboutCounter(){
    const about = document.getElementById('about');
    const count = document.getElementById('aboutCount');
    if(!about || !count) return;
    const update = ()=>{ count.textContent = String(about.value.length); };
    about.addEventListener('input', update);
    update();
  }

  // Sections nav
  function initSections(){
    const links = document.querySelectorAll('.section-link');
    const cards = document.querySelectorAll('.section-card');
    links.forEach(link=>{
      link.addEventListener('click', ()=>{
        links.forEach(l=>l.classList.remove('active'));
        link.classList.add('active');
        const targetId = link.getAttribute('data-target');
        cards.forEach(c=>c.classList.remove('active'));
        const target = document.getElementById(targetId);
        if(target){ target.classList.add('active'); target.scrollIntoView({behavior:'smooth', block:'start'}); }
      });
    });
  }

  // Template switcher
  function initTemplateSwitcher(){
    const select = document.getElementById('templateSelect');
    const portfolio = document.getElementById('portfolio');
    if(!select || !portfolio) return;
    select.addEventListener('change', ()=>{
      portfolio.classList.remove('template-minimal','template-modern','template-creative');
      const val = select.value;
      portfolio.classList.add(`template-${val}`);
    });
  }

  // Skills chips
  function initSkills(){
    const input = document.getElementById('skillInput');
    const level = document.getElementById('skillLevel');
    const addBtn = document.getElementById('addSkill');
    const chips = document.getElementById('skillsChips');
    const previewList = document.getElementById('p_skills');
    if(!input || !addBtn || !chips || !previewList) return;

    function addSkill(name, lvl){
      if(!name) return;
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = `<span>${name} • ${lvl||level.value}</span><button class="remove" title="Remove" type="button">×</button>`;
      chips.appendChild(chip);
      renderSkills();
      input.value = '';
      autosave.set('saving'); saveDebounced();
    }

    function renderSkills(){
      previewList.innerHTML = '';
      chips.querySelectorAll('.chip span:first-child').forEach(el=>{
        const li = document.createElement('li');
        li.textContent = el.textContent;
        previewList.appendChild(li);
      });
    }

    const saveDebounced = debounce(()=>autosave.set('saved'), 600);

    addBtn.addEventListener('click', ()=> addSkill(input.value.trim(), level.value));
    input.addEventListener('keydown', e=>{
      if(e.key==='Enter') { e.preventDefault(); addSkill(input.value.trim(), level.value); }
    });
    chips.addEventListener('click', e=>{
      if(e.target.classList.contains('remove')){
        const chip = e.target.closest('.chip');
        chip?.remove();
        renderSkills();
        autosave.set('saving'); saveDebounced();
      }
    });
  }

  // Projects repeatable (simple, not persistent)
  function initProjects(){
    const list = document.getElementById('projectsList');
    const addBtn = document.getElementById('addProject');
    const preview = document.getElementById('p_projects');
    if(!list || !addBtn || !preview) return;

    function renderPreview(){
      preview.innerHTML = '';
      list.querySelectorAll('.repeat-item').forEach(item=>{
        const title = item.querySelector('[data-bind="proj_title"]').value.trim();
        const stack = item.querySelector('[data-bind="proj_stack"]').value.trim();
        const desc  = item.querySelector('[data-bind="proj_desc"]').value.trim();
        const gh    = item.querySelector('[data-bind="proj_github"]').value.trim();
        const live  = item.querySelector('[data-bind="proj_live"]').value.trim();

        if(!title && !desc) return;
        const card = document.createElement('div');
        card.className = 'p-card';
        card.innerHTML = `
          <div><strong>${title || 'Project'}</strong>${stack ? ' — '+stack : ''}</div>
          ${desc ? `<div class="muted" style="margin:6px 0">${desc}</div>`:''}
          <div class="muted">${gh?`<a href="${gh}" target="_blank" rel="noopener">GitHub</a>`:''}
            ${gh&&live?' • ':''}
            ${live?`<a href="${live}" target="_blank" rel="noopener">Live</a>`:''}
          </div>`;
        preview.appendChild(card);
      });
    }

    list.addEventListener('input', debounce(renderPreview, 200));

    addBtn.addEventListener('click', ()=>{
      const item = document.createElement('div');
      item.className = 'repeat-item';
      item.innerHTML = `
        <div class="handle" title="Drag to reorder"><i class="fas fa-grip-lines"></i></div>
        <div class="grid two">
          <div class="field">
            <label>Project Title *</label>
            <input type="text" placeholder="E-commerce Website" data-bind="proj_title" />
          </div>
          <div class="field">
            <label>Tech Stack</label>
            <input type="text" placeholder="React, Node, MongoDB" data-bind="proj_stack" />
          </div>
          <div class="field full">
            <label>Description *</label>
            <textarea rows="2" placeholder="Brief description of your project..." data-bind="proj_desc"></textarea>
          </div>
          <div class="field">
            <label>GitHub</label>
            <input type="url" placeholder="https://github.com/username/project" data-bind="proj_github" />
          </div>
          <div class="field">
            <label>Live Demo</label>
            <input type="url" placeholder="https://project-demo.com" data-bind="proj_live" />
          </div>
        </div>
        <button class="icon-btn danger remove-item" type="button" title="Remove project"><i class="fas fa-trash"></i></button>
      `;
      list.appendChild(item);
      autosave.set('saving'); saveDebounced();
    });

    list.addEventListener('click', (e)=>{
      if(e.target.closest('.remove-item')){
        e.target.closest('.repeat-item')?.remove();
        renderPreview();
        autosave.set('saving'); saveDebounced();
      }
    });

    const saveDebounced = debounce(()=>autosave.set('saved'), 600);

    renderPreview();
  }

  function initDropdown(){
    const btn = document.getElementById('btnDownload');
    const menu = document.getElementById('downloadMenu');
    if(!btn || !menu) return;
    btn.addEventListener('click', ()=>{
      const isOpen = getComputedStyle(menu).display !== 'none';
      menu.style.display = isOpen ? 'none' : 'block';
    });
    document.addEventListener('click', (e)=>{
      if(!menu.contains(e.target) && !btn.contains(e.target)) menu.style.display = 'none';
    });
  }

  function initPreviewButton(){
    const btn = document.getElementById('btnPreview');
    const preview = document.querySelector('.live-preview');
    if(!btn || !preview) return;
    btn.addEventListener('click', ()=>{
      preview.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }

  function initSaveDraft(){
    const btn = document.getElementById('btnSaveDraft');
    if(!btn) return;
    btn.addEventListener('click', ()=>{
      autosave.set('saving');
      setTimeout(()=>autosave.set('saved'), 700);
    });
  }

  function init(){
    autosave.el = document.getElementById('autosaveStatus');
    initSections();
    initBindings();
    initAboutCounter();
    initTemplateSwitcher();
    initSkills();
    initProjects();
    initDropdown();
    initPreviewButton();
    initSaveDraft();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
