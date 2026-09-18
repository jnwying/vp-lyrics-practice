/* =========================================================
   VP LYRICS CONTROL
   SONG LIBRARY + LYRIC IMPORTER + LOCAL STORAGE
========================================================= */


const STORAGE_KEY = "vpLyricsSongs";


/* =========================================================
   TRANSITION SETTINGS
========================================================= */

/*
   300 = 0.3 second fade

   Change this number if you want:

   150 = very fast
   300 = normal
   500 = slower
   800 = slow
*/

const DEFAULT_TRANSITION_TIME = 300;

let transitionTime = DEFAULT_TRANSITION_TIME;
let lyricTransitionTimer = null;

function loadTransitionSetting() {
    const saved = localStorage.getItem("vpLyricsTransitionTime");

    if (saved !== null) {
        const parsed = Number(saved);

        if (Number.isFinite(parsed)) {
            transitionTime = Math.min(500, Math.max(0, parsed));
        }
    }

    updateTransitionSettingUI();
    applyTransitionTime();
}

function updateTransitionSettingUI() {
    const slider = document.getElementById("transitionTimeRange");
    const valueDisplay = document.getElementById("transitionTimeValue");
    const manualInput = document.getElementById("transitionTimeManual");

    if (slider) {
        slider.value = Math.min(500, transitionTime);
    }

    if (valueDisplay) {
        valueDisplay.textContent =
            `${(transitionTime / 1000).toFixed(2)} sec`;
    }

    if (manualInput) {
        manualInput.value =
            (transitionTime / 1000).toFixed(2);
    }
}

function applyTransitionTime() {
    const lyric = document.getElementById("lyric");

    if (lyric) {
        lyric.style.transition = `opacity ${transitionTime}ms ease`;
    }
}

function saveTransitionSetting(value) {
    transitionTime = Math.min(500, Math.max(0, Number(value)));

    localStorage.setItem(
        "vpLyricsTransitionTime",
        String(transitionTime)
    );

    updateTransitionSettingUI();
    applyTransitionTime();
}
function saveManualTransitionSetting(value) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return;
    }

    const seconds = Math.min(5, Math.max(0, parsed));

    transitionTime = Math.round(seconds * 1000);

    localStorage.setItem(
        "vpLyricsTransitionTime",
        String(transitionTime)
    );

    updateTransitionSettingUI();
    applyTransitionTime();
}

/* =========================================================
   DEFAULT SONGS
========================================================= */

const defaultSongs = [

    {
        title: "The Blood",

        sections: [

            {
                name: "V1",

                columns: 4,

                slides: [

                    {
                        name: "V1A",
                        text: "Everything changed It's getting harder to recognize"
                    },

                    {
                        name: "V1B",
                        text: "The person I was Before I encountered Christ"
                    },

                    {
                        name: "V1C",
                        text: "I don't walk like I used to I don't talk like I used to"
                    },

                    {
                        name: "V1D",
                        text: "I've been washed from the inside I've been washed from the inside out"
                    }

                ]

            },


            {
                name: "C1",

                columns: 2,

                slides: [

                    {
                        name: "C1A",
                        text: "Hallelujah, hallelujah"
                    },

                    {
                        name: "C1B",
                        text: "I know it was the blood Could've only been the blood"
                    }

                ]

            }

        ]

    }

];


/* =========================================================
   STATE
========================================================= */

let songs;

let currentSong = 0;

let currentSection = 0;

let currentSlide = 0;

let outputOn = false;


/* =========================================================
   LOAD LIBRARY
========================================================= */

function loadLibrary() {

    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (saved) {

        try {

            songs = JSON.parse(saved);

        }

        catch (error) {

            console.error(
                "Could not load saved library:",
                error
            );


            songs =
                JSON.parse(
                    JSON.stringify(defaultSongs)
                );

        }

    }

    else {

        songs =
            JSON.parse(
                JSON.stringify(defaultSongs)
            );

    }


    /*
       Safety check
    */

    if (
        !songs ||
        !Array.isArray(songs) ||
        songs.length === 0
    ) {

        songs =
            JSON.parse(
                JSON.stringify(defaultSongs)
            );

    }


    currentSong = 0;

    currentSection = 0;

    currentSlide = 0;


    renderEverything();

}


/* =========================================================
   SAVE LIBRARY
========================================================= */

function saveLibrary() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(songs)
    );

}


/* =========================================================
   SHOW LYRIC
========================================================= */

function showLyric(
    sectionIndex,
    slideIndex
) {

    const song = songs[currentSong];

    if (!song) {
        return;
    }

    const section = song.sections[sectionIndex];

    if (!section) {
        return;
    }

    const slide = section.slides[slideIndex];

    if (!slide) {
        return;
    }

    const lyric = document.getElementById("lyric");

    /* Always update the selected slide, even when OUTPUT is OFF. */
    currentSection = sectionIndex;
    currentSlide = slideIndex;
    updateSelectedSlide();

    /*
       IMPORTANT:
       Selecting a slide while OFF must NOT put lyrics on screen.
       The selected slide is only a cue. OUTPUT ON is responsible
       for actually displaying it.
    */
    if (!outputOn || !lyric) {
        return;
    }

    const lyricText =
        slide.text ??
        slide.lyric ??
        slide.content ??
        slide.textContent ??
        "";

    /* If this exact lyric is already visible, do nothing. */
    if (
        lyric.innerText === lyricText &&
        lyric.style.visibility !== "hidden" &&
        !lyric.classList.contains("fade-out")
    ) {
        return;
    }

    /* Cancel any previous transition. */
    if (lyricTransitionTimer !== null) {
        clearTimeout(lyricTransitionTimer);
        lyricTransitionTimer = null;
    }

    /* Fade the current lyric out first. */
    lyric.classList.add("fade-out");

    lyricTransitionTimer = setTimeout(function() {

        lyricTransitionTimer = null;

        /* Output may have been turned OFF during the fade. */
        if (!outputOn) {
            lyric.style.visibility = "hidden";
            return;
        }

        /* Make sure the selected song/slide is still the same. */
        if (
            currentSection !== sectionIndex ||
            currentSlide !== slideIndex
        ) {
            return;
        }

        lyric.innerText = lyricText;
        lyric.style.visibility = "visible";

        requestAnimationFrame(function() {
            lyric.classList.remove("fade-out");
        });

    }, transitionTime);
}

/* =========================================================
   UPDATE SELECTED SLIDE
========================================================= */

function updateSelectedSlide() {


    document
        .querySelectorAll(
            ".slide-grid button"
        )
        .forEach(
            function(button) {

                button.classList.remove(
                    "selected"
                );

            }
        );


    const selected =
        document.querySelector(
            `.slide-grid button[data-section="${currentSection}"][data-slide="${currentSlide}"]`
        );


    if (selected) {

        selected.classList.add(
            "selected"
        );

    }

}


/* =========================================================
   SHOW CURRENT SONG
========================================================= */

function showCurrentSong() {

    const song =
        songs[currentSong];


    if (!song) {

        return;

    }


    const titleDisplay =
        document.getElementById(
            "songTitleDisplay"
        );


    if (titleDisplay) {

        titleDisplay.innerText =
            "Song: " + song.title;

    }


    const songTitle =
        document.getElementById(
            "songTitle"
        );


    if (songTitle) {

        songTitle.value =
            song.title;

    }


    updateSongDropdownLabel();

}


/* =========================================================
   SHOW FIRST SLIDE
========================================================= */

function showFirstSlide() {

    const song =
        songs[currentSong];


    if (
        !song ||
        !song.sections ||
        song.sections.length === 0
    ) {

        const lyric =
            document.getElementById(
                "lyric"
            );


        if (lyric) {

            lyric.innerText =
                "NO SLIDES";

        }


        return;

    }


    currentSection = 0;

    currentSlide = 0;


    const section =
        song.sections[0];


    if (
        !section ||
        !section.slides ||
        section.slides.length === 0
    ) {

        return;

    }


    const slide =
        section.slides[0];


    const lyric =
        document.getElementById(
            "lyric"
        );


    if (lyric) {

        const lyricText =
            slide.text ??
            slide.lyric ??
            slide.content ??
            slide.textContent ??
            "";


        lyric.innerText =
            lyricText;

    }


    updateSelectedSlide();

}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderEverything() {

    renderSongLibrary();

    renderSections();

    renderEditor();

    showCurrentSong();

    showFirstSlide();

    updateOutputButtons();

}


