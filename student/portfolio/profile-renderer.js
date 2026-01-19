/**
 * Profile Renderer - Populates the LinkedIn/iPortfolio-inspired profile page
 * Reads from portfolioDraftV2 in localStorage (Single Source of Truth)
 */
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

  function show(el, visible){
    if(!el) return;
    el.style.display = visible ? '' : 'none';
  }

  function text(el, value){
    if(!el) return;
    el.textContent = value || '';
  }

  function cleanUrl(v){
    const s = (v || '').trim();
    if(!s) return '';
    if(/^https?:\/\//i.test(s)) return s;
    return `https://${s}`;
  }

  function levelToPercent(level){
    const v = String(level || '').toLowerCase();
    if(v.includes('expert')) return 95;
    if(v.includes('advanced')) return 80;
    if(v.includes('intermediate')) return 60;
    if(v.includes('beginner')) return 35;
    const n = Number(level);
    if(Number.isFinite(n)) return Math.max(0, Math.min(100, n));
    return 60;
  }

  function getInitials(name){
    return (name || 'U').split(' ').filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('') || 'U';
  }

  function normalizeDraft(draft){
    const d = draft && typeof draft === 'object' ? draft : {};

    return {
      ownerId: String(d.ownerId || ''),
      isPublic: Boolean(d.isPublic),
      profilePhoto: d.profilePhoto || '',
      coverPhoto: d.coverPhoto || '',
      name: (d.name || '').trim(),
      title: (d.title || '').trim(),
      email: (d.email || '').trim(),
      location: (d.location || '').trim(),
      phone: (d.phone || '').trim(),
      linkedin: (d.linkedin || '').trim(),
      github: (d.github || '').trim(),
      twitter: (d.twitter || '').trim(),
      instagram: (d.instagram || '').trim(),
      facebook: (d.facebook || '').trim(),
      website: (d.website || '').trim(),
      about: (d.about || '').trim(),
      languages: (d.languages || '').trim(),
      interests: (d.interests || '').trim(),
      availability: (d.availability || '').trim(),
      skills: Array.isArray(d.skills) ? d.skills : [],
      projects: Array.isArray(d.projects) ? d.projects : [],
      experience: Array.isArray(d.experience) ? d.experience : [],
      education: Array.isArray(d.education) ? d.education : [],
      eduSchool: (d.eduSchool || '').trim(),
      eduDegree: (d.eduDegree || '').trim(),
      eduYears: (d.eduYears || '').trim(),
      certifications: Array.isArray(d.certifications) ? d.certifications : []
    };
  }

  function renderProfile(draft, opts){
    const d = normalizeDraft(draft);
    const user = getUser();
    const isOwner = Boolean(opts && opts.forceOwner) || (user && user.id && d.ownerId && String(user.id) === String(d.ownerId));
    const initials = getInitials(d.name);

    // ========== SIDEBAR PROFILE ==========
    const sidebarAvatarImg = document.getElementById('pfAvatarImg');
    const sidebarAvatarFallback = document.getElementById('pfAvatarFallback');
    if(sidebarAvatarImg && sidebarAvatarFallback){
      if(d.profilePhoto){
        sidebarAvatarImg.src = d.profilePhoto;
        show(sidebarAvatarImg, true);
        show(sidebarAvatarFallback, false);
      } else {
        show(sidebarAvatarImg, false);
        show(sidebarAvatarFallback, true);
        sidebarAvatarFallback.textContent = initials;
      }
    }
    text(document.getElementById('pfName'), d.name || 'Your Name');
    text(document.getElementById('pfTitle'), d.title || 'Professional Title');
    text(document.getElementById('pfSidebarName'), d.name || 'Your Name');
    text(document.getElementById('pfSidebarTitle'), d.title || 'Professional Title');

    // Sidebar social links
    const socialLinks = [
      { id: 'pfTwitter', value: d.twitter },
      { id: 'pfFacebook', value: d.facebook },
      { id: 'pfInstagram', value: d.instagram },
      { id: 'pfLinkedin', value: d.linkedin },
      { id: 'pfGithub', value: d.github }
    ];
    socialLinks.forEach(({ id, value }) => {
      const el = document.getElementById(id);
      if(el){
        const url = cleanUrl(value);
        if(url){ el.href = url; show(el, true); }
        else show(el, false);
      }
    });

    // ========== PROFILE HEADER (LinkedIn-style) ==========
    // Cover photo
    const coverPhoto = document.getElementById('pfCoverPhoto');
    if(coverPhoto && d.coverPhoto){
      coverPhoto.style.backgroundImage = `url(${d.coverPhoto})`;
      coverPhoto.style.backgroundSize = 'cover';
      coverPhoto.style.backgroundPosition = 'center';
    }

    const aboutCover = document.getElementById('pfCover');
    if(aboutCover && d.coverPhoto){
      aboutCover.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.18), rgba(0,0,0,0.18)), url(${d.coverPhoto})`;
      aboutCover.style.backgroundSize = 'cover';
      aboutCover.style.backgroundPosition = 'center';
    }

    // Header avatar
    const headerImg = document.getElementById('pfHeaderImg');
    const headerFallback = document.getElementById('pfHeaderFallback');
    if(headerImg && headerFallback){
      if(d.profilePhoto){
        headerImg.src = d.profilePhoto;
        show(headerImg, true);
        show(headerFallback, false);
      } else {
        show(headerImg, false);
        show(headerFallback, true);
        headerFallback.textContent = initials;
      }
    }

    // Header info
    text(document.getElementById('pfHeaderName'), d.name || 'Your Name');
    text(document.getElementById('pfHeaderTitle'), d.title || 'Professional Title');

    // Header meta
    const metaLocation = document.getElementById('pfMetaLocation');
    const metaEmail = document.getElementById('pfMetaEmail');
    const metaAvailability = document.getElementById('pfMetaAvailability');
    if(metaLocation){
      text(document.getElementById('pfLocationText'), d.location);
      show(metaLocation, Boolean(d.location));
    }
    if(metaEmail){
      text(document.getElementById('pfEmailHeaderText'), d.email);
      show(metaEmail, Boolean(d.email));
    }
    if(metaAvailability){
      text(document.getElementById('pfAvailabilityText'), d.availability);
      show(metaAvailability, Boolean(d.availability));
    }

    // ========== ABOUT SECTION ==========
    // About image
    const aboutImg = document.getElementById('pfAboutImg');
    if(aboutImg){
      if(d.profilePhoto){
        aboutImg.style.backgroundImage = `url(${d.profilePhoto})`;
        aboutImg.style.backgroundSize = 'cover';
        aboutImg.style.backgroundPosition = 'center';
      }
    }

    // About title and description
    text(document.getElementById('pfAboutTitle'), d.title || 'Professional');
    text(document.getElementById('pfAboutTitleText'), d.title || 'Professional');
    text(document.getElementById('pfAbout'), d.about || 'Add a professional summary to introduce yourself.');
    text(document.getElementById('pfAboutDesc'), d.about || 'Add a professional summary to introduce yourself.');

    // About info grid
    const infoItems = [
      { rowId: 'pfWebsiteRow', textId: 'pfWebsite', value: d.website },
      { rowId: 'pfWebsiteRow', textId: 'pfWebsiteText', value: d.website },
      { rowId: 'pfDegreeRow', textId: 'pfDegree', value: d.eduDegree },
      { rowId: 'pfPhoneRow', textId: 'pfPhone', value: d.phone },
      { rowId: 'pfEmailRow', textId: 'pfEmail', value: d.email },
      { rowId: 'pfEmailRowInfo', textId: 'pfEmailText', value: d.email },
      { rowId: 'pfCityRow', textId: 'pfCity', value: d.location },
      { rowId: 'pfLocationRow', textId: 'pfLocation', value: d.location },
      { rowId: 'pfFreelanceRow', textId: 'pfFreelance', value: d.availability }
    ];
    infoItems.forEach(({ rowId, textId, value }) => {
      const row = document.getElementById(rowId);
      if(row){
        text(document.getElementById(textId), value);
        show(row, Boolean(value));
      }
    });

    // ========== SKILLS SECTION ==========
    const skillsWrap = document.getElementById('pfSkills');
    if(skillsWrap){
      skillsWrap.innerHTML = '';
      if(d.skills.length === 0){
        skillsWrap.innerHTML = '<div class="pf-empty" style="padding:20px;text-align:center;color:#64748b;"><p>No skills added yet.</p></div>';
      } else {
        d.skills.forEach(s => {
          const name = (typeof s === 'string' ? s : (s.name || '')).trim();
          if(!name) return;
          const lvl = typeof s === 'string' ? '' : (s.level || '').trim();
          const pct = levelToPercent(lvl);
          const item = document.createElement('div');
          item.className = 'pf-skill-item';
          item.innerHTML = `
            <div class="pf-skill-header">
              <span class="pf-skill-name">${name}</span>
              <span class="pf-skill-level">${lvl || pct + '%'}</span>
            </div>
            <div class="pf-skill-bar"><div class="pf-skill-fill" style="width:${pct}%"></div></div>
          `;
          skillsWrap.appendChild(item);
        });
      }
    }

    // ========== EDUCATION SECTION ==========
    const eduWrap = document.getElementById('pfEducation');
    if(eduWrap){
      eduWrap.innerHTML = '';
      const hasEducation = d.education.length > 0 || d.eduSchool || d.eduDegree;
      if(!hasEducation){
        eduWrap.innerHTML = '<div class="pf-empty" style="padding:20px;text-align:center;color:#64748b;"><p>No education added.</p></div>';
      } else {
        // First render education array
        if(d.education.length > 0){
          d.education.forEach(edu => {
            const institution = (edu.institution || '').trim();
            const degree = (edu.degree || '').trim();
            const field = (edu.field || '').trim();
            const graduation = (edu.graduation || '').trim();
            const achievements = (edu.achievements || '').trim();
            if(!institution && !degree) return;

            const item = document.createElement('div');
            item.className = 'pf-timeline-item';
            item.innerHTML = `
              <div class="pf-timeline-title">${degree}${field ? ' in ' + field : ''}</div>
              <div class="pf-timeline-meta">${graduation || ''}</div>
              <div class="pf-timeline-org">${institution}</div>
              ${achievements ? `<div class="pf-timeline-desc">${achievements}</div>` : ''}
            `;
            eduWrap.appendChild(item);
          });
        } else if(d.eduSchool || d.eduDegree){
          // Fallback to legacy fields
          const item = document.createElement('div');
          item.className = 'pf-timeline-item';
          item.innerHTML = `
            <div class="pf-timeline-title">${d.eduDegree || 'Degree'}</div>
            <div class="pf-timeline-meta">${d.eduYears || ''}</div>
            <div class="pf-timeline-org">${d.eduSchool || ''}</div>
          `;
          eduWrap.appendChild(item);
        }
      }
    }

    // ========== EXPERIENCE SECTION ==========
    const expWrap = document.getElementById('pfExperience');
    if(expWrap){
      expWrap.innerHTML = '';
      if(d.experience.length === 0){
        expWrap.innerHTML = '<div class="pf-empty" style="padding:20px;text-align:center;color:#64748b;"><p>No experience added.</p></div>';
      } else {
        d.experience.forEach(e => {
          const role = (e.title || e.role || '').trim();
          const company = (e.company || '').trim();
          const start = (e.startDate || e.start || '').trim();
          const end = (e.endDate || e.end || '').trim();
          const desc = (e.description || e.desc || '').trim();
          if(!role && !company && !desc) return;

          const dateRange = [start, end].filter(Boolean).join(' – ');
          const item = document.createElement('div');
          item.className = 'pf-timeline-item';
          item.innerHTML = `
            <div class="pf-timeline-title">${role || 'Role'}</div>
            <div class="pf-timeline-meta">${dateRange}</div>
            <div class="pf-timeline-org">${company}</div>
            ${desc ? `<div class="pf-timeline-desc">${desc}</div>` : ''}
          `;
          expWrap.appendChild(item);
        });
      }
    }

    // ========== PROJECTS SECTION ==========
    const projWrap = document.getElementById('pfProjects');
    if(projWrap){
      projWrap.innerHTML = '';
      if(d.projects.length === 0){
        projWrap.innerHTML = '<div class="pf-empty" style="padding:20px;text-align:center;color:#64748b;"><p>No projects added yet.</p></div>';
      } else {
        d.projects.forEach(p => {
          const title = (p.title || '').trim();
          const desc = (p.description || p.desc || '').trim();
          const stack = (p.tech || p.stack || '').trim();
          const url = (p.url || p.live || '').trim();
          const github = (p.github || '').trim();
          const image = (p.image || '').trim();
          if(!title && !desc && !image) return;

          const card = document.createElement('div');
          card.className = 'pf-project-card';
          card.innerHTML = `
            <div class="pf-project-img" style="${image ? `background-image:url(${image});` : ''}"></div>
            <div class="pf-project-body">
              <div class="pf-project-title">${title || 'Project'}</div>
              ${stack ? `<div class="pf-project-stack">${stack}</div>` : ''}
              ${desc ? `<div class="pf-project-desc">${desc}</div>` : ''}
              <div class="pf-project-links">
                ${github ? `<a href="${cleanUrl(github)}" target="_blank" rel="noopener"><i class="fab fa-github"></i> GitHub</a>` : ''}
                ${url ? `<a href="${cleanUrl(url)}" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> Live</a>` : ''}
              </div>
            </div>
          `;
          projWrap.appendChild(card);
        });
      }
    }

    // ========== CERTIFICATIONS SECTION ==========
    const certWrap = document.getElementById('pfCerts');
    if(certWrap){
      certWrap.innerHTML = '';
      if(d.certifications.length === 0){
        certWrap.innerHTML = '<div class="pf-empty" style="padding:20px;text-align:center;color:#64748b;"><p>No certifications added.</p></div>';
      } else {
        d.certifications.forEach(c => {
          const name = (c.name || '').trim();
          const issuer = (c.issuer || '').trim();
          const date = (c.issueDate || c.date || '').trim();
          const url = (c.credentialUrl || c.url || '').trim();
          const image = (c.image || '').trim();
          if(!name && !issuer) return;

          const meta = [issuer, date].filter(Boolean).join(' • ');
          const item = document.createElement('div');
          item.className = 'pf-cert-item';
          item.innerHTML = `
            <div class="pf-cert-icon">${image ? `<img src="${image}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">` : '<i class="fas fa-award"></i>'}</div>
            <div class="pf-cert-info">
              <div class="pf-cert-name">${name || 'Certification'}</div>
              ${meta ? `<div class="pf-cert-meta">${meta}</div>` : ''}
              ${url ? `<a class="pf-cert-link" href="${cleanUrl(url)}" target="_blank" rel="noopener">View Credential →</a>` : ''}
            </div>
          `;
          certWrap.appendChild(item);
        });
      }
    }

    // ========== CONTACT SECTION ==========
    const contactEmail = document.getElementById('contactEmail');
    const contactPhone = document.getElementById('contactPhone');
    const contactLocation = document.getElementById('contactLocation');
    const contactLinkedin = document.getElementById('contactLinkedin');
    const contactGithub = document.getElementById('contactGithub');
    const contactWebsite = document.getElementById('contactWebsite');

    if(contactEmail){
      const link = document.getElementById('contactEmailLink');
      if(link && d.email){
        link.href = `mailto:${d.email}`;
        link.textContent = d.email;
      }
      show(contactEmail, Boolean(d.email));
    }
    if(contactPhone){
      text(document.getElementById('contactPhoneText'), d.phone);
      show(contactPhone, Boolean(d.phone));
    }
    if(contactLocation){
      text(document.getElementById('contactLocationText'), d.location);
      show(contactLocation, Boolean(d.location));
    }
    if(contactLinkedin){
      const link = document.getElementById('contactLinkedinLink');
      if(link && d.linkedin){ link.href = cleanUrl(d.linkedin); }
      show(contactLinkedin, Boolean(d.linkedin));
    }
    if(contactGithub){
      const link = document.getElementById('contactGithubLink');
      if(link && d.github){ link.href = cleanUrl(d.github); }
      show(contactGithub, Boolean(d.github));
    }
    if(contactWebsite){
      const link = document.getElementById('contactWebsiteLink');
      if(link && d.website){ link.href = cleanUrl(d.website); }
      show(contactWebsite, Boolean(d.website));
    }

    // ========== ACTION BUTTONS ==========
    const btnEdit = document.getElementById('pfBtnEdit');
    const btnDownload = document.getElementById('pfBtnDownload');
    const btnShare = document.getElementById('pfBtnShare');

    if(btnEdit){
      show(btnEdit, isOwner);
      btnEdit.onclick = () => {
        window.location.href = '../std-dashboard.html?tab=portfolio&mode=update';
      };
    }

    // PDF Download using html2pdf.js
    if(btnDownload){
      btnDownload.onclick = async () => {
        const main = document.getElementById('pfMain');
        if(!main) return;

        // Add PDF mode class
        document.body.classList.add('pdf-mode');
        btnDownload.disabled = true;
        btnDownload.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

        try {
          const opt = {
            margin: [10, 10, 10, 10],
            filename: `${d.name || 'Portfolio'}_Profile.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
          };

          if(window.html2pdf){
            await html2pdf().set(opt).from(main).save();
          } else {
            window.print();
          }
        } catch(err) {
          console.error('PDF generation error:', err);
          window.print();
        } finally {
          document.body.classList.remove('pdf-mode');
          btnDownload.disabled = false;
          btnDownload.innerHTML = '<i class="fas fa-download"></i> Download PDF';
        }
      };
    }

    // Share button
    if(btnShare){
      btnShare.onclick = async () => {
        const url = new URL(window.location.href);
        if(d.ownerId) url.searchParams.set('userId', String(d.ownerId));
        const shareUrl = url.toString();
        const shareData = {
          title: `${d.name || 'Profile'} | SkillLaunch`,
          text: `Check out ${d.name || 'this'}'s professional profile on SkillLaunch!`,
          url: shareUrl
        };
        try{
          if(navigator.share && navigator.canShare && navigator.canShare(shareData)){
            await navigator.share(shareData);
            return;
          }
        }catch(_){}
        try{
          await navigator.clipboard.writeText(shareUrl);
          showToast('Profile link copied to clipboard!');
        }catch(_){
          prompt('Copy your profile link:', shareUrl);
        }
      };
    }

    // ========== EMPTY STATE ==========
    const hasData = Boolean(d.name || d.title || d.about || d.skills.length || d.projects.length || d.experience.length || d.education.length || d.eduSchool);
    show(document.getElementById('pfEmptyState'), !hasData);
    show(document.getElementById('pfContent'), hasData);

    return d;
  }

  function showToast(message){
    const existing = document.querySelector('.pf-toast');
    if(existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'pf-toast';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    toast.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: #1a1a2e;
      color: #fff;
      padding: 14px 24px;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 10px;
      animation: toastIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function init(opts){
    const draft = readDraft();
    renderProfile(draft, opts || {});
  }

  window.ProfileRenderer = {
    init,
    readDraft,
    normalizeDraft
  };
})();
