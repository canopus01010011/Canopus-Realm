
let currentUser = null;

const projectPaths = {
    'Anime-Tracker-main': 'Anime-Tracker-main/index.html',
    'ROCK-PAPER-SCISSOR02-main': 'Rock-Paper-Scissor-main/Rock-Paper-Scissor-main/index.html',
    'Tic-Tac-Toe-website-version--main': 'Tic-Tac-Toe-website-version--main/Tic-Tac-Toe-website-version--main/index.html',
    'Quiz-main': 'Quiz-main/Quiz-main/index.html',
    'Note-Web-main': 'Note-Web-main/Note-Web-main/index.html',
    'To-Do-List-main': 'To-Do-List-main/To-Do-List-main/index.html',
    'Fitness-Tracker-Dashboard-main': 'Fitness-Tracker-Dashboard-main/Fitness-Tracker-Dashboard-main/index.html',
    'Epic-Page-main': 'Epic-Page-main/Epic-Page-main/index.html',
    'Epic-Music-Player-main': 'Epic-Music-Player-main/Epic-Music-Player-main/index2.html',
    'weather-main': 'weather-main/index.html',
    'Calculator-main': 'Calculator-main/index.html',
    'Currency-Converter-main': 'Currency-Converter-main/Currency-Converter-main/index.html',
    'ValentineLOL-main': 'ValentineLOL-main/index.html',
    'Eid-main': 'Eid-main/index.html',
    'karoake': 'karoake/index.html',
};

// Featured project rotation dATA
const featuredProjects = [
    {
        key: 'Anime-Tracker-main', title: 'Anime Tracker', icon: 'fa-film',
        desc: "My largest anime management application — track, rate, and discuss every series you watch.",
        tags: ['HTML', 'CSS', 'JS', 'Firebase'], glow: 'rgba(47,216,245,0.22)'
    },
    {
        key: 'Calculator-main', title: 'Calculator', icon: 'fa-calculator',
        desc: "An advanced calculator with a scientific mode and full calculation history.",
        tags: ['HTML', 'CSS', 'JS'], glow: 'rgba(167,139,250,0.22)'
    },
    {
        key: 'Fitness-Tracker-Dashboard-main', title: 'Fitness Tracker', icon: 'fa-heartbeat',
        desc: "A dashboard for tracking fitness goals, workouts, and progress over time.",
        tags: ['HTML', 'CSS', 'JS'], glow: 'rgba(22,255,176,0.22)'
    },
    {
        key: 'ValentineLOL-main', title: 'Valentine', icon: 'fa-heart',
        desc: "A small, playful website built for asking someone out.",
        tags: ['Love', 'Confession'], glow: 'rgba(255,111,174,0.22)'
    }
];

// DOM refs
const authModal = document.getElementById('auth-modal');
const userDropdown = document.getElementById('user-dropdown');
const userMenuPlaceholder = document.getElementById('user-menu-placeholder');
const projectModal = document.getElementById('project-modal');
const projectIframe = document.getElementById('project-iframe');
const projectLoader = document.querySelector('.project-loader');
const navLinks = document.querySelectorAll('.nav-link');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navbar = document.getElementById('navbar');
const sharePopover = document.getElementById('sharePopover');

document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    setupEventListeners();
    setupNavigation();
    setupNavbarScroll();
    setupStarfield();
    setupCursorGlow();
    setupFilters();
    setupSearch();
    setupFeatured();
    setupStatCounters();
    setupCardReveal();
    setupCardTilt();
    setupShareSystem();
    autoOpenFromUrl();
    console.log('Canopus Realm initialized');
});

function autoOpenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('open');
    if (key && projectPaths[key]) {
       setTimeout(() => openProject(key), 400);
    }
}

// NAVIGATION
function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            scrollToSection(section);
            updateActiveNav(link);
            if (navMenu.classList.contains('active')) toggleHamburger();
        });
    });

    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                const match = document.querySelector(`.nav-link[data-section="${id}"]`);
                if (match) updateActiveNav(match);
            }
        });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => observer.observe(s));
}

function updateActiveNav(activeLink) {
    navLinks.forEach(link => link.classList.remove('active'));
    activeLink.classList.add('active');
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) section.scrollIntoView({ behavior: 'smooth' });
}

hamburger.addEventListener('click', toggleHamburger);
function toggleHamburger() {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
}

function setupNavbarScroll() {
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
        lastY = window.scrollY;
    }, { passive: true });
}

