/* ==========================================================================
   THE BIRTHDAY EXPERIENCE 2026 - COMPLETE LOGIC & AUDIO
   Hosts: Michael & Phillip
   Music: David Hasselhoff - Looking For Freedom
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // Application State
    let config = {};
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

    // DOM Scene Elements
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

    // 1. Load Configuration
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

    // 2. Deadline Lockout Check (Ab 20.11.2026 um 00:00:01)
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

    // 3. Apply Config Values to UI
    function applyConfig() {
        if (!config.hosts) return;
        document.getElementById('infoDate').textContent = config.date;
        document.getElementById('infoTime').textContent = config.doorsOpen;
        document.getElementById('infoLocation').innerHTML = `${config.locationName}<br><small>${config.locationAddress}</small>`;
        document.getElementById('infoDresscode').textContent = config.dresscode;
        document.getElementById('ticketHosts').textContent = config.hosts.toUpperCase();
        document.getElementById('ticketDate').textContent = config.date.toUpperCase();
        document.getElementById('ticketTime').textContent = config.doorsOpen.toUpperCase