/* =========================================================
   RENDER SONG LIBRARY
========================================================= */

function renderSongLibrary() {

    /*
       Replace the old native <select> with a custom dropdown once.
       This prevents Chrome's native white option menu from appearing
       and keeps the dropdown visually consistent with the rest of
       the dark control interface.
    */
    let library = document.getElementById("songLibrary");

    if (!library) {
        return;
    }

    if (library.tagName === "SELECT") {
        const customDropdown = document.createElement("div");
        customDropdown.id = "songLibrary";
        customDropdown.className = "song-dropdown";

        library.replaceWith(customDropdown);
        library = customDropdown;
    }

    library.classList.add("song-dropdown");

    /* Build the trigger only once. */
    let trigger = library.querySelector(".song-dropdown-trigger");
    let menu = library.querySelector("#songDropdownMenu");

    if (!trigger) {
        trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "song-dropdown-trigger";

        trigger.addEventListener("click", function(event) {
            toggleSongDropdown(event);
        });

        library.appendChild(trigger);
    }

    if (!menu) {
        menu = document.createElement("div");
        menu.id = "songDropdownMenu";
        menu.className = "song-dropdown-menu";
        library.appendChild(menu);
    }

    /* Keep the trigger text exactly synced with currentSong. */
    trigger.innerHTML = "";

    const label = document.createElement("span");
    label.id = "selectedSongName";
    label.className = "selected-song-name";
    label.textContent =
        songs[currentSong] ? songs[currentSong].title : "Select song";

    const arrow = document.createElement("span");
    arrow.className = "song-dropdown-arrow";
    arrow.textContent = "▾";

    trigger.appendChild(label);
    trigger.appendChild(arrow);

    /* Rebuild the menu from the actual song array. */
    menu.innerHTML = "";

    songs.forEach(function(song, index) {

        const button = document.createElement("button");
        button.type = "button";
        button.className = "song-dropdown-option";
        button.textContent = song.title;

        if (index === currentSong) {
            button.classList.add("song-selected");
        }

        button.addEventListener("click", function(event) {
            event.stopPropagation();
            selectSong(index);
            closeSongDropdown();
        });

        menu.appendChild(button);
    });

    injectSongDropdownStyles();
}


/* =========================================================
   CUSTOM SONG DROPDOWN STYLES
========================================================= */

function injectSongDropdownStyles() {

    if (document.getElementById("vpSongDropdownStyles")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "vpSongDropdownStyles";

    style.textContent = `
        .song-dropdown {
            position: relative;
            width: 100%;
            z-index: 50;
        }

        .song-dropdown-trigger {
            width: 100%;
            min-height: 48px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 0 14px;
            border: 1px solid rgba(255,255,255,.10);
            border-radius: 6px;
            background: #292a2c;
            color: #f1f1f1;
            font: inherit;
            font-size: 13px;
            font-weight: 600;
            text-align: left;
            cursor: pointer;
        }

        .song-dropdown-trigger:hover {
            background: #303133;
        }

        .selected-song-name {
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        .song-dropdown-arrow {
            flex: 0 0 auto;
            color: #8d9094;
            font-size: 12px;
        }

        .song-dropdown-menu {
            position: absolute;
            top: calc(100% + 5px);
            left: 0;
            right: 0;
            display: none;
            max-height: 280px;
            overflow-y: auto;
            padding: 5px;
            border: 1px solid rgba(255,255,255,.10);
            border-radius: 7px;
            background: #1b1c1e;
            box-shadow: 0 14px 32px rgba(0,0,0,.45);
            z-index: 100;
        }

        .song-dropdown-menu.open {
            display: block;
        }

        .song-dropdown-option {
            width: 100%;
            min-height: 40px;
            padding: 0 11px;
            border: 0;
            border-radius: 5px;
            background: transparent;
            color: #c8c9cb;
            font: inherit;
            font-size: 13px;
            font-weight: 500;
            text-align: left;
            cursor: pointer;
        }

        .song-dropdown-option:hover {
            background: #2b2c2e;
            color: #fff;
        }

        .song-dropdown-option.song-selected {
            background: #303133;
            color: #fff;
            font-weight: 700;
        }

        .song-dropdown-menu::-webkit-scrollbar {
            width: 6px;
        }

        .song-dropdown-menu::-webkit-scrollbar-track {
            background: transparent;
        }

        .song-dropdown-menu::-webkit-scrollbar-thumb {
            background: #444548;
            border-radius: 6px;
        }
    `;

    document.head.appendChild(style);
}



/* =========================================================
   SELECT SONG
========================================================= */

function selectSong(songIndex) {

    songIndex = Number(songIndex);

    if (
        isNaN(songIndex) ||
        songIndex < 0 ||
        songIndex >= songs.length
    ) {
        return;
    }

    /*
       Change current song.
       A song change always starts with the output OFF.
    */
    currentSong = songIndex;
    outputOn = false;

    // Cancel any pending lyric transition from the previous song.
    if (lyricTransitionTimer !== null) {
        clearTimeout(lyricTransitionTimer);
        lyricTransitionTimer = null;
    }

    updateOutputButtons();

    /*
       Reset to first section
       and first slide.
    */
    currentSection = 0;
    currentSlide = 0;

    /*
       Update CURRENT SONG title.
    */
    const title =
        document.getElementById("songTitleDisplay");

    if (title) {
        title.innerText =
            "Song: " +
            songs[currentSong].title;
    }

    /*
       Update EDIT title if it exists.
    */
    const titleInput =
        document.getElementById("songTitle");

    if (titleInput) {
        titleInput.value =
            songs[currentSong].title;
    }

    /*
       Refresh slides.
    */
    renderSections();

    /*
       Refresh song library selection.
    */
    renderSongLibrary();

    /*
       Keep the dropdown label synced with the selected song.
    */
    updateSongDropdownLabel();

    /*
       Clear output.
    */
    const output =
        document.getElementById("lyric");

    if (output) {
        output.classList.add("fade-out");
        output.style.visibility = "hidden";
        output.innerText = "";
    }
}


/* =========================================================
   UPDATE SONG DROPDOWN LABEL
========================================================= */

function updateSongDropdownLabel() {

    if (!songs || !songs[currentSong]) {
        return;
    }

    const title = songs[currentSong].title;

    /* Explicit label, if present. */
    const label =
        document.getElementById(
            "selectedSongName"
        );

    if (label) {
        label.textContent = title;
    }

    /*
       Also update the actual visible dropdown trigger.
       This covers the current custom dropdown even when
       the trigger does not contain #selectedSongName.
    */
    const dropdown =
        document.querySelector(
            ".song-dropdown"
        );

    if (!dropdown) {
        return;
    }

    const trigger =
        dropdown.querySelector(
            ".song-dropdown-trigger, .song-dropdown-button, button"
        );

    if (!trigger) {
        return;
    }

    const triggerLabel =
        trigger.querySelector(
            "#selectedSongName, .selected-song-name, .song-dropdown-label, .song-name"
        );

    if (triggerLabel) {
        triggerLabel.textContent = title;
        return;
    }

    /* Preserve an existing arrow/icon where possible. */
    const textNodes = Array.from(
        trigger.childNodes
    ).filter(
        node =>
            node.nodeType === Node.TEXT_NODE &&
            node.textContent.trim() !== ""
    );

    if (textNodes.length > 0) {
        textNodes[0].textContent = " " + title + " ";
    } else {
        /* Last resort: rebuild the trigger with the title. */
        trigger.textContent = title;
    }
}


/* =========================================================
   SYNC VISIBLE SONG DROPDOWN
========================================================= */

function syncVisibleSongDropdown() {

    if (!songs || songs.length === 0) {
        return;
    }

    updateSongDropdownLabel();

    const menu =
        document.getElementById(
            "songDropdownMenu"
        ) ||
        document.querySelector(
            ".song-dropdown-menu"
        );

    if (!menu) {
        return;
    }

    /* Rebuild the visible menu so stale static entries cannot
       remain highlighted after a song change. */
    menu.innerHTML = "";

    songs.forEach(
        function(song, index) {

            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";
            button.textContent = song.title;

            if (index === currentSong) {
                button.classList.add(
                    "song-selected"
                );
            }

            button.addEventListener(
                "click",
                function(event) {
                    event.stopPropagation();
                    selectSong(index);
                }
            );

            menu.appendChild(button);
        }
    );
}



/* =========================================================
   TOGGLE SONG DROPDOWN
========================================================= */

function toggleSongDropdown(event) {

    if (event) {

        event.stopPropagation();

    }


    const menu =
        document.getElementById(
            "songDropdownMenu"
        );


    if (!menu) {

        return;

    }


    menu.classList.toggle(
        "open"
    );

}


/* =========================================================
   CLOSE SONG DROPDOWN
========================================================= */

function closeSongDropdown() {

    const menu =
        document.getElementById(
            "songDropdownMenu"
        );


    if (menu) {

        menu.classList.remove(
            "open"
        );

    }

}


/* =========================================================
   CLICK OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    function(event) {


        /* Song dropdown */

        const dropdown =
            document.querySelector(
                ".song-dropdown"
            );


        if (
            dropdown &&
            !dropdown.contains(
                event.target
            )
        ) {

            closeSongDropdown();

        }


        /* Management popup */

        const popup =
            document.getElementById(
                "managementPopup"
            );


        const menuButton =
            document.querySelector(
                ".menu-button"
            );


        if (
            popup &&
            popup.classList.contains(
                "open"
            ) &&
            !popup.contains(
                event.target
            ) &&
            !(
                menuButton &&
                menuButton.contains(
                    event.target
                )
            )
        ) {

            closeManagementMenu();

        }

    }
);