function setupStarfield() {
    const canvas = document.getElementById('starfield');
    const ctx = canvas.getContext('2d');
    let stars = [];
    let w, h;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = document.documentElement.scrollHeight;
        const count = Math.min(220, Math.floor((w * h) / 9000));
        stars = Array.from({ length: count }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.3 + 0.3,
            baseAlpha: Math.random() * 0.6 + 0.2,
            twinkleSpeed: Math.random() * 0.02 + 0.005,
            phase: Math.random() * Math.PI * 2
        }));
    }

    let t = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function draw() {
        ctx.clearRect(0, 0, w, h);
        stars.forEach(s => {
            const alpha = reduced ? s.baseAlpha : s.baseAlpha + Math.sin(t * s.twinkleSpeed + s.phase) * 0.25;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(230, 245, 245, ${Math.max(0, alpha)})`;
            ctx.fill();
        });
        t++;
        if (!reduced) requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();
    draw();
}

//CURSOR GLOW + PLANET PARALLAX 
function setupCursorGlow() {
    const glow = document.getElementById('cursorGlow');
    const planet = document.querySelector('.planet');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { glow.style.display = 'none'; return; }

    window.addEventListener('mousemove', (e) => {
        glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
        if (planet && e.clientY < window.innerHeight) {
            const dx = (e.clientX / window.innerWidth - 0.5) * 24;
            const dy = (e.clientY / window.innerHeight - 0.5) * 24;
            planet.style.transform = `translate(${dx}px, ${dy}px)`;
        }
    }, { passive: true });
}

//cATEGORY FILTER  
function setupFilters() {
    const pills = document.querySelectorAll('.filter-pill');
    const worlds = document.querySelectorAll('.world');

    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const filter = pill.getAttribute('data-filter');

            worlds.forEach(world => {
                const worldName = world.getAttribute('data-world');
                const show = filter === 'all' || filter === worldName;
                world.style.display = show ? '' : 'none';
            });

            if (filter !== 'all') {
                const target = document.getElementById(filter);
                if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 50);
            }
        });
    });
}

//   SEARCH  
function setupSearch() {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    const toggle = document.getElementById('searchToggle');
    const heroBtn = document.getElementById('heroSearchBtn');
    const cards = Array.from(document.querySelectorAll('.project-card'));

    function openSearch() {
        overlay.classList.add('active');
        input.value = '';
        renderResults('');
        setTimeout(() => input.focus(), 50);
    }
    function closeSearch() { overlay.classList.remove('active'); }

    function renderResults(query) {
        const q = query.trim().toLowerCase();
        const matches = q === '' ? [] : cards.filter(card => {
            const name = card.getAttribute('data-name').toLowerCase();
            const tags = card.getAttribute('data-tags').toLowerCase();
            return name.includes(q) || tags.includes(q);
        });

        results.innerHTML = '';
        if (q !== '' && matches.length === 0) {
            results.innerHTML = `<p class="no-results">No projects found for "${escapeHtml(query)}"</p>`;
            return;
        }
        matches.forEach(card => {
            const name = card.getAttribute('data-name');
            const icon = card.querySelector('.project-visual i').className;
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `<i class="${icon}"></i><div><div class="srn">${name}</div><div class="srd">${card.querySelector('p').textContent}</div></div>`;
            item.addEventListener('click', () => {
                closeSearch();
                card.click();
            });
            results.appendChild(item);
        });
    }

    toggle.addEventListener('click', openSearch);
    heroBtn.addEventListener('click', openSearch);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSearch(); });
    input.addEventListener('input', () => renderResults(input.value));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearch();
        if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            openSearch();
        }
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}





let shareContext = null;
let shareMenu = null;


//cREATE SHARE MENU
        

function createShareMenu() {

    if (shareMenu) return;

    shareMenu = document.createElement('div');

    shareMenu.id = 'canopusShareMenu';
    shareMenu.className = 'canopus-share-menu';

    shareMenu.innerHTML = `
        <div class="share-menu-header">

            <div class="share-menu-title">


                <div>
                    <strong>Share this project</strong>
                    <small id="shareProjectName">
                        Canopus Realm
                    </small>
                </div>

            </div>

            <button
                class="share-menu-close"
                id="shareMenuClose"
                type="button"
                aria-label="Close share menu"
            >
                &times;
            </button>

        </div>


        <div class="share-menu-grid">

            <button
                class="share-option native"
                type="button"
                data-share-action="native"
            >
                <span class="share-option-icon">
                    <i class="fas fa-share-nodes"></i>
                </span>

                <span>Share</span>
            </button>


            <button
                class="share-option whatsapp"
                type="button"
                data-share-action="whatsapp"
            >
                <span class="share-option-icon">
                    <i class="fab fa-whatsapp"></i>
                </span>

                <span>WhatsApp</span>
            </button>


            <button
                class="share-option telegram"
                type="button"
                data-share-action="telegram"
            >
                <span class="share-option-icon">
                    <i class="fab fa-telegram"></i>
                </span>

                <span>Telegram</span>
            </button>


            <button
                class="share-option facebook"
                type="button"
                data-share-action="facebook"
            >
                <span class="share-option-icon">
                    <i class="fab fa-facebook-f"></i>
                </span>

                <span>Facebook</span>
            </button>


            <button
                class="share-option x"
                type="button"
                data-share-action="x"
            >
                <span class="share-option-icon">
                    <i class="fab fa-x-twitter"></i>
                </span>

                <span>X</span>
            </button>


            <button
                class="share-option email"
                type="button"
                data-share-action="email"
            >
                <span class="share-option-icon">
                    <i class="fas fa-envelope"></i>
                </span>

                <span>Email</span>
            </button>

        </div>


        <button
            class="share-copy-row"
            type="button"
            data-share-action="copy"
        >

            <span class="copy-left">

                <span class="copy-icon">
                    <i class="fas fa-link"></i>
                </span>

                <span>
                    <strong>Copy link</strong>

                    <small id="shareUrlPreview">
                        Copy project link
                    </small>
                </span>

            </span>


            <span
                class="copy-status"
                id="shareCopyStatus"
            >
                Copy
            </span>

        </button>



    `;

    document.body.appendChild(shareMenu);


    /* Close button */

    const closeButton =
        document.getElementById('shareMenuClose');

    if (closeButton) {
        closeButton.addEventListener(
            'click',
            closeShareMenu
        );
    }


    /* Share actions */

    shareMenu
        .querySelectorAll('[data-share-action]')
        .forEach(button => {

            button.addEventListener('click', () => {

                const action =
                    button.dataset.shareAction;

                handleShareAction(action);

            });

        });

}



function setupShareSystem() {

    createShareMenu();




    document.addEventListener('click', event => {

        const button =
            event.target.closest('.share-btn');

        if (!button) return;


        event.preventDefault();
        event.stopPropagation();


        const projectKey =
            button.dataset.project ||
            button.dataset.key;


        if (!projectKey) {

            console.error(
                'Share button is missing data-project:',
                button
            );

            showMessage(
                'Unable to share this project.',
                'error'
            );

            return;
        }


        const title =
            button.dataset.title ||
            getProjectTitle(projectKey);


        const description =
            button.dataset.description ||
            getProjectDescription(projectKey);


        openShareMenu(
            button,
            projectKey,
            title,
            description
        );

    });


    /* Close when clicking outside */

    document.addEventListener('click', event => {

        if (!shareMenu) return;

        if (!shareMenu.classList.contains('active')) {
            return;
        }


        const clickedInsideMenu =
            shareMenu.contains(event.target);


        const clickedShareButton =
            event.target.closest('.share-btn');


        if (
            !clickedInsideMenu &&
            !clickedShareButton
        ) {

            closeShareMenu();

        }

    });


    /* Escape */

    document.addEventListener('keydown', event => {

        if (event.key === 'Escape') {
            closeShareMenu();
        }

    });


    /* Reposition */

    window.addEventListener(
        'resize',
        () => {

            if (
                shareMenu &&
                shareMenu.classList.contains('active')
            ) {

                positionShareMenu();

            }

        },
        { passive: true }
    );


    window.addEventListener(
        'scroll',
        () => {

            if (
                shareMenu &&
                shareMenu.classList.contains('active')
            ) {

                positionShareMenu();

            }

        },
        { passive: true }
    );



    window.addEventListener('message', event => {

        const data = event.data;

        if (!data) return;


        if (
            data.source !== 'canopus-project' ||
            data.type !== 'canopus-share-request'
        ) {
            return;
        }


        const projectKey =
            data.project;


        if (!projectKey) {
            console.warn(
                'Share request received without project key.'
            );
            return;
        }


        const title =
            data.title ||
            getProjectTitle(projectKey);


        const description =
            data.description ||
            getProjectDescription(projectKey);


        openIframeShareMenu(
            projectKey,
            title,
            description
        );

    });

}



function getProjectTitle(projectKey) {

    const project = featuredProjects.find(
        p => p.key === projectKey
    );

    if (project) {
        return project.title;
    }


    const names = {

        'ValentineLOL-main':
            'Valentine',

        'Eid-main':
            'Eid Sa3id',

        'Anime-Tracker-main':
            'Anime Tracker',

        'Calculator-main':
            'Calculator',

        'Fitness-Tracker-Dashboard-main':
            'Fitness Tracker',

        'Epic-Music-Player-main':
            'Epic Music Player'

    };


    return names[projectKey] || 'Canopus Realm';

}


function getProjectDescription(projectKey) {

    const project = featuredProjects.find(
        p => p.key === projectKey
    );

    if (project) {
        return project.desc;
    }


    const descriptions = {

        'ValentineLOL-main':
            'A playful Valentine project from Canopus Realm.',

        'Eid-main':
            'An Eid Sa3id project from Canopus Realm.'

    };


    return (
        descriptions[projectKey] ||
        'Check out this project from Canopus Realm.'
    );

}




function buildShareUrl(projectKey) {



    const url =
        new URL(
            window.location.href
        );


    url.search = '';


    url.hash = '';


    url.searchParams.set(
        'open',
        projectKey
    );


    return url.toString();

}




function openShareMenu(
    anchor,
    projectKey,
    title,
    description
) {

    createShareMenu();


    if (!projectPaths[projectKey]) {

        console.error(
            'Unknown project:',
            projectKey
        );

        showMessage(
            'Unable to create project link.',
            'error'
        );

        return;
    }


    shareContext = {

        url:
            buildShareUrl(projectKey),

        title:
            `${title} — Canopus Realm`,

        text:
            description,

        projectKey,

        anchor

    };


    /* Remove active state */

    document
        .querySelectorAll(
            '.share-btn[data-active-share="true"]'
        )
        .forEach(button => {

            delete button.dataset.activeShare;

        });


    anchor.dataset.activeShare =
        'true';


    updateShareMenu();


    shareMenu.classList.add(
        'active'
    );


    positionShareMenu(anchor);

}




function openIframeShareMenu(
    projectKey,
    title,
    description
) {

    createShareMenu();


    if (!projectPaths[projectKey]) {

        console.error(
            'Unknown iframe project:',
            projectKey
        );

        return;
    }


    shareContext = {

        url:
            buildShareUrl(projectKey),

        title:
            `${title} — Canopus Realm`,

        text:
            description,

        projectKey,

        anchor: null

    };


    document
        .querySelectorAll(
            '.share-btn[data-active-share="true"]'
        )
        .forEach(button => {

            delete button.dataset.activeShare;

        });


    updateShareMenu();


    shareMenu.classList.add(
        'active'
    );




    shareMenu.dataset.iframe =
        'true';


    positionShareMenu();

}




function updateShareMenu() {

    if (!shareContext) return;


    const name =
        document.getElementById(
            'shareProjectName'
        );


    const preview =
        document.getElementById(
            'shareUrlPreview'
        );


    const status =
        document.getElementById(
            'shareCopyStatus'
        );


    if (name) {

        name.textContent =
            shareContext.title
                .replace(
                    ' — Canopus Realm',
                    ''
                );

    }


    if (preview) {

        preview.textContent =
            shareContext.url
                .replace(
                    /^https?:\/\//,
                    ''
                );

    }


    if (status) {

        status.textContent =
            'Copy';

        status.classList.remove(
            'success'
        );

    }


    /* Native share */

    const native =
        shareMenu.querySelector(
            '[data-share-action="native"]'
        );


    if (native) {

        native.style.display =
            navigator.share
                ? 'flex'
                : 'none';

    }

}



function positionShareMenu(
    anchorOverride = null
) {

    if (!shareMenu) return;


    if (!shareMenu.classList.contains('active')) {
        return;
    }




    if (
        shareMenu.dataset.iframe === 'true' &&
        !anchorOverride
    ) {

        const width =
            Math.min(
                360,
                window.innerWidth - 24
            );


        const height =
            shareMenu.offsetHeight || 320;


        shareMenu.style.left =
            `${Math.max(
                12,
                (window.innerWidth - width) / 2
            )}px`;


        shareMenu.style.top =
            `${Math.max(
                12,
                (window.innerHeight - height) / 2
            )}px`;


        return;

    }


    const anchor =
        anchorOverride ||
        shareContext?.anchor ||
        document.querySelector(
            '.share-btn[data-active-share="true"]'
        );


    if (!anchor) {



        shareMenu.dataset.iframe =
            'true';

        positionShareMenu();

        return;
    }


    shareMenu.dataset.iframe =
        'false';


    const rect =
        anchor.getBoundingClientRect();


    const menuWidth =
        Math.min(
            360,
            window.innerWidth - 24
        );


    const menuHeight =
        shareMenu.offsetHeight || 320;


    let left =
        rect.left +
        rect.width / 2 -
        menuWidth / 2;


    let top =
        rect.bottom +
        12;


    /* Horizontal boundaries */

    left =
        Math.max(
            12,
            Math.min(
                left,
                window.innerWidth -
                    menuWidth -
                    12
            )
        );



    if (
        top + menuHeight >
        window.innerHeight - 12
    ) {

        top =
            rect.top -
            menuHeight -
            12;

    }


    /* Mobile */

    if (
        window.innerWidth <= 560
    ) {

        left = 12;


        if (
            top + menuHeight >
            window.innerHeight - 12
        ) {

            top =
                Math.max(
                    12,
                    window.innerHeight -
                        menuHeight -
                        12
                );

        }


        top =
            Math.max(
                12,
                top
            );

    }


    shareMenu.style.left =
        `${left}px`;


    shareMenu.style.top =
        `${top}px`;

}



async function handleShareAction(action) {

    if (!shareContext) return;


    const {
        url,
        title,
        text
    } = shareContext;


    switch (action) {


        /*    =
           NATIVE
           = */

        case 'native':

            if (!navigator.share) {

                showMessage(
                    'Native sharing is not supported here.',
                    'warning'
                );

                return;
            }


            try {

                await navigator.share({

                    title,

                    text,

                    url

                });


                closeShareMenu();


            } catch (error) {

                if (
                    error.name !==
                    'AbortError'
                ) {

                    console.error(
                        'Native share failed:',
                        error
                    );

                }

            }

            break;


        /*    =
           WHATSAPP
           = */

        case 'whatsapp':

            openExternalShare(
                `https://wa.me/?text=${encodeURIComponent(
                    `${text}\n\n${url}`
                )}`
            );

            break;


        /*    =
           TELEGRAM
           = */

        case 'telegram':

            openExternalShare(
                `https://t.me/share/url?url=${encodeURIComponent(
                    url
                )}&text=${encodeURIComponent(
                    `${title}\n${text}`
                )}`
            );

            break;


        /*    =
           FACEBOOK
           = */

        case 'facebook':

            openExternalShare(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    url
                )}`
            );

            break;


        /*    =
           X
           = */

        case 'x':

            openExternalShare(
                `https://x.com/intent/post?text=${encodeURIComponent(
                    text
                )}&url=${encodeURIComponent(
                    url
                )}`
            );

            break;


        /*    =
           EMAIL
           = */

        case 'email': {

            const subject =
                encodeURIComponent(
                    `Check out ${title}`
                );


            const body =
                encodeURIComponent(
                    `${text}\n\n${url}`
                );


            window.location.href =
                `mailto:?subject=${subject}&body=${body}`;


            closeShareMenu();

            break;

        }


        /*    =
           COPY
           = */

        case 'copy':

            await copyShareLink();

            break;

    }

}



