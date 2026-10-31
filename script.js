(() => {
  const pages = window.storyData;
  const cover = document.getElementById("home");
  const reader = document.getElementById("reader");
  const stage = document.getElementById("readingStage");
  const pageJump = document.getElementById("pageJump");
  const progressFill = document.getElementById("progressFill");
  const previousButton = document.getElementById("previousPage");
  const nextButton = document.getElementById("nextPage");
  const chapterList = document.getElementById("chapterList");
  const drawer = document.getElementById("chapterDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const drawerToggle = document.getElementById("chapterMenuToggle");
  const drawerClose = document.getElementById("chapterMenuClose");
  const backButton = document.getElementById("backToCover");
  const startButton = document.getElementById("startReading");
  const resumeHint = document.getElementById("resumeHint");
  const audioStatus = document.getElementById("audioStatus");
  const music = document.getElementById("backgroundMusic");
  const musicToggle = document.getElementById("musicToggle");
  const musicToggleLabel = document.getElementById("musicToggleLabel");
  const musicVolume = document.getElementById("musicVolume");
  const musicVolumeValue = document.getElementById("musicVolumeValue");
  const savedPageKey = "website-novel:last-read-page";
  let currentPage = 0;
  let drawerTimer;
  let audioMessageTimer;

  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error("Data cerita tidak ditemukan. Pastikan story-data.js dimuat sebelum script.js.");
  }

  const padPage = (number) => String(number).padStart(2, "0");

  function showStorageError(action, error) {
    console.error(`Progres membaca tidak dapat ${action}.`, error);
    showAudioStatus("Progres bacaan tidak dapat disimpan di browser ini.");
  }

  function showAudioStatus(message) {
    audioStatus.textContent = message;
    audioStatus.classList.add("is-visible");
    window.clearTimeout(audioMessageTimer);
    audioMessageTimer = window.setTimeout(() => audioStatus.classList.remove("is-visible"), 5000);
  }

  function updateMusicControls(isPlaying) {
    musicToggle.setAttribute("aria-pressed", String(isPlaying));
    musicToggle.setAttribute("aria-label", isPlaying ? "Matikan musik latar" : "Putar musik latar");
    musicToggleLabel.textContent = isPlaying ? "MUSIK HIDUP" : "MUSIK MATI";
  }

  async function playMusic() {
    try {
      await music.play();
      updateMusicControls(true);
      audioStatus.classList.remove("is-visible");
      window.clearTimeout(audioMessageTimer);
    } catch (error) {
      updateMusicControls(false);
      if (error.name === "NotAllowedError") {
        showAudioStatus("Autoplay diblokir browser. Tekan tombol musik untuk mulai memutar.");
        return;
      }
      console.error("Musik latar tidak dapat diputar.", error);
      showAudioStatus("Musik latar tidak dapat diputar. Periksa file musik dan coba lagi.");
    }
  }

  function handleFirstInteraction(event) {
    if (event.target instanceof Element && event.target.closest("#musicToggle")) return;
    document.removeEventListener("pointerdown", handleFirstInteraction, true);
    document.removeEventListener("keydown", handleFirstInteraction, true);
    void playMusic();
  }

  function loadSavedPage() {
    try {
      const savedPage = localStorage.getItem(savedPageKey);
      if (savedPage === null) return 0;
      const parsedPage = Number(savedPage);
      if (!Number.isInteger(parsedPage) || parsedPage < 0 || parsedPage >= pages.length) {
        localStorage.removeItem(savedPageKey);
        return 0;
      }
      return parsedPage;
    } catch (error) {
      showStorageError("dibaca", error);
      return 0;
    }
  }

  function saveCurrentPage() {
    try {
      localStorage.setItem(savedPageKey, String(currentPage));
    } catch (error) {
      showStorageError("disimpan", error);
    }
  }

  function updateResumeHint() {
    const label = startButton.querySelector("span");
    if (currentPage > 0) {
      label.textContent = "LANJUTKAN MEMBACA";
      resumeHint.textContent = `Terakhir dibaca di halaman ${currentPage + 1} dari ${pages.length}.`;
      return;
    }
    label.textContent = "MULAI MEMBACA";
    resumeHint.textContent = "Bacalah perlahan. Tidak ada yang perlu dikejar.";
  }

  function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function renderPage(page) {
    const content = document.createElement("article");

    if (page.type === "chapter") {
      content.className = "chapter-opener page-content";
      const numberSpace = createTextElement("span", "chapter-number");
      numberSpace.setAttribute("aria-hidden", "true");
      const copy = createTextElement("div", "chapter-opener-copy");
      copy.append(createTextElement("h2", "", page.title));
      if (page.subtitle) copy.append(createTextElement("p", "chapter-subtitle", page.subtitle));
      const rule = createTextElement("span", "opener-rule");
      rule.setAttribute("aria-hidden", "true");
      copy.append(rule, createTextElement("p", "opener-invitation", page.invitation || "TARIK NAPAS. KITA MULAI."));
      content.append(numberSpace, copy);
      return content;
    }

    if (page.type === "story") {
      content.className = "story-page page-content";
      const chapterTitle = page.chapter.replace(/^(?:[IVXLCDM]+\.|BAB\s+\d+\s*[—-])\s*/u, "");
      page.paragraphs.forEach((paragraph, index) => {
        const storyParagraph = createTextElement("p", "story-page-paragraph", paragraph);
        if (index === page.paragraphs.length - 1) storyParagraph.classList.add("is-last");
        content.append(storyParagraph);
      });
      const footer = createTextElement("footer", "story-page-footer");
      const footerCopy = createTextElement("div", "story-page-footer-copy");
      footerCopy.append(
        createTextElement("p", "story-page-heading", chapterTitle),
        createTextElement("p", "story-page-book-title", "Setelah Segala yang Tidak Aku Mengerti")
      );
      footer.append(
        footerCopy,
        createTextElement("p", "story-page-author", "Arofiu Rizki Samar CS")
      );
      content.append(footer);
      return content;
    }

    if (page.type === "ending") {
      content.className = "ending-page page-content";
      content.append(
        createTextElement("p", "eyebrow", page.eyebrow),
        createTextElement("h2", "", page.title)
      );
      const rule = createTextElement("span", "ending-rule");
      rule.setAttribute("aria-hidden", "true");
      content.append(rule, createTextElement("p", "ending-label", page.label));
      const restartButton = createTextElement("button", "read-again", "BACA LAGI DARI AWAL");
      restartButton.type = "button";
      restartButton.addEventListener("click", () => showPage(0));
      content.append(restartButton);
      return content;
    }

    throw new Error(`Jenis halaman cerita tidak dikenal: ${page.type}`);
  }

  function updateChapterList() {
    const fragment = document.createDocumentFragment();
    pages.forEach((page, index) => {
      if (page.type !== "chapter") return;
      const button = createTextElement("button", "chapter-link");
      button.type = "button";
      button.dataset.page = String(index);
      button.append(
        createTextElement("span", "chapter-link-number", page.number.replace("BAB ", "")),
        createTextElement("span", "chapter-link-title", page.title)
      );
      button.addEventListener("click", () => {
        closeDrawer();
        showPage(index);
      });
      fragment.append(button);
    });
    chapterList.replaceChildren(fragment);
  }

  function updateReader() {
    const page = pages[currentPage];
    stage.replaceChildren(renderPage(page));
    pageJump.value = String(currentPage);
    progressFill.style.width = `${((currentPage + 1) / pages.length) * 100}%`;
    previousButton.disabled = currentPage === 0;
    nextButton.disabled = currentPage === pages.length - 1;
    nextButton.setAttribute("aria-label", currentPage === pages.length - 1 ? "Cerita selesai" : "Halaman berikutnya");
    chapterList.querySelectorAll(".chapter-link").forEach((button) => {
      button.classList.toggle("is-current", Number(button.dataset.page) === currentPage);
    });
    updateResumeHint();
  }

  function showPage(index) {
    if (!Number.isInteger(index) || index < 0 || index >= pages.length) return;
    if (index === currentPage) return;
    const direction = index > currentPage ? "forward" : "backward";
    currentPage = index;
    saveCurrentPage();
    updateReader();
    stage.firstElementChild.classList.add(`is-turning-${direction}`);
  }

  function updatePagePicker() {
    const fragment = document.createDocumentFragment();
    pages.forEach((page, index) => {
      let label;
      if (page.type === "chapter") {
        label = `${padPage(index + 1)} · Pembuka — ${page.title}`;
      } else if (page.type === "story") {
        const chapterTitle = page.chapter.replace(/^(?:[IVXLCDM]+\.|BAB\s+\d+\s*[—-])\s*/u, "");
        label = `${padPage(index + 1)} · ${chapterTitle}`;
      } else {
        label = `${padPage(index + 1)} · Penutup`;
      }
      const option = createTextElement("option", "", label);
      option.value = String(index);
      fragment.append(option);
    });
    pageJump.replaceChildren(fragment);
  }

  function openReader() {
    cover.hidden = true;
    reader.hidden = false;
    showPage(currentPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
    stage.focus({ preventScroll: true });
  }

  function returnToCover() {
    reader.hidden = true;
    cover.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
    startButton.focus({ preventScroll: true });
  }

  function openDrawer() {
    window.clearTimeout(drawerTimer);
    drawer.hidden = false;
    drawerBackdrop.hidden = false;
    requestAnimationFrame(() => {
      drawer.classList.add("is-open");
      drawerBackdrop.classList.add("is-open");
    });
    drawer.setAttribute("aria-hidden", "false");
    drawer.inert = false;
    drawerToggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("drawer-open");
    drawerClose.focus();
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawerBackdrop.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    drawer.inert = true;
    drawerToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("drawer-open");
    window.clearTimeout(drawerTimer);
    drawerTimer = window.setTimeout(() => {
      drawer.hidden = true;
      drawerBackdrop.hidden = true;
    }, 380);
    drawerToggle.focus();
  }

  startButton.addEventListener("click", openReader);
  backButton.addEventListener("click", returnToCover);
  pageJump.addEventListener("change", () => showPage(Number(pageJump.value)));
  musicToggle.addEventListener("click", () => {
    document.removeEventListener("pointerdown", handleFirstInteraction, true);
    document.removeEventListener("keydown", handleFirstInteraction, true);
    if (music.paused) {
      void playMusic();
      return;
    }
    music.pause();
    updateMusicControls(false);
  });
  musicVolume.addEventListener("input", () => {
    music.volume = Number(musicVolume.value) / 100;
    musicVolumeValue.value = `${musicVolume.value}%`;
  });
  music.addEventListener("play", () => updateMusicControls(true));
  music.addEventListener("pause", () => updateMusicControls(false));
  music.addEventListener("error", () => {
    const error = music.error;
    if (!error) return;
    console.error("File musik latar gagal dimuat.", error);
    updateMusicControls(false);
    showAudioStatus("File musik latar gagal dimuat. Pastikan MP3 berada di folder website.");
  });
  previousButton.addEventListener("click", () => showPage(currentPage - 1));
  nextButton.addEventListener("click", () => showPage(currentPage + 1));
  drawerToggle.addEventListener("click", openDrawer);
  drawerClose.addEventListener("click", closeDrawer);
  drawerBackdrop.addEventListener("click", closeDrawer);

  document.querySelector("[data-home]").addEventListener("click", (event) => {
    event.preventDefault();
    returnToCover();
  });

  document.addEventListener("keydown", (event) => {
    const drawerOpen = drawer.classList.contains("is-open");
    if (drawerOpen && event.key === "Escape") {
      closeDrawer();
      return;
    }
    if (reader.hidden || drawerOpen || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
    if (event.key === "ArrowRight" && currentPage < pages.length - 1) {
      event.preventDefault();
      showPage(currentPage + 1);
    } else if (event.key === "ArrowLeft" && currentPage > 0) {
      event.preventDefault();
      showPage(currentPage - 1);
    }
  });

  currentPage = loadSavedPage();
  music.volume = Number(musicVolume.value) / 100;
  musicVolumeValue.value = `${musicVolume.value}%`;
  updateMusicControls(false);
  document.addEventListener("pointerdown", handleFirstInteraction, true);
  document.addEventListener("keydown", handleFirstInteraction, true);
  void playMusic();
  updatePagePicker();
  updateChapterList();
  updateReader();
})();
