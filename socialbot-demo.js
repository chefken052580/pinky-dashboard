/**
 * SocialBot Demo - 5 Sample Marketing Posts about PinkyBot
 */

window.socialBotDemoPosts = [
  {
    platform: 'twitter',
    content: '🐭 Meet PinkyBot — your autonomous AI assistant that works while you sleep. Multi-platform, self-debugging, and ready to transform how you work. #AI #Automation pinkybot.io',
    hashtags: ['#AI', '#Automation', '#AssistantAI'],
    likes: 1240,
    retweets: 384
  },
  {
    platform: 'linkedin',
    content: 'Introducing PinkyBot: Enterprise-grade autonomous AI assistant with self-monitoring, real cost tracking, and a full bot army. Available for individual and enterprise users.\n\nFeatures:\n✓ Self-debugging autonomous operation\n✓ Multi-platform support\n✓ 7 specialized bots\n✓ Real AI cost transparency\n\nLearn more: pinkybot.io',
    hashtags: ['#EnterpriseAI', '#Automation', '#Innovation'],
    likes: 847,
    comments: 112
  },
  {
    platform: 'instagram',
    content: '🤖 Your new AI sidekick is here. PinkyBot works autonomously on your heartbeat schedule. Launch on your phone, desktop, or server. No setup headaches. Just pure AI power.',
    hashtags: ['#AI', '#Tech', '#Automation'],
    likes: 3420,
    comments: 287
  },
  {
    platform: 'tiktok',
    content: 'POV: You have an AI assistant that actually works. No prompting. No nagging. Just autonomous perfection. PinkyBot is here to change the game. #FutureOfWork #AI',
    duration: '15 seconds',
    views: 24500,
    likes: 8900
  },
  {
    platform: 'reddit',
    content: 'Just launched PinkyBot - an autonomous AI assistant that monitors itself, tracks costs in real-time, and runs on heartbeat intervals. Self-hosted or SaaS. Fully customizable persona. Would love feedback from this community!',
    subreddit: 'r/SelfHosted',
    upvotes: 4230,
    comments: 486
  }
];

class SocialBotDemo {
  constructor() {
    this.posts = window.socialBotDemoPosts;
  }
  
  render() {
    const container = document.getElementById('socialbot-demo-container');
    if (!container) return;
    
    let html = '<div style="padding: 1.5rem;"><h3 style="color: #4496ff;">🎬 SocialBot Demo Posts</h3>';
    html += '<p style="color: #aaaadd;">5 sample posts demonstrating PinkyBot self-marketing across platforms:</p>';
    html += '<div style="display: grid; gap: 1rem;">';
    
    this.posts.forEach((post, idx) => {
      const icon = {
        'twitter': '𝕏',
        'linkedin': '💼',
        'instagram': '📸',
        'tiktok': '🎵',
        'reddit': '🔴'
      }[post.platform] || '📱';
      
      html += `<div style="padding: 1rem; background: rgba(68,150,255,0.05); border-left: 3px solid #4496ff; border-radius: 6px;">
        <div style="margin-bottom: 0.5rem; font-weight: 600; color: #4496ff;">${icon} ${post.platform.toUpperCase()}</div>
        <div style="color: #e0e0e0; margin-bottom: 0.5rem; line-height: 1.4;">${post.content}</div>
        <div style="font-size: 0.85em; color: #6666aa;">
          ${post.likes ? '❤️ ' + post.likes + ' likes' : ''}
          ${post.retweets ? '🔄 ' + post.retweets + ' retweets' : ''}
          ${post.comments ? '💬 ' + post.comments + ' comments' : ''}
          ${post.views ? '👁️ ' + post.views + ' views' : ''}
        </div>
      </div>`;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
  }
}

window.socialBotDemo = new SocialBotDemo();
