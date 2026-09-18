const STORAGE_KEY = "vpLyricsPracticeSongs";
const TRANSITION_KEY = "vpLyricsPracticeTransitionTime";
const DEFAULT_TRANSITION_TIME = 300;

const defaultSongs = [
  {
    title: "The Blood",
    sections: [
      {
        name: "V1",
        code: "V1",
        columns: 2,
        slides: [
          { name: "V1A", text: "Everything changed It's getting harder to recognize" },
          { name: "V1B", text: "The person I was Before I encountered Christ" },
          { name: "V1C", text: "I don't walk like I used to I don't talk like I used to" },
          { name: "V1D", text: "I've been washed from the inside I've been washed from the inside out" }
        ]
      },
      {
        name: "C1",
        code: "C1",
        columns: 2,
        slides: [
          { name: "C1A", text: "Hallelujah, hallelujah" },
          { name: "C1B", text: "I know it was the blood Could've only been the blood" }
        ]
      }
    ]
  }
];

let songs = [];
let currentSong = 0;
let currentSection = 0;
let currentSlide = 0;
let outputOn = false;
let transitionTime = DEFAULT_TRANSITION_TIME;
let transitionTimer = null;

const $ = id => document.getElementById(id);

function cloneDefaultSongs() {
  return JSON.parse(JSON.stringify(defaultSongs));
}

function saveLibrary() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
}

function loadLibrary() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    songs = saved ? JSON.parse(saved) : cloneDefaultSongs();
  } catch {
    songs = cloneDefaultSongs();
  }

  if (!Array.isArray(songs) || !songs.length) {
    songs = cloneDefaultSongs();
  }
}

function loadSettings() {
  const savedTransition = localStorage.getItem(TRANSITION_KEY);
  const parsedTransition = Number(savedTransition);

  transitionTime =
    savedTransition !== null && Number.isFinite(parsedTransition)
      ? Math.min(500, Math.max(0, parsedTransition))
      : DEFAULT_TRANSITION_TIME;
  updateTransitionUI();
}

function saveTransition(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return;

  transitionTime = Math.min(500, Math.max(0, parsed));

  localStorage.setItem(
    TRANSITION_KEY,
    String(transitionTime)
  );

  updateTransitionUI();
}

function updateTransitionUI() {
  if ($("timingRange")) {
    $("timingRange").value = transitionTime;
  }

  if ($("timingValue")) {
    $("timingValue").textContent =
      (transitionTime / 1000).toFixed(2) + " sec";
  }

  if ($("timingManual")) {
    $("timingManual").value =
      (transitionTime / 1000).toFixed(2);
  }

  if ($("lyric")) {
    $("lyric").style.transition =
      `opacity ${transitionTime}ms ease`;
  }
}


function getCurrentSlide() {
  const song = songs[currentSong];
  const section = song?.sections?.[currentSection];

  return section?.slides?.[currentSlide] || null;
}

function renderSongMenu() {
  const menu = $("songMenu");
  menu.innerHTML = "";

  songs.forEach((song, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className =
      "song-option" +
      (index === currentSong ? " selected" : "");

    button.textContent = song.title;

    button.onclick = () => {
      selectSong(index);
      menu.classList.remove("open");
    };

    menu.appendChild(button);
  });

  $("songName").textContent =
    songs[currentSong]?.title || "Select song";
}

function renderSlides() {
  const container = $("sections");
  container.innerHTML = "";

  const song = songs[currentSong];

  if (!song) return;

  song.sections.forEach((section, sectionIndex) => {
    const sectionWrap = document.createElement("div");
    sectionWrap.className = "slide-section";

    const name = document.createElement("div");
    name.className = "section-name";
    name.textContent =
      section.name || section.code || "";

    sectionWrap.appendChild(name);

    const grid = document.createElement("div");
    grid.className = "slide-grid";

    section.slides.forEach((slide, slideIndex) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "slide-button";
      button.textContent = slide.name;

      if (
        sectionIndex === currentSection &&
        slideIndex === currentSlide
      ) {
        button.classList.add("selected");
      }

      button.onclick = () =>
        showSlide(sectionIndex, slideIndex);

      grid.appendChild(button);
    });

    sectionWrap.appendChild(grid);
    container.appendChild(sectionWrap);
  });
}

