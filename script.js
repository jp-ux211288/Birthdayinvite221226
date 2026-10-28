/* ==========================================================================
   THE BIRTHDAY EXPERIENCE 2026 - AUTOPLAY ON ENTER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    let config = {
        hosts: "Michael & Phillip",
        date: "22. Dezember 2026",
        doorsOpen: "19:00 Uhr",
        locationName: "Kurz vorm Kino",
        locationAddress: "Blumenstraße 12, 46236 Bottrop",
        dresscode: "80s Glam / Cinema Chic / Vintage Retro",
        ticketPrefix: "BD26",
        deadline: "2026-11-19T23:59:59"
    };

    let state = {
        userName: '',
        attending: null,
        guestCount: 0,
        plusOneName: '',
        ticketId: '',
        timestamp: ''
    };

    // Audio Setup
    const bgAudio = new Audio('DavidHasselhoffLookingForFreedom.mp3');
    bgAudio.loop = true;
    let isMusicPlaying = false;

    const scenes = {
        intro: document.getElementById('scene-intro'),
        name: document.getElementById('scene-name'),
        invitation: document.getElementById('scene-invitation'),
        rsvpYes: document.getElementById('scene-rsvp-yes'),
        rsvpNo: document.getElementById('scene-rsvp-no'),
        loading: document.getElementById('scene-loading'),
        ticket: document.getElementById('scene-ticket'),
        declinedFinal: document.getElementById('scene-declined-final')
    };

    initApp();

    fetch('config.json')
        .then(res => res.json())
        .then(data => {
            config = { ...config, ...data };
            if (!checkDeadline()) {
                applyConfig();
            }
        })
        .catch(err => applyConfig());

    function checkDeadline() {
        if (!config.deadline) return false;
        const now = new Date();
        if (now > new Date(config.deadline)) {
            document.body.innerHTML = `
                <div class="expired-screen">
                    <div class="scanlines"></div>
                    <h1 class="expired-text">It's too late...</h1>
                </div>
            `;
            return true;
        }
        return false;
    }

    function applyConfig() {
        if (document.getElementById('infoDate')) document.getElementById('infoDate').textContent = config.date;
        if (document.getElementById('infoTime')) document.getElementById('infoTime').textContent = config.doorsOpen;
        if (document.getElementById('infoLocation')) document.getElementById('infoLocation').innerHTML = `${config.locationName}<br><small>${config.locationAddress}</small>`;
        if (document.getElementById('infoDresscode')) document.getElementById('infoDresscode').textContent = config.dresscode;
        if (document.getElementById('ticketHosts')) document.getElementById('ticketHosts').textContent = config.hosts.toUpperCase();
        if (document.getElementById('ticketDate')) document.getElementById('ticketDate').textContent = config.date.toUpperCase();
        if (document.getElementById('ticketTime')) document.getElementById('ticketTime').textContent = config.doorsOpen.toUpperCase();
        if (document.getElementById('ticketLocation')) document.getElementById('ticketLocation').textContent = `${config.locationName.toUpperCase()}, BOTTROP`;
    }

    // AUTOMATISCHER MUSIKSTART
    function startAudioAuto() {
        if (!isMusicPlaying) {
            bgAudio.play().then(() => {
                isMusicPlaying = true;
                const musicIcon = document.getElementById('musicIcon');
                const musicText = document.getElementById('musicText');
                if (musicIcon) musicIcon.textContent = '🔊';
                if (musicText) musicText.textContent = 'MUSIC ON';
            }).catch(err => {
                console.log("Autoplay blockiert bis zum ersten Klick:", err);
            });
        }
    }

    function initApp() {
        // Versuche Audio direkt bei der ersten Bildschirmberührung/Klick zu starten
        document.body.addEventListener('click', startAudioAuto, { once: true });

        // ENTER BUTTON (Startet Musik sofort und wechselt Szene)
        const enterBtn = document.getElementById('btn-enter');
        if (enterBtn) {
            enterBtn.addEventListener('click', () => {
                startAudioAuto();
                showScene('name');
            });
        }

        // NAME FORM
        const nameForm = document.getElementById('form-name');
        if (nameForm) {
            nameForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const nameInput = document.getElementById('userNameInput').value.trim();
                if (nameInput) {
                    state.userName = nameInput;
                    document.getElementById('displayGuestName').textContent = nameInput.toUpperCase();
                    showScene('invitation');
                }
            });
        }

        // CHOICE BUTTONS
        const choiceIn = document.getElementById('btn-choice-in');
        const choiceOut = document.getElementById('btn-choice-out');
        if (choiceIn) choiceIn.addEventListener('click', () => showScene('rsvpYes'));
        if (choiceOut) choiceOut.addEventListener('click', () => showScene('rsvpNo'));

        // PLUS ONE TOGGLE
        document.querySelectorAll('input[name="guestCount"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const plusOneGroup = document.getElementById('plusOneInputGroup');
                if (plusOneGroup) {
                    if (e.target.value === "1") plusOneGroup.classList.remove('hidden');
                    else plusOneGroup.classList.add('hidden');
                }
            });
        });

        // RSVP YES SUBMIT
        const yesForm = document.getElementById('form-rsvp-yes');
        if (yesForm) {
            yesForm.addEventListener('submit', (e) => {
                e.preventDefault();
                state.attending = true;
                const checkedRadio = document.querySelector('input[name="guestCount"]:checked');
                state.guestCount = checkedRadio ? parseInt(checkedRadio.value) : 0;
                state.plusOneName = document.getElementById('plusOneName').value.trim();
                state.ticketId = generateTicketId(state.userName);
                state.timestamp = new Date().toISOString();

                saveRsvpToLocalStorage();
                sendEmailNotification();
                startGlitchAndShowTicket();
            });
        }

        // RSVP NO SUBMIT
        const confirmOut = document.getElementById('btn-confirm-out');
        if (confirmOut) {
            confirmOut.addEventListener('click', () => {
                state.attending = false;
                state.timestamp = new Date().toISOString();
                saveRsvpToLocalStorage();
                sendEmailNotification();
                showScene('declinedFinal');
            });
        }

        // RESTART BUTTONS
        const restart = document.getElementById('btn-restart');
        const restartDeclined = document.getElementById('btn-restart-declined');
        if (restart) restart.addEventListener('click', () => showScene('invitation'));
        if (restartDeclined) restartDeclined.addEventListener('click', () => showScene('invitation'));

        // MUSIC TOGGLE BUTTON (Mute/Unmute falls jemand leiser schalten möchte)
        const musicBtn = document.getElementById('musicToggleBtn');
        if (musicBtn) {
            musicBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isMusicPlaying) {
                    bgAudio.pause();
                    isMusicPlaying = false;
                    document.getElementById('musicIcon').textContent = '🔇';
                    document.getElementById('musicText').textContent = 'MUSIC OFF';
                } else {
                    startAudioAuto();
                }
            });
        }

        // HOST ADMIN DASHBOARD
        const btnAdmin = document.getElementById('btnHostAdmin');
        const btnCloseAdmin = document.getElementById('btnCloseAdmin');
        const btnExport = document.getElementById('btnExportJson');
        const btnClear = document.getElementById('btnClearStorage');

        if (btnAdmin) btnAdmin.addEventListener('click', openAdminModal);
        if (btnCloseAdmin) btnCloseAdmin.addEventListener('click', closeAdminModal);
        if (btnExport) btnExport.addEventListener('click', exportJsonToClipboard);
        if (btnClear) btnClear.addEventListener('click', clearRsvpData);
    }

    function sendEmailNotification() {
        if (!config.formspreeEndpoint || config.formspreeEndpoint.includes('DEINE_FORM_ID_HIER')) return;
        const payload = {
            Name: state.userName,
            Status: state.attending ? "✅ ZUGESAGT (I'M IN)" : "❌ ABGESAGT (I'M OUT)",
            Begleitung: state.guestCount > 0 ? (state.plusOneName ? `+1 (${state.plusOneName})` : '+1 Person') : 'Keine',
            TicketID: state.ticketId || 'N/A',
            Zeitpunkt: new Date().toLocaleString('de-DE')
        };
        fetch(config.formspreeEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.error("Email Error:", err));
    }

    function showScene(sceneKey) {
        Object.values(scenes).forEach(s => { if (s) s.classList.remove('active'); });
        if (scenes[sceneKey]) scenes[sceneKey].classList.add('active');
    }

    function generateTicketId(name) {
        const prefix = config.ticketPrefix || 'BD26';
        const dateCode = '1222';
        const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'XX';
        const rand = Math.floor(10 + Math.random() * 89);
        return `${prefix}-${dateCode}-${initials}${rand}`;
    }

    function startGlitchAndShowTicket() {
        showScene('loading');
        let count = 3;
        const countEl = document.getElementById('countdownNum');
        const progressBar = document.getElementById('vhsProgress');

        if (progressBar) progressBar.style.width = '0%';
        const interval = setInterval(() => {
            count--;
            if (countEl) countEl.textContent = count;
            if (progressBar) progressBar.style.width = `${((3 - count) / 3) * 100}%`;
            if (count <= 0) {
                clearInterval(interval);
                renderTicketData();
                showScene('ticket');
            }
        }, 800);
    }

    function renderTicketData() {
        if (document.getElementById('ticketGuestName')) document.getElementById('ticketGuestName').textContent = state.userName.toUpperCase();
        if (document.getElementById('ticketPlusOne')) {
            document.getElementById('ticketPlusOne').textContent = state.guestCount > 0 
                ? (state.plusOneName ? `+1 (${state.plusOneName.toUpperCase()})` : '+1 GUEST') 
                : 'JUST ME';
        }
        if (document.getElementById('ticketIdDisplay')) document.getElementById('ticketIdDisplay').textContent = state.ticketId;
        if (document.getElementById('ticketIdStub')) document.getElementById('ticketIdStub').textContent = state.ticketId;

        const charSum = state.userName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        if (document.getElementById('ticketRow')) document.getElementById('ticketRow').textContent = String((charSum % 12) + 1).padStart(2, '0');
        if (document.getElementById('ticketSeat')) document.getElementById('ticketSeat').textContent = String((charSum % 28) + 1).padStart(2, '0');

        const qrContainer = document.getElementById('qrcode');
        if (qrContainer) {
            qrContainer.innerHTML = '';
            if (window.QRCode) {
                new QRCode(qrContainer, {
                    text: `RSVP:${state.ticketId}|GUEST:${state.userName}|PLUS1:${state.guestCount}`,
                    width: 90,
                    height: 90,
                    colorDark: "#1a1a1a",
                    colorLight: "#eae2cf",
                    correctLevel: QRCode.CorrectLevel.M
                });
            }
        }
    }

    function saveRsvpToLocalStorage() {
        const stored = JSON.parse(localStorage.getItem('bday_rsvps_2026') || '[]');
        const updated = stored.filter(item => item.userName.toLowerCase() !== state.userName.toLowerCase());
        updated.push(state);
        localStorage.setItem('bday_rsvps_2026', JSON.stringify(updated));
    }

    function openAdminModal() {
        const stored = JSON.parse(localStorage.getItem('bday_rsvps_2026') || '[]');
        const tableBody = document.getElementById('adminTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        let attendingCount = 0;
        let totalGuests = 0;

        stored.forEach(item => {
            if (item.attending) {
                attendingCount++;
                totalGuests += 1 + (item.guestCount || 0);
            }
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(item.userName)}</strong></td>
                <td><span style="color: ${item.attending ? '#00e5ff' : '#ff3366'}">${item.attending ? 'YES' : 'NO'}</span></td>
                <td>${item.guestCount > 0 ? (escapeHtml(item.plusOneName) || 'Yes') : 'No'}</td>
                <td><code>${item.ticketId || '-'}</code></td>
                <td><small>${new Date(item.timestamp).toLocaleDateString()}</small></td>
            `;
            tableBody.appendChild(tr);
        });

        if (document.getElementById('statTotal')) document.getElementById('statTotal').textContent = stored.length;
        if (document.getElementById('statAttending')) document.getElementById('statAttending').textContent = attendingCount;
        if (document.getElementById('statGuests')) document.getElementById('statGuests').textContent = totalGuests;

        const modal = document.getElementById('adminModal');
        if (modal) modal.classList.remove('hidden');
    }

    function closeAdminModal() {
        const modal = document.getElementById('adminModal');
        if (modal) modal.classList.add('hidden');
    }

    function exportJsonToClipboard() {
        const stored = localStorage.getItem('bday_rsvps_2026') || '[]';
        navigator.clipboard.writeText(stored).then(() => {
            alert('RSVP JSON-Daten in die Zwischenablage kopiert!');
        });
    }

    function clearRsvpData() {
        if (confirm('Möchtest du die lokalen RSVP-Daten wirklich zurücksetzen?')) {
            localStorage.removeItem('bday_rsvps_2026');
            openAdminModal();
        }
    }

    function escapeHtml(str) {
        return str ? str.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">") : '';
    }
});
