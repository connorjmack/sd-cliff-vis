class Timeline {
  constructor(epochs, onEpochChange) {
    this.epochs = epochs;
    this.currentIndex = 0;
    this.onEpochChange = onEpochChange;
    this.isPlaying = false;
    this.playInterval = null;
    this.playSpeed = 2000; // ms between epochs
  }

  render(container) {
    container.innerHTML = `
      <div class="timeline-info">
        <span id="timeline-date"></span>
        <span id="timeline-counter"></span>
      </div>
      <div class="timeline-slider">
        <input type="range" id="epoch-slider"
          min="0" max="${this.epochs.length - 1}"
          value="${this.currentIndex}">
      </div>
      <div class="timeline-controls">
        <button id="btn-prev" title="Previous (←)">◀</button>
        <button id="btn-play" title="Play/Pause (Space)">▶</button>
        <button id="btn-next" title="Next (→)">▶</button>
      </div>
    `;

    this.bindEvents();
    this.updateUI();
  }

  bindEvents() {
    document.getElementById("epoch-slider").addEventListener("input", (e) => {
      this.setEpoch(parseInt(e.target.value));
    });

    document.getElementById("btn-prev").addEventListener("click", () => this.prevEpoch());
    document.getElementById("btn-next").addEventListener("click", () => this.nextEpoch());
    document.getElementById("btn-play").addEventListener("click", () => this.togglePlay());

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") this.prevEpoch();
      if (e.key === "ArrowRight") this.nextEpoch();
      if (e.key === " ") { e.preventDefault(); this.togglePlay(); }
    });
  }

  setEpoch(index) {
    if (index < 0 || index >= this.epochs.length) return;
    this.currentIndex = index;
    this.updateUI();
    this.onEpochChange(this.epochs[index]);
  }

  nextEpoch() {
    this.setEpoch((this.currentIndex + 1) % this.epochs.length);
  }

  prevEpoch() {
    this.setEpoch((this.currentIndex - 1 + this.epochs.length) % this.epochs.length);
  }

  togglePlay() {
    this.isPlaying ? this.pause() : this.play();
  }

  play() {
    this.isPlaying = true;
    document.getElementById("btn-play").textContent = "⏸";
    this.playInterval = setInterval(() => this.nextEpoch(), this.playSpeed);
  }

  pause() {
    this.isPlaying = false;
    document.getElementById("btn-play").textContent = "▶";
    clearInterval(this.playInterval);
  }

  updateUI() {
    const epoch = this.epochs[this.currentIndex];
    document.getElementById("timeline-date").textContent = formatDate(epoch.date);
    document.getElementById("timeline-counter").textContent =
      `${this.currentIndex + 1} / ${this.epochs.length}`;
    document.getElementById("epoch-slider").value = this.currentIndex;
  }

  getCurrentEpoch() {
    return this.epochs[this.currentIndex];
  }
}