function updateOutputButtons() {
  $("onButton").classList.toggle(
    "active",
    outputOn
  );

  $("offButton").classList.toggle(
    "active",
    !outputOn
  );
}

function setLyricText(text, animate = true) {
  const lyric = $("lyric");

  if (!outputOn) {
    lyric.classList.add("fade-out");
    lyric.style.visibility = "hidden";
    return;
  }

  if (!animate || transitionTime === 0) {
    lyric.classList.add("fade-out");

    setTimeout(() => {
      lyric.textContent = text;
      lyric.style.visibility = "visible";

      requestAnimationFrame(() => {
        lyric.classList.remove("fade-out");
      });
    }, 0);

    return;
  }

  if (transitionTimer) {
    clearTimeout(transitionTimer);
  }

  lyric.classList.add("fade-out");

  transitionTimer = setTimeout(() => {
    transitionTimer = null;

    if (!outputOn) return;

    lyric.textContent = text;
    lyric.style.visibility = "visible";

    requestAnimationFrame(() => {
      lyric.classList.remove("fade-out");
    });
  }, transitionTime);
}

function showSlide(sectionIndex, slideIndex) {
  const song = songs[currentSong];
  const section = song?.sections?.[sectionIndex];
  const slide = section?.slides?.[slideIndex];

  if (!slide) return;

  currentSection = sectionIndex;
  currentSlide = slideIndex;

  $("currentCode").textContent =
    slide.name || "";

  renderSlides();

  if (outputOn) {
    setLyricText(slide.text || "", true);
  }
}

function turnOn() {
  outputOn = true;

  if (transitionTimer) {
    clearTimeout(transitionTimer);
  }

  transitionTimer = null;

  const slide = getCurrentSlide();
  const lyric = $("lyric");

  lyric.style.transition = `opacity ${transitionTime}ms ease`;
  lyric.textContent = slide?.text || "";
  lyric.style.visibility = "visible";
  lyric.classList.add("fade-out");

  // Force the browser to register the hidden state before fading in.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (outputOn) {
        lyric.classList.remove("fade-out");
      }
    });
  });

  updateOutputButtons();
}

function turnOff() {
  outputOn = false;

  if (transitionTimer) {
    clearTimeout(transitionTimer);
  }

  transitionTimer = null;

  const lyric = $("lyric");
  lyric.style.transition = `opacity ${transitionTime}ms ease`;
  lyric.classList.add("fade-out");

  // Keep the element visible while it fades.
  // Hide it only after the fade has completed.
  const hideDelay = Math.max(0, transitionTime);

  setTimeout(() => {
    if (!outputOn) {
      lyric.style.visibility = "hidden";
    }
  }, hideDelay);

  updateOutputButtons();
}

function selectSong(index) {
  currentSong = index;
  currentSection = 0;
  currentSlide = 0;

  turnOff();

  renderSongMenu();
  renderSlides();

  const slide = getCurrentSlide();

  $("currentCode").textContent =
    slide?.name || "";
}

function parseLyrics(text) {
  const lines = text
    .split(/\r?\n/)
    .map(x => x.trim());

  const sections = [];
  let current = null;

  function createSection(name, code) {
    current = {
      name,
      code,
      columns: 2,
      slides: []
    };

    sections.push(current);
  }

  lines.forEach(line => {
    if (!line) return;

    const cleaned = line
      .replace(/^[\[\(\{]/, "")
      .replace(/[\]\)\}:]+$/, "")
      .trim();

    const n = cleaned.toLowerCase();

    let name = null;
    let code = null;
    let m;

    m = n.match(/^(verse|v)\s*(\d+)?$/);

    if (m) {
      name = cleaned;
      code = `V${m[2] || 1}`;
    }

    if (!code) {
      m = n.match(/^(chorus|c)\s*(\d+)?$/);

      if (m) {
        name = cleaned;
        code = `C${m[2] || 1}`;
      }
    }

    if (!code) {
      m = n.match(/^(bridge|b)\s*(\d+)?$/);

      if (m) {
        name = cleaned;
        code = `B${m[2] || 1}`;
      }
    }

    if (!code) {
      m = n.match(/^pre[\s-]?chorus\s*(\d+)?$/);

      if (m) {
        name = cleaned;
        code = `PC${m[1] || 1}`;
      }
    }

    if (!code) {
      m = n.match(/^intro\s*(\d+)?$/);

      if (m) {
        name = cleaned;
        code = `I${m[1] || 1}`;
      }
    }

    if (!code) {
      m = n.match(/^outro\s*(\d+)?$/);

      if (m) {
        name = cleaned;
        code = `O${m[1] || 1}`;
      }
    }

    if (!code) {
      m = n.match(/^tag\s*(\d+)?$/);

      if (m) {
        name = cleaned;
        code = `T${m[1] || 1}`;
      }
    }

    if (code) {
      createSection(name, code);
      return;
    }

    if (!current) {
      createSection("Verse 1", "V1");
    }

    const letter =
      String.fromCharCode(
        65 + current.slides.length
      );

    current.slides.push({
      name: `${current.code}${letter}`,
      text: line
    });
  });

  return sections;
}

