// TimedContent Class - Handles time-based content visibility
  class TimedContent {
    constructor(block) {
    if (!block || block.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      this.block = block;
    this.settings = this.parseSettings();
    this.isActive = false;

    this.init();
  }

  parseSettings() {
    try {
      const settingsStr = this.block.getAttribute('data-settings');
      return settingsStr ? JSON.parse(settingsStr) : {};
    } catch (e) {
      return {};
    }
  }

  init() {
    this.checkTimeStatus();
    this.setupTimeCheck();
  }

  checkTimeStatus() {
    const now = new Date();
    const startTime = this.settings.start_datetime ? new Date(this.settings.start_datetime) : null;
    const endTime = this.settings.end_datetime ? new Date(this.settings.end_datetime) : null;

    this.isActive = true;

    if (startTime && now < startTime) {
      this.isActive = false;
    }

    if (endTime && now > endTime) {
      this.isActive = false;
    }

    this.updateVisibility();
  }

  updateVisibility() {
    if (this.isActive) {
      this.block.style.display = 'block';
      this.block.classList.add('active');
      this.block.classList.remove('inactive');
    } else {
      this.block.style.display = 'none';
      this.block.classList.add('inactive');
      this.block.classList.remove('active');
    }
  }

  setupTimeCheck() {
    // Check every minute for time changes
    setInterval(() => {
      this.checkTimeStatus();
    }, 60000);
  }

  // Countdown functionality removed - now available in Countify app
}

// Initialize all timed content blocks
const initializeTimedContent = () => {
  try {
    const blocks = document.querySelectorAll(".timed-content");
    if (blocks && blocks.length > 0) {
      blocks.forEach((block) => {
        if (block && block.nodeType === Node.ELEMENT_NODE) {
          new TimedContent(block);
        }
      });
    }
  } catch (error) {
    // Silently handle any errors to prevent console spam
  }
};

// Initialize when DOM is ready
  if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeTimedContent);
  } else {
  initializeTimedContent();
  }
