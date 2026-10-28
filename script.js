/* ==========================================================================
   THE BIRTHDAY EXPERIENCE 2026 - LOGIC, DEADLINE LOCK & EMAIL RSVP
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    let config = {};
    let state = {
        userName: '',
        attending: null,
        guestCount: 0,
        plusOneName: '',
        ticketId: '',
        timestamp: ''
    };

    let audioCtx = null;
    let isMusicPlaying = false;
    let synthTimer = null;

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

    // Load Config
    fetch('config.json')
        .then(res => res.json())
        .then(data => {
            config = data;
            
            // Check deadline first
            if (checkDeadline()) return;

            applyConfig();
            initApp();
        })
        .catch(err => {
            console.error("Could not load config.json, using defaults.", err);
            initApp();
        });

    // 1. Deadline Lockout Check
    function checkDeadline() {
        if (!config.deadline) return false;

        const now = new Date();
        const deadlineDate = new Date(config.deadline);

        if (now > deadlineDate) {
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
        if (!config.hosts) return;
        document.getElementById('infoDate').textContent = config.date;
        document.getElementById('infoTime').textContent = config.doorsOpen;
        document.getElementById('infoLocation').innerHTML = `${config.locationName}<br><small>${config.locationAddress}</small>`;
        document.getElementById('infoDresscode').textContent = config.dresscode;
        document.getElementById('ticketHosts').textContent = config.hosts.toUpperCase();
        document.getElementById('ticketDate').textContent = config.date.toUpperCase();
        document.getElementById('ticketTime').textContent = config.doorsOpen.toUpperCase();
        document.getElementById('ticketLocation').textContent = `${config.locationName.toUpperCase()}, BOTTROP`;
    }

    function initApp() {
        document.getElementById('btn-enter').addEventListener('click', () => showScene('name'));
        
        document.getElementById('form-name').addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('userNameInput').value.trim();
            if (nameInput) {
                state.userName = nameInput;
                document.getElementById('displayGuestName').textContent = nameInput.toUpperCase();
                showScene('invitation');
            }
        });

        document.getElementById('btn-choice-in').addEventListener('click', () => showScene('rsvpYes'));
        document.getElementById('btn-choice-out').addEventListener('click', () => showScene('rsvpNo'));

        document.querySelectorAll('input[name="guestCount"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const plusOneGroup = document.getElementById('plusOneInputGroup');
                if (e.target.value === "1") {
                    plusOneGroup.classList.remove('hidden');
                } else {
                    plusOneGroup.classList.add('hidden');
                }
            });
        });

        // RSVP Yes Confirmation
        document.getElementById('form-rsvp-yes').addEventListener('submit', (e) => {
            e.preventDefault();
            state.attending = true;
            state.guestCount = parseInt(document.querySelector('input[name="guestCount"]:checked').value);
            state.plusOneName = document.getElementById('plusOneName').value.trim();
            state.ticketId = generateTicketId(state.userName);
            state.timestamp = new Date().toISOString();

            saveRsvpToLocalStorage();
            sendEmailNotification();
            startGlitchAndShowTicket();
        });

        // RSVP No Confirmation
        document.getElementById('btn-confirm-out').addEventListener('click', () => {
            state.attending = false;
            state.timestamp = new Date().toISOString();
            
            saveRsvpToLocalStorage();
            sendEmailNotification();
            showScene('declinedFinal');
        });

        document.getElementById('btn-restart').addEventListener('click', () => showScene('invitation'));
        document.getElementById('btn-restart-declined').addEventListener('click', () => showScene('invitation'));

        document.getElementById('musicToggleBtn').addEventListener('click', toggleAudio);

        document.getElementById('btnHostAdmin').addEventListener('click', openAdminModal);
        document.getElementById('btnCloseAdmin').addEventListener('click', closeAdminModal);
        document.getElementById('btnExportJson').addEventListener('click', exportJsonToClipboard);
        document.getElementById('btnClearStorage').addEventListener('click', clearRsvpData);
    }

    // 2. Email Notification Service
    function sendEmailNotification() {
        if (!config.formspreeEndpoint || config.formspreeEndpoint.includes('DEINE_FORM_ID_HIER')) {
            console.log("Formspree URL noch nicht konfiguriert.");
            return;
        }

        const payload = {
            Name: state.userName,
            Status: state.attending ? "✅ ZUGESAGT (I'M IN)" : "❌ ABGESAGT (I'M OUT)",
            Begleitung: state.guestCount > 0 ? (state.plusOneName ? `+1 (${state.plusOneName})` : '+1 Person') : 'Keine',
            TicketID: state.ticketId || 'N/A',
            Zeitpunkt: new Date().toLocaleString('de-DE')
        };

        fetch(config.formspreeEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        }).catch(err => console.error("E-Mail Versandfehler:", err));
    }

    function showScene(sceneKey) {
        Object.values(scenes).forEach(s => s.classList.remove('active'));
        if (scenes[sceneKey]) {
            scenes[sceneKey].classList.add('active');
        }
    }

    function generateTicketId(name) {
        const prefix = config.ticketPrefix || 'BD26';
        const dateCode = '1222';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'XX';
        const rand = Math.floor(10 + Math.random() * 89);
        return `${prefix}-${dateCode}-${initials}${rand}`;
    }

    function startGlitchAndShowTicket() {
        showScene('loading');
        let count = 3;
        const countEl = document.getElementById('countdownNum');
        const progressBar = document.getElementById('vhsProgress');

        progressBar.style.width = '0%';
        
        const interval = setInterval(() => {
            count--;
            countEl.textContent = count;
            progressBar.style.width = `${((3 - count) / 3) * 100}%`;

            if (count <= 0) {
                clearInterval(interval);
                renderTicketData();
                showScene('ticket');
            }
        }, 800);
    }

    function renderTicketData() {
        document.getElementById('ticketGuestName').textContent = state.userName.toUpperCase();
        document.getElementById('ticketPlusOne').textContent = state.guestCount > 0 
            ? (state.plusOneName ? `+1 (${state.plusOneName.toUpperCase()})` : '+1 GUEST') 
            : 'JUST ME';

        document.getElementById('ticketIdDisplay').textContent = state.ticketId;
        document.getElementById('ticketIdStub').textContent = state.ticketId;

        const charSum = state.userName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        document.getElementById('ticketRow').textContent = String((charSum % 12) + 1).padStart(2, '0');
        document.getElementById('ticketSeat').textContent = String((charSum % 28) + 1).padStart(2, '0');

        const qrContainer = document.getElementById('qrcode');
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

    function saveRsvpToLocalStorage() {
        const stored = JSON.parse(localStorage.getItem('bday_rsvps_2026') || '[]');
        const updated = stored.filter(item => item.userName.toLowerCase() !== state.userName.toLowerCase());
        updated.push(state);
        localStorage.setItem('bday_rsvps_2026', JSON.stringify(updated));
    }

    function openAdminModal() {
        const stored = JSON.parse(localStorage.getItem('bday_rsvps_2026') || '[]');
        const tableBody = document.getElementById('adminTableBody');
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

        document.getElementById('statTotal').textContent = stored.length;
        document.getElementById('statAttending').textContent = attendingCount;
        document.getElementById('statGuests').textContent = totalGuests;

        document.getElementById('adminModal').classList.remove('hidden');
    }

    function closeAdminModal() {
        document.getElementById('adminModal').classList.add('hidden');
    }

    function exportJsonToClipboard() {
        const stored = localStorage.getItem('bday_rsvps_2026') || '[]';
        navigator.clipboard.writeText(stored).then(() => {
            alert('RSVP JSON data copied to clipboard!');
        });
    }

    function clearRsvpData() {
        if (confirm('Are you sure you want to reset local RSVP data?')) {
            localStorage.removeItem('bday_rsvps_2026');
            openAdminModal();
        }
    }

    function escapeHtml(str) {
        return str ? str.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">") : '';
    }

    function toggleAudio() {
        if (!isMusicPlaying) {
            start80sSynth();
            document.getElementById('musicIcon').textContent = '🔊';
            document.getElementById('musicText').textContent = 'MUSIC ON';
            isMusicPlaying = true;
        } else {
            stop80sSynth();
            document.getElementById('musicIcon').textContent = '🔇';
            document.getElementById('musicText').textContent = 'MUSIC OFF';
            isMusicPlaying = false;
        }
    }

    function start80sSynth() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const notes = [220, 261.63, 329.63, 392.00, 440, 523.25];
        let step = 0;

        synthTimer = setInterval(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(notes[step % notes.length], audioCtx.currentTime);

            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.36);

            step++;
        }, 220);
    }

    function stop80sSynth() {
        if (synthTimer) {
            clearInterval(synthTimer);
            synthTimer = null;
        }
    }
});