function openExternalShare(url) {

    const popup =
        window.open(
            url,
            '_blank',
            'noopener,noreferrer'
        );




    if (!popup) {

        window.location.href =
            url;

        return;

    }


    closeShareMenu();

}



async function copyShareLink() {

    if (!shareContext) return;


    const status =
        document.getElementById(
            'shareCopyStatus'
        );


    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                shareContext.url
            );

        } else {

            const textarea =
                document.createElement(
                    'textarea'
                );


            textarea.value =
                shareContext.url;


            textarea.style.position =
                'fixed';

            textarea.style.left =
                '-9999px';


            document.body.appendChild(
                textarea
            );


            textarea.focus();

            textarea.select();


            const successful =
                document.execCommand(
                    'copy'
                );


            textarea.remove();


            if (!successful) {
                throw new Error(
                    'Clipboard copy failed'
                );
            }

        }


        if (status) {

            status.textContent =
                'Copied!';

            status.classList.add(
                'success'
            );

        }


        setTimeout(() => {

            if (!status) return;


            status.textContent =
                'Copy';


            status.classList.remove(
                'success'
            );

        }, 1800);


    } catch (error) {

        console.error(
            'Copy failed:',
            error
        );


        if (status) {

            status.textContent =
                'Try again';

        }

    }

}



