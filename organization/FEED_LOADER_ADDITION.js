// Quick function to add at the end of org-dashboard.js to load real feed data

async function loadOrgFeedPosts() {
    const feedContainer = document.querySelector('.feed-posts');
    if (!feedContainer) {
        console.warn('Feed container not found');
        return;
    }

    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user || !user.id) return;

        console.log('Loading org feed...');
        const result = await window.OrgAPIs.Posts.getFeed(20);

        if (result.success && result.posts && result.posts.length > 0) {
            // Clear hardcoded posts
            feedContainer.innerHTML = '';

            // Render real posts
            result.posts.forEach(post => {
                const postCard = createFeedPostCard(post);
                if (postCard) {
                    feedContainer.appendChild(postCard);
                }
            });

            console.log(`✅ Loaded ${result.posts.length} posts`);
        } else {
            console.log('No posts found or API call failed', result);
        }
    } catch (error) {
        console.error(' Error loading feed:', error);
    }
}

function createFeedPostCard(post) {
    // Simple post card creator
    const card = document.createElement('div');
    card.className = 'card feed-post';
    card.innerHTML = `
        <div class="post-header">
            <div class="company-logo">${post.userName ? post.userName[0] : 'U'}</div>
            <div class="post-info">
                <h4>${post.userName || 'User'}</h4>
                <small>${new Date(post.createdAt).toLocaleDateString()}</small>
            </div>
        </div>
        <div class="post-content">
            ${post.media ? `<img src="${post.media}" style="width:100%; border-radius:8px; margin-bottom:12px;">` : ''}
            <p>${post.content || ''}</p>
        </div>
        <div class="post-actions">
            <button class="action-btn">
                <i class="far fa-heart"></i> <span>${post.likes || 0} Likes</span>
            </button>
            <button class="action-btn">
                <i class="far fa-comment"></i> <span>${post.comments?.length || 0} Comments</span>
            </button>
        </div>
    `;
    return card;
}
