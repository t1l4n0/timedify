// CountifyCountdown Class - Advanced countdown timer functionality
class CountifyCountdown {
  constructor(block) {
    if (!block || block.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    this.block = block;
    this.settings = this.parseSettings();
    this.countdownInterval = null;
    this.isExpired = false;

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
    this.setupCountdown();
    this.updateCountdown();
  }

  setupCountdown() {
    const countdownContainer = this.block.querySelector('.countdown-container');
    if (!countdownContainer) return;

    countdownContainer.style.display = 'flex';

    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  updateCountdown() {
    const now = new Date();
    const targetTime = this.settings.target_datetime ? new Date(this.settings.target_datetime) : null;

    if (!targetTime) {
      this.stopCountdown();
      return;
    }

    const timeLeft = targetTime - now;

    if (timeLeft <= 0) {
      this.handleExpired();
      return;
    }

    this.isExpired = false;
    this.calculateAndDisplayTime(timeLeft);
  }

  calculateAndDisplayTime(timeLeft) {
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // Update countdown display based on style
    this.updateDisplay(days, hours, minutes, seconds);
  }

  updateDisplay(days, hours, minutes, seconds) {
    const style = this.settings.countdown_style || 'digital';

    switch (style) {
      case 'digital':
        this.updateDigitalDisplay(days, hours, minutes, seconds);
        break;
      case 'flip':
        this.updateFlipDisplay(days, hours, minutes, seconds);
        break;
      case 'circular':
        this.updateCircularDisplay(days, hours, minutes, seconds);
        break;
      case 'minimal':
        this.updateMinimalDisplay(days, hours, minutes, seconds);
        break;
      default:
        this.updateDigitalDisplay(days, hours, minutes, seconds);
    }
  }

  updateDigitalDisplay(days, hours, minutes, seconds) {
    const daysElement = this.block.querySelector('#days-' + this.block.id);
    const hoursElement = this.block.querySelector('#hours-' + this.block.id);
    const minutesElement = this.block.querySelector('#minutes-' + this.block.id);
    const secondsElement = this.block.querySelector('#seconds-' + this.block.id);

    if (daysElement) daysElement.textContent = this.padZero(days);
    if (hoursElement) hoursElement.textContent = this.padZero(hours);
    if (minutesElement) minutesElement.textContent = this.padZero(minutes);
    if (secondsElement) secondsElement.textContent = this.padZero(seconds);
  }

  updateFlipDisplay(days, hours, minutes, seconds) {
    // Flip card animation logic would go here
    this.updateDigitalDisplay(days, hours, minutes, seconds);
  }

  updateCircularDisplay(days, hours, minutes, seconds) {
    // Circular progress logic would go here
    this.updateDigitalDisplay(days, hours, minutes, seconds);
  }

  updateMinimalDisplay(days, hours, minutes, seconds) {
    const totalHours = days * 24 + hours;
    const totalMinutes = totalHours * 60 + minutes;
    
    const hoursElement = this.block.querySelector('#hours-' + this.block.id);
    const minutesElement = this.block.querySelector('#minutes-' + this.block.id);
    const secondsElement = this.block.querySelector('#seconds-' + this.block.id);

    if (hoursElement) hoursElement.textContent = this.padZero(totalHours);
    if (minutesElement) minutesElement.textContent = this.padZero(minutes);
    if (secondsElement) secondsElement.textContent = this.padZero(seconds);
  }

  padZero(num) {
    return num.toString().padStart(2, '0');
  }

  handleExpired() {
    if (this.isExpired) return;
    
    this.isExpired = true;
    this.stopCountdown();

    const countdownContainer = this.block.querySelector('.countdown-container');
    if (countdownContainer) {
      countdownContainer.innerHTML = this.settings.expired_message || 'Time\'s up!';
      countdownContainer.classList.add('expired');
    }

    // Trigger custom event
    const event = new CustomEvent('countify:expired', {
      detail: { block: this.block, settings: this.settings }
    });
    document.dispatchEvent(event);
  }

  stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  // Public method to manually stop countdown
  destroy() {
    this.stopCountdown();
  }
}

// Initialize all countify countdown blocks
const initializeCountifyCountdown = () => {
  try {
    const blocks = document.querySelectorAll(".countify-countdown");
    if (blocks && blocks.length > 0) {
      blocks.forEach((block) => {
        if (block && block.nodeType === Node.ELEMENT_NODE) {
          new CountifyCountdown(block);
        }
      });
    }
  } catch (error) {
    console.error('Countify Countdown initialization error:', error);
  }
};

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCountifyCountdown);
} else {
  initializeCountifyCountdown();
}

// Re-initialize when theme sections are loaded (for theme editor)
document.addEventListener('shopify:section:load', (event) => {
  const countdownBlocks = event.target.querySelectorAll('.countify-countdown');
  countdownBlocks.forEach(block => {
    new CountifyCountdown(block);
  });
});