/* =========================================================
   RENDER SECTIONS
========================================================= */

function renderSections() {

    const container =
        document.getElementById(
            "sections"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    const song =
        songs[currentSong];


    if (!song) {

        return;

    }


    song.sections.forEach(
        function(section, sectionIndex) {


            const sectionElement =
                document.createElement(
                    "div"
                );


            sectionElement.className =
                "section";


            /* -------------------------------------------------
               SECTION HEADER
            ------------------------------------------------- */

            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "section-header";


            const title =
                document.createElement(
                    "span"
                );


            title.className =
                "section-title";


            title.innerText =
                section.name;


            header.appendChild(
                title
            );


            sectionElement.appendChild(
                header
            );


            /* -------------------------------------------------
               SLIDE GRID
            ------------------------------------------------- */

            const grid =
                document.createElement(
                    "div"
                );


            grid.className =
                "slide-grid";


            /*
               If a section has a specific column
               count, use it.
            */

            if (
                section.columns
            ) {

                grid.style.gridTemplateColumns =
                    `repeat(${section.columns}, minmax(0, 1fr))`;

            }


            section.slides.forEach(
                function(slide, slideIndex) {


                    const button =
                        document.createElement(
                            "button"
                        );


                    button.type =
                        "button";


                    button.innerText =
                        slide.name;


                    button.dataset.section =
                        sectionIndex;


                    button.dataset.slide =
                        slideIndex;


                    if (
                        sectionIndex === currentSection &&
                        slideIndex === currentSlide
                    ) {

                        button.classList.add(
                            "selected"
                        );

                    }


                    button.onclick =
                        function() {

                            showLyric(
                                sectionIndex,
                                slideIndex
                            );

                        };


                    grid.appendChild(
                        button
                    );

                }
            );


            sectionElement.appendChild(
                grid
            );


            container.appendChild(
                sectionElement
            );

        }
    );

}


/* =========================================================
   OUTPUT ON
========================================================= */

function turnOutputOn() {

    const lyric = document.getElementById("lyric");

    outputOn = true;
    updateOutputButtons();

    if (!lyric) {
        return;
    }

    /*
       Cancel any pending slide transition. Otherwise a slide
       clicked while OFF can finish its old timeout after ON
       has already started, causing the lyric to flash twice.
    */
    if (lyricTransitionTimer !== null) {
        clearTimeout(lyricTransitionTimer);
        lyricTransitionTimer = null;
    }

    const song = songs[currentSong];
    const section = song && song.sections
        ? song.sections[currentSection]
        : null;
    const slide = section && section.slides
        ? section.slides[currentSlide]
        : null;

    const lyricText = slide
        ? (slide.text ?? slide.lyric ?? slide.content ?? slide.textContent ?? "")
        : "";

    /* Show the currently selected lyric exactly once. */
    lyric.innerText = lyricText;
    lyric.style.visibility = "visible";
    lyric.classList.add("fade-out");

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            lyric.classList.remove("fade-out");
        });
    });

    updateSelectedSlide();
}

/* =========================================================
   OUTPUT OFF
========================================================= */

function turnOutputOff() {

    // OFF must always leave the output hidden, even if the state
    // was already false because of a song change or page startup.
    outputOn = false;

    if (lyricTransitionTimer !== null) {
        clearTimeout(lyricTransitionTimer);
        lyricTransitionTimer = null;
    }

    updateOutputButtons();

    const lyric = document.getElementById("lyric");

    if (!lyric) {
        return;
    }

    // Fade the lyrics out
    lyric.classList.add("fade-out");

    // Hide immediately. The opacity fade can still complete visually,
    // but OFF can never leave readable lyrics on screen.
    lyric.style.visibility = "hidden";
}


/* =========================================================
   UPDATE OUTPUT BUTTONS
========================================================= */

function updateOutputButtons() {

    const onButton =
        document.getElementById(
            "outputOnButton"
        );


    const offButton =
        document.getElementById(
            "outputOffButton"
        );


    if (onButton) {

        onButton.classList.toggle(
            "active",
            outputOn
        );

    }


    if (offButton) {

        offButton.classList.toggle(
            "active",
            !outputOn
        );

    }

}


/* =========================================================
   TAB SWITCHING
========================================================= */

function switchTab(tabName) {


    document
        .querySelectorAll(
            ".tab-content"
        )
        .forEach(
            function(content) {

                content.classList.remove(
                    "active"
                );

            }
        );


    document
        .querySelectorAll(
            ".tab-button"
        )
        .forEach(
            function(button) {

                button.classList.remove(
                    "active"
                );

            }
        );


    if (
        tabName === "songs"
    ) {

        document
            .getElementById(
                "songsTab"
            )
            .classList.add(
                "active"
            );


        document
            .getElementById(
                "songsTabButton"
            )
            .classList.add(
                "active"
            );

    }


    if (
        tabName === "import"
    ) {

        document
            .getElementById(
                "importTab"
            )
            .classList.add(
                "active"
            );


        document
            .getElementById(
                "importTabButton"
            )
            .classList.add(
                "active"
            );

    }


    if (
        tabName === "edit"
    ) {

        document
            .getElementById(
                "editTab"
            )
            .classList.add(
                "active"
            );


        document
            .getElementById(
                "editTabButton"
            )
            .classList.add(
                "active"
            );


        renderEditor();

    }

}


/* =========================================================
   MANAGEMENT POPUP
========================================================= */

function toggleManagementMenu(event) {

    if (event) {

        event.stopPropagation();

    }


    const popup =
        document.getElementById(
            "managementPopup"
        );


    if (!popup) {

        return;

    }


    popup.classList.toggle(
        "open"
    );

}


function closeManagementMenu() {

    const popup =
        document.getElementById(
            "managementPopup"
        );


    if (popup) {

        popup.classList.remove(
            "open"
        );

    }

}