function closeShareMenu() {

    if (!shareMenu) return;


    shareMenu.classList.remove(
        'active'
    );


    shareMenu.dataset.iframe =
        'false';


    document
        .querySelectorAll(
            '.share-btn[data-active-share="true"]'
        )
        .forEach(button => {

            delete button.dataset.activeShare;

        });


    shareContext =
        null;

}



//   FEATURED PROJECT ROTATION  
function setupFeatured() {
    const card = document.getElementById('featuredCard');
    const titleEl = document.getElementById('featuredTitle');
    const descEl = document.getElementById('featuredDesc');
    const tagsEl = document.getElementById('featuredTags');
    const visualEl = document.getElementById('featuredVisual');
    const launchBtn = document.getElementById('featuredLaunch');
    const dotsWrap = document.getElementById('featuredDots');

    let index = 0;
    let timer;

    featuredProjects.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = 'featured-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => setFeatured(i, true));
        dotsWrap.appendChild(dot);
    });

    function setFeatured(i, userTriggered) {
        index = i;
        const p = featuredProjects[i];
        card.style.setProperty('--featured-glow', p.glow);
        titleEl.textContent = p.title;
        descEl.textContent = p.desc;
        visualEl.innerHTML = `<i class="fas ${p.icon}"></i>`;
        tagsEl.innerHTML = p.tags.map(t => `<span class="tag">${t}</span>`).join('');
        launchBtn.onclick = () => openProject(p.key);
        Array.from(dotsWrap.children).forEach((d, di) => d.classList.toggle('active', di === i));
        if (userTriggered) restart();
    }

    function restart() {
        clearInterval(timer);
        timer = setInterval(() => setFeatured((index + 1) % featuredProjects.length, false), 6000);
    }

    setFeatured(0, false);
    restart();
}

