/**
 * Post Calendar - Calendar view for scheduled posts per company
 * Features: Month/week/day views, create/edit/cancel posts, timezone-aware
 */

class PostCalendar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container #${containerId} not found`);
      return;
    }

    this.currentDate = new Date();
    this.view = 'month'; // month | week | day
    this.selectedCompanyId = localStorage.getItem('pinky_active_company') || null;
    this.scheduledPosts = [];
    this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; // User's timezone

    this.platforms = {
      twitter: { name: 'Twitter', icon: '🐦', color: '#1DA1F2' },
      instagram: { name: 'Instagram', icon: '📷', color: '#E4405F' },
      facebook: { name: 'Facebook', icon: '👍', color: '#1877F2' },
      linkedin: { name: 'LinkedIn', icon: '💼', color: '#0A66C2' },
      tiktok: { name: 'TikTok', icon: '🎵', color: '#000000' },
      youtube: { name: 'YouTube', icon: '📺', color: '#FF0000' },
      bluesky: { name: 'Bluesky', icon: '🦋', color: '#1285FE' },
      mastodon: { name: 'Mastodon', icon: '🐘', color: '#6364FF' }
    };

    this.init();
  }

  async init() {
    this.render();
    await this.loadScheduledPosts();
    this.startAutoRefresh();
  }

  /**
   * Load scheduled posts from API
   */
  async loadScheduledPosts() {
    if (!this.selectedCompanyId) {
      this.scheduledPosts = [];
      this.renderCalendar();
      return;
    }

    try {
      const response = await fetch(`/api/schedule?companyId=${this.selectedCompanyId}`);
      const data = await response.json();
      if (data.success) {
        this.scheduledPosts = data.posts;
        this.renderCalendar();
      }
    } catch (error) {
      console.error('Error loading scheduled posts:', error);
    }
  }

  /**
   * Render calendar container
   */
  render() {
    this.container.innerHTML = `
      <div class="post-calendar">
        <div class="calendar-header">
          <div class="calendar-controls">
            <button class="btn-prev" onclick="postCalendar.prevPeriod()">←</button>
            <h2 class="current-period">${this.getFormattedPeriod()}</h2>
            <button class="btn-next" onclick="postCalendar.nextPeriod()">→</button>
          </div>
          <div class="calendar-actions">
            <div class="view-switcher">
              <button class="view-btn ${this.view === 'month' ? 'active' : ''}" onclick="postCalendar.switchView('month')">Month</button>
              <button class="view-btn ${this.view === 'week' ? 'active' : ''}" onclick="postCalendar.switchView('week')">Week</button>
              <button class="view-btn ${this.view === 'day' ? 'active' : ''}" onclick="postCalendar.switchView('day')">Day</button>
            </div>
            <button class="btn-schedule-post" onclick="postCalendar.showScheduleModal()">+ Schedule Post</button>
          </div>
        </div>
        <div class="calendar-body">
          ${this.renderCalendar()}
        </div>
      </div>
    `;
  }

  /**
   * Render calendar view (month/week/day)
   */
  renderCalendar() {
    const calendarBody = this.container.querySelector('.calendar-body');
    if (!calendarBody) return '';

    if (this.view === 'month') {
      calendarBody.innerHTML = this.renderMonthView();
    } else if (this.view === 'week') {
      calendarBody.innerHTML = this.renderWeekView();
    } else {
      calendarBody.innerHTML = this.renderDayView();
    }

    return calendarBody.innerHTML;
  }

  /**
   * Render month view
   */
  renderMonthView() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    let html = '<div class="month-view"><div class="weekday-headers">';
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
      html += `<div class="weekday-header">${day}</div>`;
    });
    html += '</div><div class="month-grid">';

    // Empty cells before first day
    for (let i = 0; i < startDayOfWeek; i++) {
      html += '<div class="day-cell empty"></div>';
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = this.isToday(date);
      const postsOnDay = this.getPostsOnDate(date);

      html += `
        <div class="day-cell ${isToday ? 'today' : ''}" onclick="postCalendar.selectDay(${year}, ${month}, ${day})">
          <div class="day-number">${day}</div>
          <div class="day-posts">
            ${postsOnDay.slice(0, 3).map(post => this.renderPostBadge(post)).join('')}
            ${postsOnDay.length > 3 ? `<div class="more-posts">+${postsOnDay.length - 3} more</div>` : ''}
          </div>
        </div>
      `;
    }

    html += '</div></div>';
    return html;
  }

  /**
   * Render week view
   */
  renderWeekView() {
    const weekStart = this.getWeekStart(this.currentDate);
    let html = '<div class="week-view"><div class="week-grid">';

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const isToday = this.isToday(date);
      const postsOnDay = this.getPostsOnDate(date);

      html += `
        <div class="day-column ${isToday ? 'today' : ''}">
          <div class="day-header">
            ${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div class="day-posts-list">
            ${postsOnDay.map(post => this.renderPostCard(post)).join('')}
          </div>
        </div>
      `;
    }

    html += '</div></div>';
    return html;
  }

  /**
   * Render day view
   */
  renderDayView() {
    const postsOnDay = this.getPostsOnDate(this.currentDate).sort((a, b) => 
      new Date(a.scheduledTime) - new Date(b.scheduledTime)
    );

    let html = `
      <div class="day-view">
        <div class="day-header-large">
          ${this.currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div class="day-posts-detailed">
    `;

    if (postsOnDay.length === 0) {
      html += '<div class="no-posts">No posts scheduled for this day</div>';
    } else {
      postsOnDay.forEach(post => {
        html += this.renderPostDetailCard(post);
      });
    }

    html += '</div></div>';
    return html;
  }

  /**
   * Render post badge (small, for month view)
   */
  renderPostBadge(post) {
    const platform = this.platforms[post.platform] || { icon: '📝', color: '#666' };
    return `<div class="post-badge" style="background: ${platform.color}" title="${post.content.substring(0, 50)}...">${platform.icon}</div>`;
  }

  /**
   * Render post card (medium, for week view)
   */
  renderPostCard(post) {
    const platform = this.platforms[post.platform] || { name: 'Unknown', icon: '📝', color: '#666' };
    const time = new Date(post.scheduledTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const statusClass = post.status === 'scheduled' ? 'scheduled' : post.status === 'posted' ? 'posted' : 'failed';

    return `
      <div class="post-card ${statusClass}" onclick="postCalendar.viewPost('${post.id}')">
        <div class="post-platform" style="background: ${platform.color}">${platform.icon}</div>
        <div class="post-time">${time}</div>
        <div class="post-content">${post.content.substring(0, 60)}...</div>
      </div>
    `;
  }

  /**
   * Render post detail card (large, for day view)
   */
  renderPostDetailCard(post) {
    const platform = this.platforms[post.platform] || { name: 'Unknown', icon: '📝', color: '#666' };
    const time = new Date(post.scheduledTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const statusBadge = post.status === 'scheduled' ? '🟢 Scheduled' : post.status === 'posted' ? '✅ Posted' : '❌ Failed';

    return `
      <div class="post-detail-card" data-post-id="${post.id}">
        <div class="post-detail-header">
          <div class="post-platform-large" style="background: ${platform.color}">${platform.icon} ${platform.name}</div>
          <div class="post-time-large">${time}</div>
          <div class="post-status">${statusBadge}</div>
        </div>
        <div class="post-content-full">${post.content}</div>
        ${post.media ? `<div class="post-media">📎 Media attached</div>` : ''}
        <div class="post-actions">
          ${post.status === 'scheduled' ? `
            <button class="btn-edit" onclick="postCalendar.editPost('${post.id}')">Edit</button>
            <button class="btn-cancel" onclick="postCalendar.cancelPost('${post.id}')">Cancel</button>
          ` : ''}
          <button class="btn-view-analytics">View Analytics</button>
        </div>
      </div>
    `;
  }

  /**
   * Get posts scheduled on a specific date
   */
  getPostsOnDate(date) {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return this.scheduledPosts.filter(post => {
      const postDateStr = new Date(post.scheduledTime).toISOString().split('T')[0];
      return postDateStr === dateStr;
    });
  }

  /**
   * Check if date is today
   */
  isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  /**
   * Get start of week for a date (Sunday)
   */
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  /**
   * Get formatted period string
   */
  getFormattedPeriod() {
    if (this.view === 'month') {
      return this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (this.view === 'week') {
      const weekStart = this.getWeekStart(this.currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return this.currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  }

  /**
   * Navigate to previous period
   */
  prevPeriod() {
    if (this.view === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    } else if (this.view === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() - 7);
    } else {
      this.currentDate.setDate(this.currentDate.getDate() - 1);
    }
    this.render();
  }

  /**
   * Navigate to next period
   */
  nextPeriod() {
    if (this.view === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    } else if (this.view === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() + 7);
    } else {
      this.currentDate.setDate(this.currentDate.getDate() + 1);
    }
    this.render();
  }

  /**
   * Switch calendar view
   */
  switchView(view) {
    this.view = view;
    this.render();
  }

  /**
   * Select a day (switch to day view)
   */
  selectDay(year, month, day) {
    this.currentDate = new Date(year, month, day);
    this.switchView('day');
  }

  /**
   * Show schedule post modal
   */
  showScheduleModal() {
    // TODO: Implement modal UI for scheduling posts
    alert('Schedule Post modal - TODO: Implement UI');
  }

  /**
   * View post details
   */
  viewPost(postId) {
    const post = this.scheduledPosts.find(p => p.id === postId);
    if (post) {
      console.log('View post:', post);
      // TODO: Show post details modal
    }
  }

  /**
   * Edit scheduled post
   */
  async editPost(postId) {
    // TODO: Implement edit modal
    alert('Edit Post modal - TODO: Implement UI');
  }

  /**
   * Cancel scheduled post
   */
  async cancelPost(postId) {
    if (!confirm('Are you sure you want to cancel this scheduled post?')) return;

    try {
      const response = await fetch(`/api/schedule/${postId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        alert('Post cancelled successfully');
        await this.loadScheduledPosts();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error cancelling post:', error);
      alert('Failed to cancel post');
    }
  }

  /**
   * Start auto-refresh (every 60 seconds)
   */
  startAutoRefresh() {
    setInterval(() => {
      this.loadScheduledPosts();
    }, 60000); // Refresh every minute
  }
}

// Global instance (will be initialized by dashboard)
let postCalendar = null;