/* =========================================================
   ADD SONG
========================================================= */

function addSong() {
    // Prevent duplicate add-song dialogs
    if (document.getElementById("addSongModal")) {
        return;
    }

    // Create modal
    const modal = document.createElement("div");
    modal.id = "addSongModal";
    modal.className = "add-song-modal";

    modal.innerHTML = `
        <div class="add-song-dialog">
            <div class="add-song-title">
                ADD SONG
            </div>

            <div class="add-song-label">
                Enter the new song title
            </div>

            <input
                type="text"
                id="newSongTitleInput"
                class="add-song-input"
                placeholder="Song title"
                autocomplete="off"
            >

            <div class="add-song-buttons">
                <button
                    type="button"
                    id="cancelAddSongButton"
                    class="add-song-cancel"
                >
                    CANCEL
                </button>

                <button
                    type="button"
                    id="confirmAddSongButton"
                    class="add-song-confirm"
                >
                    ADD SONG
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const input =
        document.getElementById("newSongTitleInput");

    const cancelButton =
        document.getElementById("cancelAddSongButton");

    const confirmButton =
        document.getElementById("confirmAddSongButton");

    function closeAddSongModal() {
        modal.remove();
    }

    function confirmAddSong() {
        const title = input.value.trim();

        if (!title) {
            input.focus();
            return;
        }

        songs.push({
            title: title,

            sections: [
                {
                    name: "Verse 1",
                    columns: 4,

                    slides: [
                        {
                            name: "V1A",
                            text: ""
                        },
                        {
                            name: "V1B",
                            text: ""
                        },
                        {
                            name: "V1C",
                            text: ""
                        },
                        {
                            name: "V1D",
                            text: ""
                        }
                    ]
                }
            ]
        });

        currentSong = songs.length - 1;
        currentSection = 0;
        currentSlide = 0;

        // New songs start with output OFF
        outputOn = false;

        saveLibrary();
        renderEverything();

        closeAddSongModal();
    }

    cancelButton.onclick =
        closeAddSongModal;

    confirmButton.onclick =
        confirmAddSong;

    input.addEventListener(
        "keydown",
        function(event) {
            if (event.key === "Enter") {
                confirmAddSong();
            }

            if (event.key === "Escape") {
                closeAddSongModal();
            }
        }
    );

    // Focus input immediately
    setTimeout(function() {
        input.focus();
    }, 50);
}

/* =========================================================
   DELETE SONG
========================================================= */

function deleteSong() {

    if (
        songs.length <= 1
    ) {

        alert(
            "You must keep at least one song."
        );

        return;

    }


    const song =
        songs[currentSong];


    if (!song) {

        return;

    }


    const confirmed =
        confirm(
            `Delete "${song.title}"?`
        );


    if (!confirmed) {

        return;

    }


    songs.splice(
        currentSong,
        1
    );


    if (
        currentSong >= songs.length
    ) {

        currentSong =
            songs.length - 1;

    }


    currentSection = 0;

    currentSlide = 0;


    saveLibrary();

    renderEverything();

}


/* =========================================================
   MANUAL SAVE
========================================================= */

function manualSaveLibrary() {

    saveLibrary();


    alert(
        "Song library saved."
    );

}


/* =========================================================
   RESET LIBRARY
========================================================= */

function resetLibrary() {

    const confirmed =
        confirm(
            "Reset the entire song library to the default songs?"
        );


    if (!confirmed) {

        return;

    }


    songs =
        JSON.parse(
            JSON.stringify(
                defaultSongs
            )
        );


    currentSong = 0;

    currentSection = 0;

    currentSlide = 0;


    saveLibrary();

    renderEverything();

}


/* =========================================================
   RENDER EDITOR — COMPACT SONG STRUCTURE
========================================================= */

let collapsedParts = new Set();
let expandedLyrics = new Set();
let draggedPartIndex = null;
let draggedLyric = null;

function ensureEditorStyles() {
    if (document.getElementById("compact-edit-style")) return;

    const style = document.createElement("style");
    style.id = "compact-edit-style";
    style.innerText = `
        #sectionEditor .edit-part-card {
            margin-bottom: 10px;
            scroll-margin-top: 18px;
        }

        #sectionEditor .part-compact-header {
            display: flex;
            align-items: center;
            gap: 10px;
            min-height: 54px;
            padding: 8px 12px;
            cursor: default;
            user-select: none;
        }

        #sectionEditor .part-drag-handle,
        #sectionEditor .lyric-drag-handle {
            flex: 0 0 auto;
            width: 28px;
            text-align: center;
            font-size: 18px;
            line-height: 1;
            opacity: .55;
            cursor: grab;
        }

        #sectionEditor .part-drag-handle:active,
        #sectionEditor .lyric-drag-handle:active {
            cursor: grabbing;
        }

        #sectionEditor .part-toggle,
        #sectionEditor .lyric-toggle {
            flex: 0 0 auto;
            width: 30px;
            height: 30px;
            padding: 0;
            cursor: pointer;
        }

        #sectionEditor .part-compact-title {
            flex: 1;
            font-weight: 700;
            font-size: 16px;
        }

        #sectionEditor .part-compact-meta,
        #sectionEditor .lyric-preview {
            opacity: .58;
            font-size: 12px;
        }

        #sectionEditor .part-collapsible-body {
            padding: 0 12px 12px;
        }

        #sectionEditor .part-collapsible-body.part-collapsed-body {
            display: none;
        }

        #sectionEditor .compact-lyrics-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin: 8px 0 12px;
        }

        #sectionEditor .compact-lyric-row {
            display: flex;
            align-items: center;
            gap: 8px;
            min-height: 44px;
            padding: 6px 9px;
            border: 1px solid rgba(255,255,255,.10);
            border-radius: 7px;
            background: rgba(255,255,255,.025);
        }

        #sectionEditor .compact-lyric-row.dragging,
        #sectionEditor .edit-part-card.dragging {
            opacity: .4;
        }

        #sectionEditor .compact-lyric-row.drag-over,
        #sectionEditor .edit-part-card.part-drag-over {
            outline: 2px dashed currentColor;
            outline-offset: 2px;
        }

        #sectionEditor .lyric-code {
            flex: 0 0 48px;
            font-weight: 700;
            font-size: 12px;
            opacity: .7;
        }

        #sectionEditor .lyric-preview {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        #sectionEditor .lyric-edit-body {
            display: none;
            padding: 8px 0 4px 38px;
        }

        #sectionEditor .compact-lyric-row.lyric-expanded {
            display: block;
        }

        #sectionEditor .compact-lyric-row.lyric-expanded .lyric-row-top {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        #sectionEditor .compact-lyric-row.lyric-expanded .lyric-edit-body {
            display: block;
        }
    `;
    document.head.appendChild(style);
}

function renderEditor() {
    const editor = document.getElementById("sectionEditor");
    if (!editor) return;

    const song = songs[currentSong];
    if (!song) return;

    ensureEditorStyles();

    // New songs/parts start collapsed so the entire arrangement stays compact.
    if (!window._compactPartsInitialised) {
        collapsedParts = new Set(song.sections.map((_, index) => index));
        expandedLyrics = new Set();
        window._compactPartsInitialised = true;
    }

    // Remove indexes that no longer exist.
    collapsedParts = new Set(
        [...collapsedParts].filter(index => index >= 0 && index < song.sections.length)
    );

    editor.innerHTML = "";

    song.sections.forEach(function(section, sectionIndex) {
        const sectionEditor = document.createElement("div");
        sectionEditor.className = "section-editor edit-part-card";
        sectionEditor.id = `edit-part-${sectionIndex}`;
        sectionEditor.dataset.partIndex = sectionIndex;

        const isCollapsed = collapsedParts.has(sectionIndex);

        /* ---------------------------------------------------------
           COMPACT PART ROW
        --------------------------------------------------------- */
        const compactHeader = document.createElement("div");
        compactHeader.className = "part-compact-header";

        const partHandle = document.createElement("span");
        partHandle.className = "part-drag-handle";
        partHandle.innerText = "⋮⋮";
        partHandle.title = "Drag to reorder part";
        partHandle.draggable = true;

        partHandle.addEventListener("dragstart", function(event) {
            draggedPartIndex = sectionIndex;
            sectionEditor.classList.add("dragging");
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", `part:${sectionIndex}`);
        });

        partHandle.addEventListener("dragend", function() {
            draggedPartIndex = null;
            sectionEditor.classList.remove("dragging");
            document.querySelectorAll(".part-drag-over").forEach(el => el.classList.remove("part-drag-over"));
        });

        compactHeader.appendChild(partHandle);

        const partToggle = document.createElement("button");
        partToggle.type = "button";
        partToggle.className = "part-toggle";
        partToggle.innerText = isCollapsed ? "▶" : "▼";
        partToggle.title = isCollapsed ? "Expand part" : "Collapse part";
        partToggle.onclick = function() {
            if (collapsedParts.has(sectionIndex)) collapsedParts.delete(sectionIndex);
            else collapsedParts.add(sectionIndex);
            renderEditor();
        };
        compactHeader.appendChild(partToggle);

        const partTitle = document.createElement("span");
        partTitle.className = "part-compact-title";
        partTitle.innerText = section.name || "Untitled";
        compactHeader.appendChild(partTitle);

        sectionEditor.appendChild(compactHeader);

        /* Part is always a drop target, even when collapsed. */
        sectionEditor.addEventListener("dragover", function(event) {
            if (draggedPartIndex !== null && draggedPartIndex !== sectionIndex) {
                event.preventDefault();
                sectionEditor.classList.add("part-drag-over");
            }
        });

        sectionEditor.addEventListener("dragleave", function(event) {
            if (!sectionEditor.contains(event.relatedTarget)) {
                sectionEditor.classList.remove("part-drag-over");
            }
        });

        sectionEditor.addEventListener("drop", function(event) {
            if (draggedPartIndex === null || draggedPartIndex === sectionIndex) return;
            event.preventDefault();
            sectionEditor.classList.remove("part-drag-over");
            movePart(draggedPartIndex, sectionIndex);
        });

        /* ---------------------------------------------------------
           PART EDITING BODY
        --------------------------------------------------------- */
        const body = document.createElement("div");
        body.className = "part-collapsible-body";
        if (isCollapsed) body.classList.add("part-collapsed-body");

        const nameLabel = document.createElement("label");
        nameLabel.innerText = "PART NAME";
        body.appendChild(nameLabel);

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = section.name || "";
        nameInput.oninput = function() {
            section.name = this.value;
            partTitle.innerText = this.value || "Untitled";
            saveLibrary();
            renderSections();
        };
        body.appendChild(nameInput);

        const columnsLabel = document.createElement("label");
        columnsLabel.innerText = "COLUMNS";
        body.appendChild(columnsLabel);

        const columnsInput = document.createElement("input");
        columnsInput.type = "number";
        columnsInput.min = "1";
        columnsInput.max = "12";
        columnsInput.value = section.columns || 4;
        columnsInput.onchange = function() {
            section.columns = parseInt(this.value) || 4;
            saveLibrary();
            renderSections();
        };
        body.appendChild(columnsInput);

        /* ---------------------------------------------------------
           COMPACT LYRIC LIST — lyrics can be dragged directly here.
        --------------------------------------------------------- */
        const lyricsList = document.createElement("div");
        lyricsList.className = "compact-lyrics-list";

        section.slides.forEach(function(slide, slideIndex) {
            const lyricKey = `${sectionIndex}:${slideIndex}`;
            const isLyricExpanded = expandedLyrics.has(lyricKey);

            const lyricRow = document.createElement("div");
            lyricRow.className = "compact-lyric-row";
            if (isLyricExpanded) lyricRow.classList.add("lyric-expanded");

            const lyricRowTop = document.createElement("div");
            lyricRowTop.className = "lyric-row-top";

            const lyricHandle = document.createElement("span");
            lyricHandle.className = "lyric-drag-handle";
            lyricHandle.innerText = "⋮⋮";
            lyricHandle.title = "Drag to reorder lyric";
            lyricHandle.draggable = true;

            lyricHandle.addEventListener("dragstart", function(event) {
                draggedLyric = { sectionIndex, slideIndex };
                lyricRow.classList.add("dragging");
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", `lyric:${sectionIndex}:${slideIndex}`);
            });

            lyricHandle.addEventListener("dragend", function() {
                draggedLyric = null;
                lyricRow.classList.remove("dragging");
                document.querySelectorAll(".compact-lyric-row.drag-over").forEach(el => el.classList.remove("drag-over"));
            });

            lyricRowTop.appendChild(lyricHandle);

            const lyricToggle = document.createElement("button");
            lyricToggle.type = "button";
            lyricToggle.className = "lyric-toggle";
            lyricToggle.innerText = isLyricExpanded ? "▼" : "▶";
            lyricToggle.title = isLyricExpanded ? "Collapse lyric" : "Edit lyric";
            lyricToggle.onclick = function() {
                if (expandedLyrics.has(lyricKey)) expandedLyrics.delete(lyricKey);
                else expandedLyrics.add(lyricKey);
                renderEditor();
            };
            lyricRowTop.appendChild(lyricToggle);

            const lyricCode = document.createElement("span");
            lyricCode.className = "lyric-code";
            lyricCode.innerText = slide.name || "";
            lyricRowTop.appendChild(lyricCode);

            const lyricPreview = document.createElement("span");
            lyricPreview.className = "lyric-preview";
            const lyricText = slide.text ?? slide.lyric ?? slide.content ?? "";
            lyricPreview.innerText = lyricText || "(empty lyric)";
            lyricRowTop.appendChild(lyricPreview);

            lyricRow.appendChild(lyricRowTop);

            /* Lyric is a drop target only for lyrics in this same part. */
            lyricRow.addEventListener("dragover", function(event) {
                if (
                    draggedLyric &&
                    draggedLyric.sectionIndex === sectionIndex &&
                    draggedLyric.slideIndex !== slideIndex
                ) {
                    event.preventDefault();
                    lyricRow.classList.add("drag-over");
                }
            });

            lyricRow.addEventListener("dragleave", function(event) {
                if (!lyricRow.contains(event.relatedTarget)) {
                    lyricRow.classList.remove("drag-over");
                }
            });

            lyricRow.addEventListener("drop", function(event) {
                if (
                    !draggedLyric ||
                    draggedLyric.sectionIndex !== sectionIndex ||
                    draggedLyric.slideIndex === slideIndex
                ) return;

                event.preventDefault();
                lyricRow.classList.remove("drag-over");
                moveLyric(sectionIndex, draggedLyric.slideIndex, slideIndex);
            });

            const editBody = document.createElement("div");
            editBody.className = "lyric-edit-body";

            const lyricNameLabel = document.createElement("label");
            lyricNameLabel.innerText = "LYRIC NAME";
            editBody.appendChild(lyricNameLabel);

            const lyricNameInput = document.createElement("input");
            lyricNameInput.type = "text";
            lyricNameInput.value = slide.name || "";
            lyricNameInput.oninput = function() {
                slide.name = this.value;
                lyricCode.innerText = this.value;
                saveLibrary();
                renderSections();
            };
            editBody.appendChild(lyricNameInput);

            const lyricLabel = document.createElement("label");
            lyricLabel.innerText = "LYRIC";
            editBody.appendChild(lyricLabel);

            const lyricInput = document.createElement("textarea");
            lyricInput.value = lyricText;
            lyricInput.oninput = function() {
                slide.text = this.value;
                lyricPreview.innerText = this.value || "(empty lyric)";
                saveLibrary();

                if (currentSection === sectionIndex && currentSlide === slideIndex) {
                    const output = document.getElementById("lyric");
                    if (output) output.innerText = this.value;
                }
            };
            editBody.appendChild(lyricInput);

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.innerText = "DELETE LYRIC";
            deleteButton.onclick = function() {
                deleteSlide(sectionIndex, slideIndex);
            };
            editBody.appendChild(deleteButton);

            lyricRow.appendChild(editBody);
            lyricsList.appendChild(lyricRow);
        });

        body.appendChild(lyricsList);

        const actions = document.createElement("div");
        actions.className = "part-actions-row";

        const addLyricButton = document.createElement("button");
        addLyricButton.type = "button";
        addLyricButton.innerText = "+ ADD LYRIC";
        addLyricButton.onclick = function() {
            addSlide(sectionIndex);
        };
        actions.appendChild(addLyricButton);

        const deletePartButton = document.createElement("button");
        deletePartButton.type = "button";
        deletePartButton.innerText = "DELETE PART";
        deletePartButton.onclick = function() {
            deleteSection(sectionIndex);
        };
        actions.appendChild(deletePartButton);

        body.appendChild(actions);
        sectionEditor.appendChild(body);
        editor.appendChild(sectionEditor);
    });
}

/* =========================================================
   REORDER PARTS
========================================================= */

function movePart(fromIndex, toIndex) {
    const song = songs[currentSong];
    if (!song || !song.sections) return;
    if (fromIndex < 0 || fromIndex >= song.sections.length) return;
    if (toIndex < 0 || toIndex >= song.sections.length) return;
    if (fromIndex === toIndex) return;

    const movedPart = song.sections.splice(fromIndex, 1)[0];
    song.sections.splice(toIndex, 0, movedPart);

    if (currentSection === fromIndex) {
        currentSection = toIndex;
    } else if (fromIndex < currentSection && toIndex >= currentSection) {
        currentSection--;
    } else if (fromIndex > currentSection && toIndex <= currentSection) {
        currentSection++;
    }

    saveLibrary();
    renderSections();
    renderEditor();
}

/* =========================================================
   REORDER LYRICS WITHIN A PART
========================================================= */

function moveLyric(sectionIndex, fromIndex, toIndex) {
    const song = songs[currentSong];
    const section = song && song.sections ? song.sections[sectionIndex] : null;
    if (!section || !section.slides) return;
    if (fromIndex < 0 || fromIndex >= section.slides.length) return;
    if (toIndex < 0 || toIndex >= section.slides.length) return;
    if (fromIndex === toIndex) return;

    const movedLyric = section.slides.splice(fromIndex, 1)[0];
    section.slides.splice(toIndex, 0, movedLyric);

    // Keep V1A/V1B/V1C... in the correct order after rearranging lyrics.
    renumberSlides(section);

    if (currentSection === sectionIndex) {
        if (currentSlide === fromIndex) {
            currentSlide = toIndex;
        } else if (fromIndex < currentSlide && toIndex >= currentSlide) {
            currentSlide--;
        } else if (fromIndex > currentSlide && toIndex <= currentSlide) {
            currentSlide++;
        }
    }

    saveLibrary();
    renderSections();
    renderEditor();

    const current = songs[currentSong].sections[currentSection];
    const currentData = current && current.slides ? current.slides[currentSlide] : null;
    const output = document.getElementById("lyric");
    if (output && currentData) {
        output.innerText = currentData.text ?? "";
    }
    updateSelectedSlide();
}

/* =========================================================
   SLIDE CODE RENUMBERING
========================================================= */

function getSlidePrefix(section) {
    if (section.code) return section.code;

    if (section.slides && section.slides.length > 0) {
        const firstName = section.slides[0].name || "";
        const match = firstName.match(/^(.+?)[A-Z]$/);
        if (match) return match[1];
    }

    return section.name || "S";
}

function renumberSlides(section) {
    const prefix = getSlidePrefix(section);
    section.slides.forEach(function(slide, index) {
        slide.name = prefix + String.fromCharCode(65 + index);
    });
}

/* =========================================================
   ADD SECTION
========================================================= */

function addSection() {

    const song =
        songs[currentSong];


    if (!song) {

        return;

    }


    const sectionNumber =
        song.sections.length + 1;


    song.sections.push({

        name:
            `Section ${sectionNumber}`,

        columns:
            4,

        slides: [

            {
                name:
                    `Section ${sectionNumber}A`,

                text:
                    ""
            },

            {
                name:
                    `Section ${sectionNumber}B`,

                text:
                    ""
            },

            {
                name:
                    `Section ${sectionNumber}C`,

                text:
                    ""
            },

            {
                name:
                    `Section ${sectionNumber}D`,

                text:
                    ""
            }

        ]

    });


    saveLibrary();

    renderSections();

    renderEditor();

}


/* =========================================================
   DELETE SECTION
========================================================= */

function deleteSection(
    sectionIndex
) {

    const song =
        songs[currentSong];


    if (!song) {

        return;

    }


    if (
        song.sections.length <= 1
    ) {

        alert(
            "You must keep at least one section."
        );

        return;

    }


    const confirmed =
        confirm(
            `Delete section "${song.sections[sectionIndex].name}"?`
        );


    if (!confirmed) {

        return;

    }


    song.sections.splice(
        sectionIndex,
        1
    );


    currentSection = 0;

    currentSlide = 0;


    saveLibrary();

    renderSections();

    renderEditor();

    showFirstSlide();

}


/* =========================================================
   ADD SLIDE
========================================================= */

function addSlide(
    sectionIndex
) {

    const section =
        songs[currentSong]
            .sections[sectionIndex];


    if (!section) {

        return;

    }


    const nextLetter =
        String.fromCharCode(
            65 + section.slides.length
        );


    section.slides.push({

        name:
            `${section.name}${nextLetter}`,

        text:
            ""

    });


    saveLibrary();

    renderSections();

    renderEditor();

}


/* =========================================================
   DELETE SLIDE
========================================================= */

function deleteSlide(
    sectionIndex,
    slideIndex
) {

    const section =
        songs[currentSong]
            .sections[sectionIndex];


    if (!section) {

        return;

    }


    if (
        section.slides.length <= 1
    ) {

        alert(
            "You must keep at least one slide."
        );

        return;

    }


    const confirmed =
        confirm(
            `Delete slide "${section.slides[slideIndex].name}"?`
        );


    if (!confirmed) {

        return;

    }


    section.slides.splice(
        slideIndex,
        1
    );


    if (
        currentSection === sectionIndex
    ) {

        if (
            currentSlide >=
            section.slides.length
        ) {

            currentSlide =
                section.slides.length - 1;

        }

    }


    saveLibrary();

    renderSections();

    renderEditor();


    /*
       Directly display the current slide.
       This avoids an unnecessary transition after
       editing/deleting slides.
    */

    const song =
        songs[currentSong];


    const currentSectionData =
        song.sections[currentSection];


    if (
        currentSectionData &&
        currentSectionData.slides[currentSlide]
    ) {

        const currentSlideData =
            currentSectionData
                .slides[currentSlide];


        const lyric =
            document.getElementById(
                "lyric"
            );


        if (lyric) {

            lyric.innerText =
                currentSlideData.text ??
                "";

        }

    }


    updateSelectedSlide();

}


/* =========================================================
   SAVE SONG
========================================================= */

function saveSong() {

    const titleInput =
        document.getElementById(
            "songTitle"
        );


    if (
        !titleInput ||
        !songs[currentSong]
    ) {

        return;

    }


    const newTitle =
        titleInput.value.trim();


    if (
        newTitle === ""
    ) {

        alert(
            "Please enter a song title."
        );

        return;

    }


    songs[currentSong].title =
        newTitle;


    saveLibrary();

    renderSongLibrary();

    showCurrentSong();


    alert(
        "Song saved."
    );

}


/* =========================================================
   IMPORT LYRICS
========================================================= */

function importLyrics() {

    const input =
        document.getElementById(
            "lyricsInput"
        );


    if (!input) {

        return;

    }


    const text =
        input.value.trim();


    if (!text) {

        alert(
            "Please paste some lyrics first."
        );

        return;

    }


    const sections =
        parseLyrics(text);


    if (
        sections.length === 0
    ) {

        alert(
            "No lyrics could be imported."
        );

        return;

    }


    songs[currentSong].sections =
        sections;


    currentSection = 0;

    currentSlide = 0;


    saveLibrary();

    renderSections();

    renderEditor();

    showFirstSlide();


    alert(
        "Lyrics imported."
    );

}


/* =========================================================
   PARSE LYRICS
========================================================= */

/*
   IMPORTANT:

   This parser only treats a line as a section when the
   ENTIRE line matches a recognised section heading.

   Therefore:

       Chorus
       Chorus 1
       C
       C1

   can be section headings.

   But:

       Captive to Christ I know true freedom

   will remain a lyric.

   This fixes the problem from your screenshot.
*/

function parseLyrics(text) {

    const lines =
        text
            .split(/\r?\n/)
            .map(line => line.trim());

    const sections = [];

    let currentSectionData = null;

    /* =====================================================
       CREATE SECTION
    ===================================================== */

    function createSection(
        displayName,
        code
    ) {

        currentSectionData = {

            name: displayName,

            code: code,

            columns: 4,

            slides: []

        };

        sections.push(
            currentSectionData
        );

    }


    /* =====================================================
       PROCESS LINES
    ===================================================== */

    lines.forEach(line => {

        if (!line) {
            return;
        }


        /*
         * Clean possible formatting from headings.
         */

        const cleanedLine =
            line
                .replace(/^[\[\(\{]/, "")
                .replace(/[\]\)\}:]+$/, "")
                .trim();


        const normalized =
            cleanedLine
                .toLowerCase()
                .trim();


        let sectionName = null;

        let sectionCode = null;


        /* =================================================
           VERSE
        ================================================= */

        let verseMatch =
            normalized.match(
                /^(verse|v)\s*(\d+)?$/i
            );


        if (verseMatch) {

            const number =
                verseMatch[2] || "1";


            sectionName =
                cleanedLine;


            sectionCode =
                `V${number}`;

        }


        /* =================================================
           CHORUS
        ================================================= */

        else {

            let chorusMatch =
                normalized.match(
                    /^(chorus|c)\s*(\d+)?$/i
                );


            if (chorusMatch) {

                const number =
                    chorusMatch[2] || "1";


                sectionName =
                    cleanedLine;


                sectionCode =
                    `C${number}`;

            }

        }


        /* =================================================
           BRIDGE
        ================================================= */

        if (!sectionCode) {

            let bridgeMatch =
                normalized.match(
                    /^(bridge|b)\s*(\d+)?$/i
                );


            if (bridgeMatch) {

                const number =
                    bridgeMatch[2] || "1";


                sectionName =
                    cleanedLine;


                sectionCode =
                    `B${number}`;

            }

        }


        /* =================================================
           PRE-CHORUS
        ================================================= */

        if (!sectionCode) {

            let preChorusMatch =
                normalized.match(
                    /^pre[\s-]?chorus\s*(\d+)?$/i
                );


            if (preChorusMatch) {

                const number =
                    preChorusMatch[1] || "1";


                sectionName =
                    cleanedLine;


                sectionCode =
                    `PC${number}`;

            }

        }


        /* =================================================
           INTRO
        ================================================= */

        if (!sectionCode) {

            let introMatch =
                normalized.match(
                    /^intro\s*(\d+)?$/i
                );


            if (introMatch) {

                const number =
                    introMatch[1] || "1";


                sectionName =
                    cleanedLine;


                sectionCode =
                    `I${number}`;

            }

        }


        /* =================================================
           OUTRO
        ================================================= */

        if (!sectionCode) {

            let outroMatch =
                normalized.match(
                    /^outro\s*(\d+)?$/i
                );


            if (outroMatch) {

                const number =
                    outroMatch[1] || "1";


                sectionName =
                    cleanedLine;


                sectionCode =
                    `O${number}`;

            }

        }


        /* =================================================
           TAG
        ================================================= */

        if (!sectionCode) {

            let tagMatch =
                normalized.match(
                    /^tag\s*(\d+)?$/i
                );


            if (tagMatch) {

                const number =
                    tagMatch[1] || "1";


                sectionName =
                    cleanedLine;


                sectionCode =
                    `T${number}`;

            }

        }


        /* =================================================
           NEW SECTION
        ================================================= */

        if (sectionCode) {

            createSection(
                sectionName,
                sectionCode
            );

            return;

        }


        /* =================================================
           IF NO SECTION EXISTS
        ================================================= */

        if (!currentSectionData) {

            createSection(
                "Verse 1",
                "V1"
            );

        }


        /* =================================================
           CREATE SLIDE
        ================================================= */

        const slideNumber =
            currentSectionData
                .slides.length;


        const letter =
            String.fromCharCode(
                65 + slideNumber
            );


        /*
         * Use the short section code
         * for the slide button.
         *
         * Example:
         *
         * V1 + A = V1A
         * V1 + B = V1B
         * C1 + A = C1A
         */

        currentSectionData
            .slides
            .push({

                name:
                    `${currentSectionData.code}${letter}`,

                text:
                    line

            });

    });


    return sections;

}

/* =========================================================
   IMPORT GUIDE / INFO POPUP
========================================================= */

function addImportInfoButton() {

    /* Find the existing Import Lyrics button without
       requiring a specific HTML id. */
    let importButton =
        document.querySelector('[onclick*="importLyrics"]');

    if (!importButton) {
        const buttons =
            Array.from(document.querySelectorAll("button"));

        importButton =
            buttons.find(function(button) {
                return button.textContent
                    .trim()
                    .toLowerCase()
                    .includes("import lyrics");
            });
    }

    if (!importButton) {
        return;
    }

    /* Prevent duplicate buttons if the UI is re-rendered. */
    if (document.getElementById("importInfoButton")) {
        return;
    }

    const infoButton =
        document.createElement("button");

    infoButton.type = "button";
    infoButton.id = "importInfoButton";
    infoButton.title = "How to import a song";
    infoButton.setAttribute("aria-label", "How to import a song");
    infoButton.textContent = "i";

    Object.assign(infoButton.style, {
        width: "30px",
        height: "30px",
        minWidth: "30px",
        padding: "0",
        marginLeft: "8px",
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.18)",
        background: "#202020",
        color: "#bfc4cc",
        fontSize: "15px",
        fontWeight: "700",
        fontFamily: "Arial, sans-serif",
        lineHeight: "28px",
        textAlign: "center",
        cursor: "pointer",
        verticalAlign: "middle",
        boxSizing: "border-box"
    });

    infoButton.addEventListener("mouseenter", function() {
        infoButton.style.color = "#ffffff";
        infoButton.style.borderColor = "rgba(255,255,255,0.35)";
    });

    infoButton.addEventListener("mouseleave", function() {
        infoButton.style.color = "#bfc4cc";
        infoButton.style.borderColor = "rgba(255,255,255,0.18)";
    });

    /* Put the info icon at the top of the Import panel, beside
       the "IMPORT LYRICS" heading, rather than underneath the
       large Import Lyrics button. */
    const importHeadings =
        Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6, div, span"));

    const importHeading =
        importHeadings.find(function(element) {
            return element.textContent.trim().toUpperCase() === "IMPORT LYRICS";
        });

    if (importHeading) {
        Object.assign(infoButton.style, {
            display: "inline-flex",
            marginLeft: "8px",
            verticalAlign: "middle",
            alignItems: "center",
            justifyContent: "center"
        });

        /* Keep the icon directly at the end of the "IMPORT LYRICS"
           heading so it stays on the same line and sits beside the
           words rather than becoming a separate block. */
        Object.assign(importHeading.style, {
            display: "inline-flex",
            alignItems: "center",
            gap: "8px"
        });

        importHeading.appendChild(infoButton);
    } else {
        /* Fallback: keep it beside the button if the heading cannot
           be found in a particular version of the HTML. */
        importButton.insertAdjacentElement("afterend", infoButton);
    }

    infoButton.addEventListener("click", showImportGuidePopup);
}


function showImportGuidePopup() {

    let overlay =
        document.getElementById("importGuidePopup");

    if (!overlay) {

        overlay = document.createElement("div");
        overlay.id = "importGuidePopup";

        overlay.innerHTML = `
            <div class="import-guide-modal" role="dialog" aria-modal="true" aria-labelledby="importGuideTitle">
                <div class="import-guide-header">
                    <div>
                        <div class="import-guide-kicker">IMPORT LYRICS</div>
                        <h2 id="importGuideTitle">How to import a song</h2>
                    </div>
                    <button type="button" class="import-guide-close" aria-label="Close">×</button>
                </div>

                <div class="import-guide-body">
                    <div class="import-guide-step">
                        <div class="import-guide-number">1</div>
                        <div>
                            <strong>Create a song first</strong>
                            <p>Open the <b>⚙</b> menu, choose <b>+ ADD SONG</b>, and enter the song title. Your new song will then be selected.</p>
                        </div>
                    </div>

                    <div class="import-guide-step">
                        <div class="import-guide-number">2</div>
                        <div>
                            <strong>Go to IMPORT</strong>
                            <p>Make sure the song you want to fill is the current song before importing the lyrics.</p>
                        </div>
                    </div>

                    <div class="import-guide-step">
                        <div class="import-guide-number">3</div>
                        <div>
                            <strong>Paste your lyrics</strong>
                            <p>Copy your lyrics from your source and paste them into the import box. Keep each lyric line on its own line.</p>
                        </div>
                    </div>

                    <div class="import-guide-step">
                        <div class="import-guide-number">4</div>
                        <div>
                            <strong>Add section headings</strong>
                            <p>Put section names on their own line. For example: <code>Verse 1</code>, <code>Chorus</code>, <code>Bridge 1</code>, <code>Pre-Chorus</code>, <code>Intro</code>, <code>Outro</code>, or <code>Tag</code>.</p>
                        </div>
                    </div>

                    <div class="import-guide-example">
                        <div class="import-guide-example-title">Example</div>
                        <pre>Verse 1