//   STAT COUNTERS  
function setupStatCounters() {
    const nums = document.querySelectorAll('.stat-num');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.getAttribute('data-count'), 10);
            const suffix = el.getAttribute('data-suffix') || '';
            if (reduced) {
                el.textContent = target + suffix;
            } else {
                const duration = 1400;
                const start = performance.now();
                function tick(now) {
                    const progress = Math.min(1, (now - start) / duration);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    el.textContent = Math.floor(eased * target) + suffix;
                    if (progress < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
            }
            obs.unobserve(el);
        });
    }, { threshold: 0.6 });

    nums.forEach(n => observer.observe(n));
}

function setupCardReveal() {
    const cards = document.querySelectorAll('.project-card');
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
entry.target.style.animationDelay = `${(i % 4) * 0.08}s`;               entry.target.classList.add('in-view');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    cards.forEach(c => observer.observe(c));
}

function setupCardTilt() {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
card.style.setProperty('--mx', `${x}%`);
card.style.setProperty('--my', `${y}%`);
        });
    });
}

//AUTHENTICATION  
function initializeAuth() {
    if (typeof auth === 'undefined') {
        console.warn('Firebase auth not configured — auth features disabled.');
        updateUIForAuth();
        return;
    }
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        updateUIForAuth();
    });
}