function addSong() {
  $("managementModal").classList.add("hidden");
  $("addSongModal").classList.remove("hidden");
  $("newSongTitle").value = "";

  setTimeout(() => {
    $("newSongTitle").focus();
  }, 50);
}

function confirmAddSong() {
  const title =
    $("newSongTitle").value.trim();

  if (!title) return;

  songs.push({
    title,
    sections: [
      {
        name: "Verse 1",
        code: "V1",
        columns: 2,
        slides: [
          { name: "V1A", text: "" },
          { name: "V1B", text: "" }
        ]
      }
    ]
  });

  currentSong = songs.length - 1;
  currentSection = 0;
  currentSlide = 0;

  saveLibrary();
  renderSongMenu();
  renderSlides();
  turnOff();

  $("addSongModal").classList.add("hidden");
}

function deleteSong() {
  if (songs.length <= 1) {
    alert("You must keep at least one song.");
    return;
  }

  if (
    !confirm(
      `Delete "${songs[currentSong].title}"?`
    )
  ) {
    return;
  }

  songs.splice(currentSong, 1);

  currentSong =
    Math.max(0, currentSong - 1);

  currentSection = 0;
  currentSlide = 0;

  saveLibrary();
  renderSongMenu();
  renderSlides();
  turnOff();
}

function resetLibrary() {
  if (
    !confirm(
      "Reset the practice library to the default songs?"
    )
  ) {
    return;
  }

  songs = cloneDefaultSongs();

  currentSong = 0;
  currentSection = 0;
  currentSlide = 0;

  saveLibrary();
  renderSongMenu();
  renderSlides();
  turnOff();
}

