//js/interactive.js
/* ===== INTERACTIVE FEATURES ===== */
/* Simple, professional interactions */

document.addEventListener('DOMContentLoaded', function() {
    initScrollAnimations();
    initSkillAnimations();
});

/* Scroll Animations */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.feature, .benefit, .step, .benefit-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fadeInUp');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

/* Skill Bar Animations */
function initSkillAnimations() {
    const skillBars = document.querySelectorAll('.progress-fill, .level-bar');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const width = bar.style.width;
                bar.style.width = '0%';
                
                setTimeout(() => {
                    bar.style.transition = 'width 1.5s ease-out';
                    bar.style.width = width;
                }, 300);
                
                observer.unobserve(bar);
            }
        });
    }, {
        threshold: 0.5
    });
    
    skillBars.forEach(bar => {
        observer.observe(bar);
    });
}

/* Hover Effects */
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.feature, .benefit, .step, .benefit-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '';
        });
    });
});

/* Apply Button Interaction */
document.addEventListener('DOMContentLoaded', function() {
    const applyBtn = document.querySelector('.match-action .btn');
    
    if (applyBtn) {
        applyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Applying...';
            this.disabled = true;
            
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-check"></i> Applied Successfully!';
                this.style.background = '#38a169';
                
                // Show success message
                const hint = this.nextElementSibling;
                if (hint && hint.classList.contains('match-hint')) {
                    hint.textContent = 'Application submitted! You\'ll hear back within 7 days.';
                    hint.style.color = '#38a169';
                }
            }, 1500);
        });
    }
});