function updateUIForAuth() {
    const loginBanner = document.getElementById('login-verify-banner');
    if (currentUser) {
        userMenuPlaceholder.innerHTML = `<button class="user-menu-btn" onclick="toggleUserDropdown()"><i class="fas fa-user-circle"></i></button>`;
        document.getElementById('username-display').textContent = currentUser.displayName || 'User';
        document.getElementById('useremail-display').textContent = currentUser.email;
        const verifyStatus = document.getElementById('verify-status');
        if (verifyStatus) {
            verifyStatus.innerHTML = currentUser.emailVerified
                ? `<span class="verified-badge"><i class="fas fa-circle-check"></i> Verified</span>`
                : `<span class="unverified-badge"><i class="fas fa-triangle-exclamation"></i> Not verified — <a href="#" onclick="resendVerification();return false;" style="text-decoration:underline;">resend</a></span>`;
        }
        if (loginBanner) loginBanner.style.display = 'none';
    } else {
        userMenuPlaceholder.innerHTML = `<button class="user-menu-btn" onclick="openAuthModal()">Login / Sign Up</button>`;
    }
}



function openAuthModal() {
    authModal.classList.add('active');
}

function closeAuthModal() {
    authModal.classList.remove('active');
}

function switchTab(tabName) {
    const targetTab = document.getElementById(tabName + '-tab');
    const targetButton = document.querySelector(
        `.auth-tab-btn[data-tab="${tabName}"]`
    );

    if (!targetTab || !targetButton) return;

    document.querySelectorAll('.auth-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    targetTab.classList.add('active');
    targetButton.classList.add('active');
}

document.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.addEventListener('click', (event) => {
        event.preventDefault();
        switchTab(btn.dataset.tab);
    });
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (e.target.closest('#auth-modal')) closeAuthModal();
    });
});

authModal.addEventListener('click', (e) => { if (e.target === authModal) closeAuthModal(); });