Everything changed It's getting harder to recognize
The person I was Before I encountered Christ
I don't walk like I used to I don't talk like I used to
I've been washed from the inside I've been washed from the inside out

Chorus
Hallelujah, hallelujah
I know it was the blood Could've only been the blood
Hallelujah, hallelujah
I know it was the blood Could've only been the blood</pre>
                    </div>

                    <div class="import-guide-note">
                        <b>What happens after importing?</b>
                        <span>Each non-empty lyric line becomes a slide automatically. You can then go to <b>EDIT</b> to rename, edit, or reorder your sections and slides.</span>
                    </div>
                </div>
            </div>
        `;

        const style =
            document.createElement("style");

        style.id = "importGuidePopupStyles";
        style.textContent = `
            #importGuidePopup {
                position: fixed;
                inset: 0;
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
                background: rgba(0,0,0,0.68);
                box-sizing: border-box;
            }

            .import-guide-modal {
                width: min(680px, 100%);
                max-height: min(82vh, 760px);
                overflow: auto;
                background: #1d1d1d;
                color: #f0f0f0;
                border: 1px solid #3a3a3a;
                border-radius: 14px;
                box-shadow: 0 24px 80px rgba(0,0,0,0.55);
                font-family: inherit;
            }

            .import-guide-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                padding: 22px 24px 18px;
                border-bottom: 1px solid #333;
                position: sticky;
                top: 0;
                background: #1d1d1d;
                z-index: 2;
            }

            .import-guide-kicker {
                color: #8d949d;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 1.5px;
                margin-bottom: 5px;
            }

            .import-guide-header h2 {
                margin: 0;
                font-size: 21px;
                line-height: 1.2;
                color: #f5f5f5;
            }

            .import-guide-close {
                border: 0;
                background: transparent;
                color: #9b9b9b;
                font-size: 27px;
                line-height: 1;
                cursor: pointer;
                padding: 2px 5px;
            }

            .import-guide-close:hover {
                color: #fff;
            }

            .import-guide-body {
                padding: 20px 24px 24px;
            }

            .import-guide-step {
                display: flex;
                gap: 13px;
                padding: 12px 0;
            }

            .import-guide-number {
                flex: 0 0 28px;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: #3a3a3a;
                color: #e7e7e7;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 13px;
                font-weight: 800;
            }

            .import-guide-step strong {
                display: block;
                font-size: 14px;
                margin: 2px 0 5px;
            }

            .import-guide-step p {
                margin: 0;
                color: #aeb2b8;
                font-size: 13px;
                line-height: 1.55;
            }

            .import-guide-step b {
                color: #e7e7e7;
            }

            .import-guide-step code {
                color: #e5e5e5;
                background: #303030;
                border-radius: 4px;
                padding: 2px 5px;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 12px;
            }

            .import-guide-example {
                margin-top: 12px;
                border: 1px solid #353535;
                border-radius: 9px;
                overflow: hidden;
            }

            .import-guide-example-title {
                padding: 10px 13px;
                background: #252525;
                color: #d6d6d6;
                font-size: 12px;
                font-weight: 800;
            }

            .import-guide-example pre {
                margin: 0;
                padding: 14px;
                background: #151515;
                color: #cfd2d6;
                font-size: 12px;
                line-height: 1.65;
                white-space: pre-wrap;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            }

            .import-guide-note {
                display: flex;
                flex-direction: column;
                gap: 5px;
                margin-top: 16px;
                padding: 13px 14px;
                border-radius: 8px;
                background: #252525;
                border: 1px solid #343434;
                color: #aeb2b8;
                font-size: 12px;
                line-height: 1.5;
            }

            .import-guide-note b {
                color: #e6e6e6;
            }

            @media (max-width: 600px) {
                #importGuidePopup {
                    padding: 12px;
                }

                .import-guide-header,
                .import-guide-body {
                    padding-left: 17px;
                    padding-right: 17px;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(overlay);

        overlay.querySelector(".import-guide-close")
            .addEventListener("click", closeImportGuidePopup);

        overlay.addEventListener("click", function(event) {
            if (event.target === overlay) {
                closeImportGuidePopup();
            }
        });
    }

    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";

    const closeButton =
        overlay.querySelector(".import-guide-close");

    if (closeButton) {
        closeButton.focus();
    }
}


