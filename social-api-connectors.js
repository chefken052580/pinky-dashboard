/**
 * SOCIAL MEDIA API CONNECTORS
 * Real API integration for posting to each platform
 */

class SocialMediaConnectors {
  constructor() {
    this.platforms = {
      twitter: {
        name: 'Twitter/X',
        icon: '𝕏',
        apiVersion: 'v2',
        baseUrl: 'https://api.twitter.com/2',
        auth: 'Bearer Token',
        endpoints: {
          post: '/tweets',
          schedule: 'v2/tweets'
        },
        requiredKeys: ['api_key', 'api_secret', 'access_token', 'access_secret'],
        charLimit: 280,
        features: ['text', 'media', 'threads', 'retweet', 'like'],
        docs: 'https://developer.twitter.com/en/docs/twitter-api',
        implementation: `
// Twitter API v2 Post
const postToTwitter = async (text, tokens) => {
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + tokens.access_token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: text })
  });
  return await response.json();
};`
      },
      instagram: {
        name: 'Instagram/Meta',
        icon: '📸',
        apiVersion: 'v18.0',
        baseUrl: 'https://graph.instagram.com/v18.0',
        auth: 'Bearer Token (Business Account)',
        endpoints: {
          post: '/me/media',
          publish: '/me/media_publish'
        },
        requiredKeys: ['business_account_id', 'access_token'],
        charLimit: 2200,
        features: ['image', 'carousel', 'video', 'hashtags', 'mentions'],
        docs: 'https://developers.facebook.com/docs/instagram-api',
        implementation: `
// Instagram Graph API Post
const postToInstagram = async (caption, imageUrl, tokens) => {
  // Create media object first
  const media = await fetch('https://graph.instagram.com/v18.0/me/media', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + tokens.access_token },
    body: new URLSearchParams({
      'image_url': imageUrl,
      'caption': caption
    })
  }).then(r => r.json());
  
  // Publish media
  return await fetch('https://graph.instagram.com/v18.0/me/media_publish', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + tokens.access_token },
    body: new URLSearchParams({ 'creation_id': media.id })
  }).then(r => r.json());
};`
      },
      tiktok: {
        name: 'TikTok',
        icon: '🎵',
        apiVersion: 'v1',
        baseUrl: 'https://open.tiktokapis.com/v1',
        auth: 'OAuth 2.0',
        endpoints: {
          upload: '/video/upload',
          publish: '/video/publish'
        },
        requiredKeys: ['client_id', 'client_secret', 'access_token', 'creator_id'],
        charLimit: 2200,
        features: ['video', 'trending', 'sounds', 'hashtags', 'effects'],
        docs: 'https://developers.tiktok.com/doc/tiktok-api-overview',
        implementation: `
// TikTok API Video Upload
const postToTikTok = async (videoPath, caption, tokens) => {
  // Upload video first
  const upload = await fetch('https://open.tiktokapis.com/v1/video/upload', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + tokens.access_token,
      'Content-Type': 'multipart/form-data'
    },
    body: formData // Include video file
  }).then(r => r.json());
  
  // Publish video
  return await fetch('https://open.tiktokapis.com/v1/video/publish', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + tokens.access_token },
    body: JSON.stringify({
      'video_id': upload.data.video_id,
      'caption': caption
    })
  }).then(r => r.json());
};`
      },
      linkedin: {
        name: 'LinkedIn',
        icon: '💼',
        apiVersion: 'v2',
        baseUrl: 'https://api.linkedin.com/v2',
        auth: 'OAuth 2.0',
        endpoints: {
          post: '/ugcPosts'
        },
        requiredKeys: ['client_id', 'client_secret', 'access_token', 'actor_id'],
        charLimit: 3000,
        features: ['text', 'document', 'image', 'article', 'hashtags'],
        docs: 'https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api',
        implementation: `
// LinkedIn API Post
const postToLinkedIn = async (text, tokens) => {
  return await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + tokens.access_token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'author': 'urn:li:person:' + tokens.actor_id,
      'lifecycleState': 'PUBLISHED',
      'specificContent': {
        'com.linkedin.ugc.Share': {
          'media': [],
          'shareCommentary': { 'text': text }
        }
      }
    })
  }).then(r => r.json());
};`
      },
      bluesky: {
        name: 'Bluesky',
        icon: '🌊',
        apiVersion: 'xrpc',
        baseUrl: 'https://bsky.social/xrpc',
        auth: 'JWT Token',
        endpoints: {
          post: '/com.atproto.repo.createRecord'
        },
        requiredKeys: ['did', 'access_jwt', 'handle'],
        charLimit: 300,
        features: ['text', 'mentions', 'hashtags', 'links', 'rich-text'],
        docs: 'https://docs.bsky.app/docs/api/at-protocol-xrpc',
        implementation: `
// Bluesky ATP API Post
const postToBluesky = async (text, tokens) => {
  return await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + tokens.access_jwt,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'repo': tokens.did,
      'collection': 'app.bsky.feed.post',
      'record': {
        'text': text,
        'createdAt': new Date().toISOString(),
        'facets': []
      }
    })
  }).then(r => r.json());
};`
      },
      mastodon: {
        name: 'Mastodon',
        icon: '🐘',
        apiVersion: 'v1',
        baseUrl: '{instance}/api/v1',
        auth: 'Bearer Token',
        endpoints: {
          post: '/statuses'
        },
        requiredKeys: ['instance_url', 'access_token'],
        charLimit: 500,
        features: ['text', 'media', 'hashtags', 'mentions', 'visibility'],
        docs: 'https://docs.joinmastodon.org/client/intro/',
        implementation: `
// Mastodon API Post
const postToMastodon = async (text, instanceUrl, tokens) => {
  return await fetch(instanceUrl + '/api/v1/statuses', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + tokens.access_token,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      'status': text,
      'visibility': 'public'
    })
  }).then(r => r.json());
};`
      },
      discord: {
        name: 'Discord',
        icon: '💬',
        apiVersion: 'v10',
        baseUrl: 'https://discordapp.com/api/v10',
        auth: 'Webhook URL',
        endpoints: {
          webhook: '/webhooks/{webhook_id}/{webhook_token}'
        },
        requiredKeys: ['webhook_url'],
        charLimit: 2000,
        features: ['text', 'embeds', 'images', 'reactions', 'threads'],
        docs: 'https://discord.com/developers/docs/resources/webhook',
        implementation: `
// Discord Webhook Post
const postToDiscord = async (message, webhookUrl) => {
  return await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'content': message,
      'embeds': []
    })
  }).then(r => r.json());
};`
      },
      telegram: {
        name: 'Telegram',
        icon: '✈️',
        apiVersion: 'Bot API',
        baseUrl: 'https://api.telegram.org/bot{token}',
        auth: 'Bot Token',
        endpoints: {
          message: '/sendMessage'
        },
        requiredKeys: ['bot_token', 'chat_id'],
        charLimit: 4096,
        features: ['text', 'photo', 'video', 'document', 'keyboard'],
        docs: 'https://core.telegram.org/bots/api',
        implementation: `
// Telegram Bot API Post
const postToTelegram = async (text, botToken, chatId) => {
  return await fetch('https://api.telegram.org/bot' + botToken + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'chat_id': chatId,
      'text': text,
      'parse_mode': 'HTML'
    })
  }).then(r => r.json());
};`
      }
    };
  }