function friendlyAuthError(error) {
    const map = {
        'auth/invalid-email': 'That email address looks invalid.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/user-not-found': 'No account found with that email.',
        'auth/wrong-password': 'Incorrect password. Try again or reset it.',
        'auth/invalid-credential': 'Incorrect email or password.',
        'auth/email-already-in-use': 'An account already exists with that email.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/network-request-failed': 'Network error — check your connection and try again.',
        'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.'
    };
    return (error && map[error.code]) || (error && error.message) || 'Something went wrong. Please try again.';
}

function setFieldError(id, message) {
    const el = document.getElementById(id);
    if (!el) return;
    if (message) {
        el.textContent = message;
        el.classList.add('show');
    } else {
        el.textContent = '';
        el.classList.remove('show');
    }
}

function setButtonLoading(form, isLoading) {
    const btn = form.querySelector('.auth-btn');
    if (!btn) return;
    btn.disabled = isLoading;
    btn.classList.toggle('loading', isLoading);
}

function firebaseReady() {
    if (typeof auth === 'undefined') {
        showMessage('Authentication is not configured on this site yet.', 'error');
        return false;
    }
    return true;
}

document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
        const formId = btn.getAttribute('data-target-form');
        const form = document.getElementById(formId);
        const input = btn.previousElementSibling;
        if (!input) return;
        const showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        btn.innerHTML = showing ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
});

const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setFieldError('login-error', '');
    if (!firebaseReady()) return;

    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;

    if (!email || !password) {
        setFieldError('login-error', 'Please fill in both fields.');
        return;
    }

    setButtonLoading(loginForm, true);
    try {
        const result = await auth.signInWithEmailAndPassword(email, password);
        const banner = document.getElementById('login-verify-banner');
        if (result.user && !result.user.emailVerified) {
            showMessage('Logged in — please verify your email for full access.', 'warning');
        } else {
            showMessage('Welcome back!', 'success');
        }
        closeAuthModal();
        loginForm.reset();
    } catch (error) {
        setFieldError('login-error', friendlyAuthError(error));
    } finally {
        setButtonLoading(loginForm, false);
    }
});

const signupForm = document.getElementById('signup-form');
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setFieldError('signup-error', '');
    if (!firebaseReady()) return;

    const name = signupForm.name.value.trim();
    const email = signupForm.email.value.trim();
    const password = signupForm.password.value;
    const confirmPassword = signupForm.confirmPassword.value;

    if (name.length < 2) {
        setFieldError('signup-error', 'Please enter your full name.');
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldError('signup-error', 'Please enter a valid email address.');
        return;
    }
    if (password.length < 6) {
        setFieldError('signup-error', 'Password must be at least 6 characters.');
        return;
    }
    if (password !== confirmPassword) {
        setFieldError('signup-error', 'Passwords do not match.');
        return;
    }

    setButtonLoading(signupForm, true);
    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        await result.user.updateProfile({ displayName: name });

        try {
            await result.user.sendEmailVerification();
        } catch (verifyErr) {
            console.warn('Could not send verification email:', verifyErr);
        }

        if (typeof db !== 'undefined') {
            await db.collection('users').doc(result.user.uid).set({
                name: name,
                email: email,
                createdAt: new Date(),
                emailVerified: false,
                preferences: { theme: 'dark', notifications: true }
            });
        }

        showMessage('Account created! Check your inbox to verify your email.', 'success');
        closeAuthModal();
        signupForm.reset();
    } catch (error) {
        setFieldError('signup-error', friendlyAuthError(error));
    } finally {
        setButtonLoading(signupForm, false);
    }
});

function resendVerification() {
    if (!currentUser) {
        showMessage('Please log in first.', 'warning');
        return;
    }
    if (currentUser.emailVerified) {
        showMessage('Your email is already verified!', 'success');
        return;
    }
    currentUser.sendEmailVerification()
        .then(() => showMessage('Verification email sent — check your inbox.', 'success'))
        .catch(err => showMessage(friendlyAuthError(err), 'error'));
}

function handleForgotPassword() {
    if (!firebaseReady()) return;
    const email = (loginForm.email.value || '').trim();
    if (!email) {
        setFieldError('login-error', 'Enter your email above first, then click "Forgot password?".');
        return;
    }
    auth.sendPasswordResetEmail(email)
        .then(() => showMessage(`Password reset email sent to ${email}.`, 'success'))
        .catch(err => setFieldError('login-error', friendlyAuthError(err)));
}

function toggleUserDropdown() { userDropdown.classList.toggle('active'); }