function renderEditSections() {
  const container = $("editSections");
  container.innerHTML = "";

  const song = songs[currentSong];

  if (!song) return;

  song.sections.forEach(
    (section, sectionIndex) => {
      const sectionWrap =
        document.createElement("div");

      sectionWrap.className = "edit-section";

      const header =
        document.createElement("div");

      header.className =
        "edit-section-header";

      const sectionInput =
        document.createElement("input");

      sectionInput.className =
        "edit-section-name";

      sectionInput.value =
        section.name || "";

      sectionInput.placeholder =
        "Section name";

      sectionInput.dataset.section =
        sectionIndex;

      header.appendChild(sectionInput);

      const removeSection =
        document.createElement("button");

      removeSection.className =
        "edit-section-remove";

      removeSection.type = "button";
      removeSection.textContent = "DELETE";

      removeSection.onclick = () => {
        if (song.sections.length <= 1) {
          alert(
            "You must keep at least one section."
          );
          return;
        }

        song.sections.splice(
          sectionIndex,
          1
        );

        renderEditSections();
      };

      header.appendChild(removeSection);
      sectionWrap.appendChild(header);

      section.slides.forEach(
        (slide, slideIndex) => {
          const row =
            document.createElement("div");

          row.className = "edit-slide";

          const codeInput =
            document.createElement("input");

          codeInput.className =
            "edit-slide-code";

          codeInput.value =
            slide.name || "";

          codeInput.placeholder =
            "V1A";

          codeInput.dataset.section =
            sectionIndex;

          codeInput.dataset.slide =
            slideIndex;

          const textInput =
            document.createElement("textarea");

          textInput.className =
            "edit-slide-text";

          textInput.value =
            slide.text || "";

          textInput.placeholder =
            "Lyric text";

          textInput.rows = 2;

          textInput.dataset.section =
            sectionIndex;

          textInput.dataset.slide =
            slideIndex;

          const deleteSlide =
            document.createElement("button");

          deleteSlide.className =
            "edit-delete";

          deleteSlide.type = "button";
          deleteSlide.textContent = "×";

          deleteSlide.onclick = () => {
            if (section.slides.length <= 1) {
              alert(
                "A section must have at least one slide."
              );
              return;
            }

            section.slides.splice(
              slideIndex,
              1
            );

            renderEditSections();
          };

          row.appendChild(codeInput);
          row.appendChild(textInput);
          row.appendChild(deleteSlide);

          sectionWrap.appendChild(row);
        }
      );

      const addSlide =
        document.createElement("button");

      addSlide.className =
        "edit-add-slide";

      addSlide.type = "button";
      addSlide.textContent =
        "＋ ADD SLIDE";

      addSlide.onclick = () => {
        const code =
          section.code ||
          section.name
            ?.replace(
              /[^A-Za-z0-9]/g,
              ""
            )
            .toUpperCase() ||
          "S1";

        const letter =
          String.fromCharCode(
            65 + section.slides.length
          );

        section.slides.push({
          name: `${code}${letter}`,
          text: ""
        });

        renderEditSections();
      };

      sectionWrap.appendChild(addSlide);
      container.appendChild(sectionWrap);
    }
  );
}

function openImportLyrics() {
  $("managementModal").classList.add("hidden");
  $("lyricsInput").value = "";
  $("importModal").classList.remove("hidden");
  setTimeout(() => {
    $("lyricsInput").focus();
  }, 50);
}

function openEditSong() {
  $("managementModal").classList.add("hidden");

  const song = songs[currentSong];

  if (!song) return;

  $("editSongTitle").value =
    song.title || "";

  renderEditSections();

  $("editModal").classList.remove("hidden");
}

function saveEditSong() {
  const song = songs[currentSong];

  if (!song) return;

  const title =
    $("editSongTitle").value.trim();

  if (!title) {
    $("editSongTitle").focus();
    return;
  }

  song.title = title;

  document
    .querySelectorAll(".edit-section-name")
    .forEach(input => {
      const index =
        Number(input.dataset.section);

      if (song.sections[index]) {
        song.sections[index].name =
          input.value.trim() ||
          "Untitled";
      }
    });

  document
    .querySelectorAll(".edit-slide-code")
    .forEach(input => {
      const s =
        Number(input.dataset.section);

      const i =
        Number(input.dataset.slide);

      if (song.sections[s]?.slides[i]) {
        song.sections[s].slides[i].name =
          input.value.trim() ||
          `S${s + 1}${String.fromCharCode(65 + i)}`;
      }
    });

  document
    .querySelectorAll(".edit-slide-text")
    .forEach(input => {
      const s =
        Number(input.dataset.section);

      const i =
        Number(input.dataset.slide);

      if (song.sections[s]?.slides[i]) {
        song.sections[s].slides[i].text =
          input.value;
      }
    });

  saveLibrary();

  currentSection =
    Math.min(
      currentSection,
      song.sections.length - 1
    );

  currentSlide =
    Math.min(
      currentSlide,
      song.sections[currentSection].slides.length - 1
    );

  renderSongMenu();
  renderSlides();

  $("editModal").classList.add("hidden");

  turnOff();
}

function importLyrics() {
  const text =
    $("lyricsInput").value.trim();

  if (!text) return;

  const sections =
    parseLyrics(text);

  if (!sections.length) return;

  songs[currentSong].sections =
    sections;

  currentSection = 0;
  currentSlide = 0;

  saveLibrary();
  renderSlides();

  $("lyricsInput").value = "";
  $("importModal").classList.add("hidden");

  turnOff();
}

function closeAllModals() {
  $("managementModal").classList.add("hidden");
  $("addSongModal").classList.add("hidden");
  $("editModal").classList.add("hidden");
  $("importModal").classList.add("hidden");
}