function closeImportGuidePopup() {

    const overlay =
        document.getElementById("importGuidePopup");

    if (!overlay) {
        return;
    }

    overlay.style.display = "none";
    document.body.style.overflow = "";
}


document.addEventListener("keydown", function(event) {

    if (event.key === "Escape") {
        closeImportGuidePopup();
    }

});



/* =========================================================
   INITIALISE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

      loadLibrary();
loadTransitionSetting();
addImportInfoButton();

        outputOn = false;

        const startupLyric = document.getElementById("lyric");
        if (startupLyric) {
            startupLyric.style.visibility = "hidden";
            startupLyric.classList.add("fade-out");
            startupLyric.innerText = "";
        }

        updateOutputButtons();
        syncVisibleSongDropdown();
    }
);

// =========================================================
// KEYBOARD SHORTCUT
// Shift + Tab = Toggle between SONGS and EDIT
// =========================================================

document.addEventListener("keydown", function(event) {

    if (
        event.shiftKey &&
        event.key === "Tab"
    ) {

        event.preventDefault();

        const songsTab =
            document.getElementById("songsTab");

        const editTab =
            document.getElementById("editTab");


        // If currently on EDIT → go to SONGS
        if (
            editTab &&
            editTab.classList.contains("active")
        ) {

            switchTab("songs");

        }

        // Otherwise → go to EDIT
        else {

            switchTab("edit");

        }

    }

    if (tabName === "manual") {

    document
        .getElementById("manualTab")
        .classList.add("active");

    document
        .getElementById("manualTabButton")
        .classList.add("active");

}
});