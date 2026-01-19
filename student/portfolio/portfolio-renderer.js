(function(){
  'use strict';

  function safeParse(json){
    try{ return JSON.parse(json); }catch(_){ return null; }
  }

  function readDraft(){
    return safeParse(localStorage.getItem('portfolioDraftV2') || 'null');
  }

  function getUser(){
    return safeParse(localStorage.getItem('user') || 'null') || {};
  }

  function getPublicKey(userId){
    return `portfolioPublicV2:${userId}`;
  }

  function readPublic(userId){
    if(!userId) return null;
    return safeParse(localStorage.getItem(getPublicKey(userId)) || 'null');
  }

  function writePublic(userId, draft){
    if(!userId || !draft) return;
    try{ localStorage.setItem(getPublicKey(userId), JSON.stringify(draft)); }catch(_){ }
  }

  function text(el, value){
    if(!el) return;
    el.textContent = value;
  }

  function show(el, visible){
    if(!el) return;
    el.style.display = visible ? '' : 'none';
  }

  function cleanUrl(v){
    const s = (v || '').trim();
    if(!s) return '';
    if(/^https?:\/\//i.test(s)) return s;
    return `https://${s}`;
  }

  function setLink(el, url, label){
    if(!el) return;
    const u = cleanUrl(url);
    if(!u){
      el.removeAttribute('href');
      show(el.closest('.pf-link') || el, false);
      return;
    }
    el.setAttribute('href', u);
    el.textContent = label || el.textContent;
    show(el.closest('.pf-link') || el, true);
  }

  function levelToPercent(level){
    const v = String(level || '').toLowerCase();
    if(v.includes('expert')) return 90;
    if(v.includes('advanced')) return 75;
    if(v.includes('intermediate')) return 55;
    if(v.includes('beginner')) return 35;
    const n = Number(level);
    if(Number.isFinite(n)) return Math.max(0, Math.min(100, n));
    return 60;
  }

  function normalizeDraft(draft, options){
    const d = draft && typeof draft === 'object' ? draft : {};

    return {
      ownerId: String(d.ownerId || ''),
      isPublic: Boolean(d.isPublic),
      lastUpdatedAt: d.lastUpdatedAt || '',
      profilePhoto: d.profilePhoto || '',
      coverPhoto: d.coverPhoto || '',
      name: (d.name || '').trim(),
      title: (d.title || '').trim(),
      email: (d.email || '').trim(),
      location: (d.location || '').trim(),
      phone: (d.phone || '').trim(),
      linkedin: (d.linkedin || '').trim(),
      github: (d.github || '').trim(),
      website: (d.website || '').trim(),
      about: (d.about || '').trim(),
      skills: Array.isArray(d.skills) ? d.skills : [],
      projects: Array.isArray(d.projects) ? d.projects : [],
      experience: Array.isArray(d.experience) ? d.experience : [],
      eduSchool: (d.eduSchool || '').trim(),
      eduDegree: (d.eduDegree || '').trim(),
      eduYears: (d.eduYears || '').trim(),
      certifications: Array.isArray(d.certifications) ? d.certifications : []
    };
  }

  function renderIntoPage(draft, opts){
    const d = normalizeDraft(draft, opts);

    const cover = document.getElementById('pfCover');
    const avatarImg = document.getElementById('pfAvatarImg');
    const avatarFallback = document.getElementById('pfAvatarFallback');

    if(cover){
      if(d.coverPhoto){
        cover.style.backgroundImage = `url(${d.coverPhoto})`;
        cover.classList.add('has-image');
      } else {
        cover.style.backgroundImage = '';
        cover.classList.remove('has-image');
      }
    }

    if(avatarImg && avatarFallback){
      if(d.profilePhoto){
        avatarImg.src = d.profilePhoto;
        show(avatarImg, true);
        show(avatarFallback, false);
      } else {
        avatarImg.removeAttribute('src');
        show(avatarImg, false);
        show(avatarFallback, true);
        const initials = (d.name || 'Student').split(' ').filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('');
        avatarFallback.textContent = initials || 'S';
      }
    }

    text(document.getElementById('pfName'), d.name || 'Your Name');
    text(document.getElementById('pfTitle'), d.title || 'Professional Title');
    text(document.getElementById('pfLocation'), d.location || '');
    text(document.getElementById('pfEmail'), d.email || '');
    text(document.getElementById('pfPhone'), d.phone || '');

    show(document.getElementById('pfLocationRow'), Boolean(d.location));
    show(document.getElementById('pfEmailRow'), Boolean(d.email));
    show(document.getElementById('pfPhoneRow'), Boolean(d.phone));

    setLink(document.getElementById('pfLinkedin'), d.linkedin, 'LinkedIn');
    setLink(document.getElementById('pfGithub'), d.github, 'GitHub');
    setLink(document.getElementById('pfWebsite'), d.website, 'Website');

    const about = document.getElementById('pfAbout');
    if(about){
      about.textContent = d.about || 'Add a short summary to introduce yourself professionally.';
    }

    const skillsWrap = document.getElementById('pfSkills');
    if(skillsWrap){
      skillsWrap.innerHTML = '';
      const items = d.skills;
      if(items.length === 0){
        skillsWrap.innerHTML = '<div class="pf-empty">No skills added yet.</div>';
      } else {
        items.forEach(s=>{
          const name = (typeof s === 'string' ? s : (s.name || '')).trim();
          if(!name) return;
          const lvl = typeof s === 'string' ? '' : (s.level || '').trim();
          const pct = levelToPercent(lvl);
          const row = document.createElement('div');
          row.className = 'pf-skill';
          row.innerHTML = `
            <div class="pf-skill-top">
              <div class="pf-skill-name">${name}</div>
              <div class="pf-skill-level">${lvl || ''}</div>
            </div>
            <div class="pf-skill-bar"><div class="pf-skill-fill" style="width:${pct}%"></div></div>
          `;
          skillsWrap.appendChild(row);
        });
      }
    }

    const projectsWrap = document.getElementById('pfProjects');
    if(projectsWrap){
      projectsWrap.innerHTML = '';
      const items = d.projects;
      if(items.length === 0){
        projectsWrap.innerHTML = '<div class="pf-empty">No projects added yet.</div>';
      } else {
        items.forEach(p=>{
          const title = (p.title || '').trim();
          const desc = (p.desc || '').trim();
          const stack = (p.stack || '').trim();
          const github = (p.github || '').trim();
          const live = (p.live || '').trim();
          const image = (p.image || '').trim();
          if(!title && !desc && !image) return;

          const card = document.createElement('div');
          card.className = 'pf-project';
          card.innerHTML = `
            ${image ? `<div class="pf-project-img" style="background-image:url(${image})"></div>` : ''}
            <div class="pf-project-body">
              <div class="pf-project-title">${title || 'Project'}</div>
              ${stack ? `<div class="pf-project-stack">${stack}</div>` : ''}
              ${desc ? `<div class="pf-project-desc">${desc}</div>` : ''}
              <div class="pf-project-links">
                ${github ? `<a class="pf-btn-link" href="${cleanUrl(github)}" target="_blank" rel="noopener">GitHub</a>` : ''}
                ${live ? `<a class="pf-btn-link" href="${cleanUrl(live)}" target="_blank" rel="noopener">Live</a>` : ''}
              </div>
            </div>
          `;
          projectsWrap.appendChild(card);
        });
      }
    }

    const expWrap = document.getElementById('pfExperience');
    if(expWrap){
      expWrap.innerHTML = '';
      const items = d.experience;
      if(items.length === 0){
        expWrap.innerHTML = '<div class="pf-empty">No experience added yet.</div>';
      } else {
        items.forEach(e=>{
          const role = (e.role || '').trim();
          const company = (e.company || '').trim();
          const start = (e.start || '').trim();
          const end = (e.end || '').trim();
          const desc = (e.desc || '').trim();
          if(!role && !company && !desc) return;
          const meta = [company, [start, end].filter(Boolean).join(' – ')].filter(Boolean).join(' • ');
          const item = document.createElement('div');
          item.className = 'pf-exp';
          item.innerHTML = `
            <div class="pf-exp-role">${role || 'Role'}</div>
            ${meta ? `<div class="pf-exp-meta">${meta}</div>` : ''}
            ${desc ? `<div class="pf-exp-desc">${desc}</div>` : ''}
          `;
          expWrap.appendChild(item);
        });
      }
    }

    text(document.getElementById('pfEduSchool'), d.eduSchool || '');
    text(document.getElementById('pfEduDegree'), d.eduDegree || '');
    text(document.getElementById('pfEduYears'), d.eduYears || '');
    show(document.getElementById('pfEducationCard'), Boolean(d.eduSchool || d.eduDegree || d.eduYears));

    const certWrap = document.getElementById('pfCerts');
    if(certWrap){
      certWrap.innerHTML = '';
      const items = d.certifications;
      if(items.length === 0){
        certWrap.innerHTML = '<div class="pf-empty">No certifications added.</div>';
      } else {
        items.forEach(c=>{
          const name = (c.name || '').trim();
          const issuer = (c.issuer || '').trim();
          const date = (c.date || '').trim();
          const url = (c.url || '').trim();
          if(!name && !issuer) return;
          const meta = [issuer, date].filter(Boolean).join(' • ');
          const row = document.createElement('div');
          row.className = 'pf-cert';
          row.innerHTML = `
            <div class="pf-cert-name">${name || 'Certification'}</div>
            ${meta ? `<div class="pf-cert-meta">${meta}</div>` : ''}
            ${url ? `<a class="pf-btn-link" href="${cleanUrl(url)}" target="_blank" rel="noopener">Credential</a>` : ''}
          `;
          certWrap.appendChild(row);
        });
      }
    }

    const actions = document.getElementById('pfActions');
    const btnEdit = document.getElementById('pfBtnEdit');
    const btnShare = document.getElementById('pfBtnShare');
    const btnDownload = document.getElementById('pfBtnDownload');

    const user = getUser();
    const isOwner = Boolean(opts && opts.forceOwner) || (user && user.id && d.ownerId && String(user.id) === String(d.ownerId));

    if(actions){
      show(actions, true);
      if(btnEdit) show(btnEdit, isOwner);
    }

    if(btnEdit){
      btnEdit.onclick = ()=>{
        window.location.href = 'std-dashboard.html?tab=portfolio&mode=update';
      };
    }

    if(btnDownload){
      btnDownload.onclick = ()=>window.print();
    }

    if(btnShare){
      btnShare.onclick = async ()=>{
        const url = new URL(window.location.href);
        if(d.ownerId) url.searchParams.set('userId', String(d.ownerId));
        const shareUrl = url.toString();
        try{
          if(navigator.share){
            await navigator.share({ title: `${d.name || 'Portfolio'} • SkillLaunch`, url: shareUrl });
            return;
          }
        }catch(_){ }

        try{
          await navigator.clipboard.writeText(shareUrl);
          alert('Share link copied to clipboard');
        }catch(_){
          prompt('Copy your share link:', shareUrl);
        }
      };
    }

    const emptyState = document.getElementById('pfEmptyState');
    const content = document.getElementById('pfContent');
    const hasAny = Boolean(d.name || d.title || d.about || d.skills.length || d.projects.length || d.experience.length || d.eduSchool || d.eduDegree);
    show(emptyState, !hasAny);
    show(content, hasAny);

    return d;
  }

  function initPage(opts){
    const params = new URLSearchParams(window.location.search);
    const requestedUserId = params.get('userId');

    let draft = null;

    if(requestedUserId){
      draft = readPublic(requestedUserId);
      if(!draft && viewerIsRequested) draft = readDraft();
    } else {
      draft = readDraft();
    }

    const normalized = renderIntoPage(draft, renderOpts);

    if(requestedUserId && !draft){
      const empty = document.getElementById('pfEmptyState');
      if(empty){
        const h2 = empty.querySelector('h2');
        const p = empty.querySelector('p');
        if(h2) h2.textContent = 'Public portfolio not found';
        if(p) p.textContent = 'This share link has no public portfolio available yet.';
      }
    }

    if(normalized && normalized.ownerId && normalized.isPublic){
      writePublic(String(normalized.ownerId), normalized);
    }

    const badge = document.getElementById('pfPublicBadge');
    if(badge){
      const showPublic = Boolean(normalized && normalized.isPublic);
      show(badge, showPublic);
    }

    const viewer = document.getElementById('pfViewerHint');
    if(viewer){
      const isOwner = user && user.id && normalized && normalized.ownerId && String(user.id) === String(normalized.ownerId);
      viewer.textContent = isOwner ? 'Owner view' : 'Public view';
    }
  }

  window.PortfolioRenderer = {
    initPage,
    readDraft,
    readPublic,
    writePublic,
    normalizeDraft
  };
})();