function init() {
  loadLibrary();
  loadSettings();

  renderSongMenu();
  renderSlides();
  outputOn = false;
  updateOutputButtons();

  $("lyric").style.visibility = "hidden";
  $("lyric").classList.add("fade-out");

  $("songButton").onclick = event => {
    event.stopPropagation();

    $("songMenu").classList.toggle("open");
  };

  document.addEventListener("click", event => {
    if (
      !$("songButton").contains(event.target) &&
      !$("songMenu").contains(event.target)
    ) {
      $("songMenu").classList.remove("open");
    }
  });

  $("onButton").onclick = turnOn;
  $("offButton").onclick = turnOff;

  $("manageButton").onclick = () => {
    $("managementModal").classList.remove("hidden");
  };

  $("closeManagement").onclick =
    closeAllModals;

  $("closeManagementBottom").onclick =
    closeAllModals;

  $("addSongButton").onclick =
    addSong;

  $("editSongButton").onclick =
    openEditSong;

  $("importSongButton").onclick =
    openImportLyrics;

  $("deleteSongButton").onclick =
    deleteSong;

  $("saveLibraryButton").onclick = () => {
    saveLibrary();
    alert("Library saved.");
  };

  $("resetButton").onclick =
    resetLibrary;

  $("closeAddSong").onclick = () =>
    $("addSongModal").classList.add("hidden");

  $("cancelAddSong").onclick = () =>
    $("addSongModal").classList.add("hidden");

  $("confirmAddSong").onclick =
    confirmAddSong;

  $("closeEdit").onclick = () =>
    $("editModal").classList.add("hidden");

  $("cancelEdit").onclick = () =>
    $("editModal").classList.add("hidden");

  $("closeImport").onclick = () =>
    $("importModal").classList.add("hidden");

  $("cancelImport").onclick = () =>
    $("importModal").classList.add("hidden");

  $("confirmImport").onclick =
    importLyrics;

  $("saveEdit").onclick =
    saveEditSong;

  $("addEditSection").onclick = () => {
    const song = songs[currentSong];

    if (!song) return;

    const number =
      song.sections.length + 1;

    song.sections.push({
      name: `Verse ${number}`,
      code: `V${number}`,
      columns: 2,
      slides: [
        {
          name: `V${number}A`,
          text: ""
        },
        {
          name: `V${number}B`,
          text: ""
        }
      ]
    });

    renderEditSections();
  };

  $("timingRange").oninput = event =>
    saveTransition(event.target.value);

  $("timingManual").onchange = event => {
    let seconds =
      Number(event.target.value);

    if (!Number.isFinite(seconds)) {
      return;
    }

    seconds =
      Math.min(
        5,
        Math.max(0, seconds)
      );

    saveTransition(
      Math.round(seconds * 1000)
    );
  };

  $("newSongTitle").addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        confirmAddSong();
      }

      if (event.key === "Escape") {
        $("addSongModal").classList.add("hidden");
      }
    }
  );
}

document.addEventListener(
  "DOMContentLoaded",
  init
);


// ADD TO HOME SCREEN PROMPT
function isStandaloneApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function closeInstallPrompt() {
  const prompt = $("installPrompt");
  if (!prompt) return;

  prompt.classList.remove("show");
  prompt.setAttribute("aria-hidden", "true");
  localStorage.setItem("vpLyricsInstallPromptDismissed", "true");
}

function checkInstallPrompt() {
  const prompt = $("installPrompt");
  if (!prompt || isStandaloneApp()) return;

  const dismissed =
    localStorage.getItem("vpLyricsInstallPromptDismissed");

  if (dismissed === "true") return;

  setTimeout(() => {
    if (isStandaloneApp()) return;
    prompt.classList.add("show");
    prompt.setAttribute("aria-hidden", "false");
  }, 900);
}

// Register the service worker so the site behaves as a proper PWA.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const close = $("installPromptClose");
  const gotIt = $("installPromptGotIt");

  if (close) close.onclick = closeInstallPrompt;
  if (gotIt) gotIt.onclick = closeInstallPrompt;

  checkInstallPrompt();
});