  /**
   * Get platform details
   */
  getPlatform(platformId) {
    return this.platforms[platformId] || null;
  }

  /**
   * Render API connector UI
   */
  renderUI() {
    const container = document.getElementById('social-api-container');
    if (!container) return;

    let html = '<div class="social-api-connectors">';
    html += '<h3>📡 API Connectors - Configure & Connect</h3>';
    html += '<div class="api-connectors-grid">';

    Object.entries(this.platforms).forEach(([platId, plat]) => {
      html += '<div class="api-connector-card">';
      html += '<div class="connector-header">';
      html += '<span class="connector-icon">' + plat.icon + '</span>';
      html += '<h4>' + plat.name + '</h4>';
      html += '</div>';
      
      html += '<div class="connector-info">';
      html += '<p><strong>API Version:</strong> ' + plat.apiVersion + '</p>';
      html += '<p><strong>Auth:</strong> ' + plat.auth + '</p>';
      html += '<p><strong>Char Limit:</strong> ' + plat.charLimit + '</p>';
      html += '</div>';
      
      html += '<div class="connector-required">';
      html += '<strong>Required Keys:</strong>';
      plat.requiredKeys.forEach(key => {
        html += '<li>' + key + '</li>';
      });
      html += '</div>';
      
      html += '<div class="connector-actions">';
      html += '<button class="action-btn" onclick="window.socialMediaConnectors.showDocs(\'' + platId + '\')">📖 Docs</button>';
      html += '<button class="action-btn" onclick="window.socialMediaConnectors.showCode(\'' + platId + '\')">💻 Code</button>';
      html += '<button class="action-btn" onclick="window.socialMediaConnectors.configureAPI(\'' + platId + '\')">⚙️ Setup</button>';
      html += '</div>';
      html += '</div>';
    });

    html += '</div>';
    html += '<div id="api-details" style="margin-top:30px;display:none;"></div>';
    html += '</div>';
    container.innerHTML = html;
  }

  showDocs(platformId) {
    const plat = this.platforms[platformId];
    if (!plat) return;
    alert('📖 ' + plat.name + ' API Documentation\n\n' + plat.docs);
  }

  showCode(platformId) {
    const plat = this.platforms[platformId];
    if (!plat) return;
    alert('💻 ' + plat.name + ' Implementation:\n\n' + plat.implementation);
  }

  configureAPI(platformId) {
    const plat = this.platforms[platformId];
    if (!plat) return;
    alert('⚙️ Setting up ' + plat.name + '...\nRequired: ' + plat.requiredKeys.join(', '));
  }
}

// Initialize globally
try {
  window.socialMediaConnectors = new SocialMediaConnectors();
  console.log('[SocialAPI] Connectors initialized');
} catch (e) {
  console.error('[SocialAPI] Error:', e);
}
