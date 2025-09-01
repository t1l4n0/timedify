// TimedContent Class - Handles time-based content visibility
  class TimedContent {
    constructor(block) {
    if (!block || block.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      this.block = block;
    this.settings = this.parseSettings();
    this.isActive = false;
      this.countdownInterval = null;

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
    this.setupCountdown();
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

  setupCountdown() {
    if (!this.settings.show_countdown) return;

    const countdownContainer = this.block.querySelector('.countdown-container');
    if (!countdownContainer) return;

    countdownContainer.style.display = 'flex';

    this.updateCountdown();
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  updateCountdown() {
    const now = new Date();
    const endTime = this.settings.end_datetime ? new Date(this.settings.end_datetime) : null;

    if (!endTime || now >= endTime) {
      this.stopCountdown();
      return;
    }

    const timeLeft = endTime - now;
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // Update countdown display
    const daysElement = this.block.querySelector('#days-' + this.block.id);
    const hoursElement = this.block.querySelector('#hours-' + this.block.id);
    const minutesElement = this.block.querySelector('#minutes-' + this.block.id);
    const secondsElement = this.block.querySelector('#seconds-' + this.block.id);

    if (daysElement) daysElement.textContent = days;
    if (hoursElement) hoursElement.textContent = hours;
    if (minutesElement) minutesElement.textContent = minutes;
    if (secondsElement) secondsElement.textContent = seconds;
  }

  stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    const countdownContainer = this.block.querySelector('.countdown-container');
    if (countdownContainer) {
      countdownContainer.style.display = 'none';
    }
  }
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