function logout() {
    auth.signOut().then(() => {
        showMessage('Logged out successfully!', 'success');
        userDropdown.classList.remove('active');
    }).catch((error) => showMessage(error.message, 'error'));
}

function goToUserProfile() {
    showMessage('Profile feature coming soon!', 'warning');
    userDropdown.classList.remove('active');
}

function goToUserSettings() {
    showMessage('Settings feature coming soon!', 'warning');
    userDropdown.classList.remove('active');
}

//   PROJECT MODAL  
function openProject(projectName) {
    const projectPath = projectPaths[projectName];
    if (!projectPath) {
        showMessage('Project not found!', 'error');
        return;
    }
// Projects are public. Visitors can open projects without creating an account.
projectModal.classList.add('active');
    
    projectLoader.style.display = 'flex';
    projectIframe.style.display = 'none';
    projectIframe.src = projectPath;
    projectIframe.onload = () => {
        projectLoader.style.display = 'none';
        projectIframe.style.display = 'block';
        try {
            projectIframe.contentWindow.postMessage({
                source: 'canopus-realm',
                type: 'canopus-user-info',
                user: currentUser ? {
                    name: currentUser.displayName || 'Guest',
                    email: currentUser.email,
                    verified: !!currentUser.emailVerified
                } : {
                name: 'Guest',
                email: null,
                verified: false
            }
            }, '*');
        } catch (err) {
            console.warn('Could not post user info to project iframe:', err);
        }
    };
    projectIframe.onerror = () => {
        projectLoader.style.display = 'none';
        showMessage('Unable to load the project page. Check paths or file location.', 'error');
    };
    trackActivity('open_project', projectName);
}


function closeProjectModal() {
    projectModal.classList.remove('active');
    projectIframe.src = '';
}

projectModal.addEventListener('click', (e) => {
    if (e.target === projectModal) closeProjectModal();
});


window.addEventListener('message', (e) => {
    if (!e.data || e.data.type !== 'canopus-request-user-info') return;
    if (!projectIframe.contentWindow) return;
    projectIframe.contentWindow.postMessage({
        source: 'canopus-realm',
        type: 'canopus-user-info',
        user: currentUser ? {
            name: currentUser.displayName || 'Guest',
            email: currentUser.email,
            verified: !!currentUser.emailVerified
        } : {
            name: 'Guest',
            email: null,
            verified: false
        }
    }, '*');
});

//   EVENT LISTENERS  
function setupEventListeners() {
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu-btn') && !e.target.closest('.user-dropdown')) {
            userDropdown.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAuthModal();
            closeProjectModal();
        }
    });
}

//   MESSAGE DISPLAY  
function showMessage(message, type = 'success') {
    const messageEl = document.createElement('div');
messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    setTimeout(() => messageEl.remove(), 3000);
}

//   UTILITY / DATA HELPERS  
function getCurrentUserData() {
    if (currentUser) return db.collection('users').doc(currentUser.uid).get();
    return null;
}

function updateUserData(data) {
    if (currentUser) return db.collection('users').doc(currentUser.uid).update(data);
    return null;
}

function trackActivity(activity, projectName) {
    if (currentUser && typeof db !== 'undefined') {
        db.collection('users').doc(currentUser.uid).collection('activities').add({
            activity: activity,
            project: projectName,
            timestamp: new Date()
        }).catch(err => console.error('Error tracking activity:', err));
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('light-mode');
    if (currentUser) {
        updateUserData({ 'preferences.theme': document.body.classList.contains('light-mode') ? 'light' : 'dark' });
    }
}

function checkNotifications() {
    if (currentUser && typeof db !== 'undefined') {
        db.collection('notifications')
            .where('userId', '==', currentUser.uid)
            .where('read', '==', false)
            .onSnapshot((snapshot) => {
                const unreadCount = snapshot.size;
                if (unreadCount > 0) console.log(`You have ${unreadCount} unread notifications`);
            });
    }
}
document.querySelectorAll('.project-card').forEach(card => {
    const projectId = card.getAttribute('onclick')?.match(/openProject\('([^']+)'\)/)?.[1];

    if (!projectId || card.querySelector('.share-btn')) return;

    const title = card.dataset.name || 'Project';
    const description = card.querySelector('p')?.textContent.trim() || '';

    const shareButton = document.createElement('button');

    shareButton.className = 'share-btn';
    shareButton.type = 'button';
    shareButton.dataset.project = projectId;
    shareButton.dataset.title = title;
    shareButton.dataset.description = description;

    shareButton.innerHTML = `
        <i class="fas fa-share-nodes"></i>
        <span>Share</span>
    `;

    card.prepend(shareButton);
});
