/* ==========================================================================
   PERSONAL SIRI - APP.JS VOICE & MOBILE AUTOMATION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // App State Initialization
  const state = {
    assistantName: localStorage.getItem('siri_name') || 'Siri',
    wakeWord: localStorage.getItem('siri_wakeword') || 'Hey Siri',
    wakeWordEnabled: localStorage.getItem('siri_wakeword_enabled') === 'true',
    isListening: false,
    isSpeaking: false,
    isMuted: localStorage.getItem('siri_muted') === 'true',
    selectedVoiceURI: localStorage.getItem('siri_voice') || '',
    voicePitch: parseFloat(localStorage.getItem('siri_pitch')) || 1.0,
    voiceRate: parseFloat(localStorage.getItem('siri_rate')) || 1.0,
    geminiKey: localStorage.getItem('siri_gemini_key') || '',
    theme: localStorage.getItem('siri_theme') || 'cosmic',
    tasks: JSON.parse(localStorage.getItem('siri_tasks')) || [
      { id: '1', text: 'Call Mom at 5 PM', completed: false },
      { id: '2', text: 'Check weather forecast', completed: true }
    ],
    notes: JSON.parse(localStorage.getItem('siri_notes')) || [
      { id: '1', text: 'Meeting scheduled for tomorrow at 11 AM.', date: 'Today 10:30 AM' }
    ],
    timer: {
      interval: null,
      totalSeconds: 0,
      remainingSeconds: 0,
      isActive: false
    },
    deferredPwaPrompt: null
  };

  // DOM Elements
  const DOM = {
    assistantNameDisplay: document.getElementById('assistant-name-display'),
    speechStatusBadge: document.getElementById('speech-status-badge'),
    statusBadgeText: document.getElementById('status-badge-text'),
    orbStatusText: document.getElementById('orb-status-text'),
    siriOrbElement: document.getElementById('siri-orb-element'),
    orbTriggerZone: document.getElementById('orb-trigger-zone'),
    orbCanvas: document.getElementById('orb-canvas'),
    micBtn: document.getElementById('mic-btn'),
    micIcon: document.getElementById('mic-icon'),
    textCommandInput: document.getElementById('text-command-input'),
    sendCommandBtn: document.getElementById('send-command-btn'),
    wakeWordToggleBtn: document.getElementById('wake-word-toggle-btn'),
    ttsMuteBtn: document.getElementById('tts-mute-btn'),
    ttsMuteIcon: document.getElementById('tts-mute-icon'),
    installPwaBtn: document.getElementById('install-pwa-btn'),
    openSettingsBtn: document.getElementById('open-settings-btn'),
    closeSettingsBtn: document.getElementById('close-settings-modal'),
    settingsModal: document.getElementById('settings-modal'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    resetAppDataBtn: document.getElementById('reset-app-data-btn'),
    transcriptMessagesContainer: document.getElementById('transcript-messages-container'),
    clearTranscriptBtn: document.getElementById('clear-transcript-btn'),
    
    // Widgets DOM
    digitalClock: document.getElementById('digital-clock'),
    digitalDate: document.getElementById('digital-date'),
    liveLocationBadge: document.getElementById('live-location-badge'),
    
    weatherIconElement: document.getElementById('weather-icon-element'),
    weatherTempText: document.getElementById('weather-temp-text'),
    weatherDescText: document.getElementById('weather-desc-text'),
    weatherCityText: document.getElementById('weather-city-text'),
    weatherHumidityText: document.getElementById('weather-humidity-text'),
    weatherWindText: document.getElementById('weather-wind-text'),
    refreshWeatherBtn: document.getElementById('refresh-weather-btn'),

    taskListContainer: document.getElementById('task-list-container'),
    newTaskInput: document.getElementById('new-task-input'),
    addTaskBtn: document.getElementById('add-task-btn'),
    taskCountBadge: document.getElementById('task-count-badge'),

    timerCountdownDisplay: document.getElementById('timer-countdown-display'),
    timerProgressBar: document.getElementById('timer-progress-bar'),
    timerStatusTag: document.getElementById('timer-status-tag'),
    timerStart1m: document.getElementById('timer-start-1m'),
    timerStart5m: document.getElementById('timer-start-5m'),
    timerCancelBtn: document.getElementById('timer-cancel-btn'),

    notesContainer: document.getElementById('notes-container'),
    addNoteBtn: document.getElementById('add-note-btn'),

    engineAiStatus: document.getElementById('engine-ai-status'),
    
    // Camera Modal
    cameraModal: document.getElementById('camera-modal'),
    closeCameraModal: document.getElementById('close-camera-modal'),
    cameraVideoStream: document.getElementById('camera-video-stream'),
    takePhotoBtn: document.getElementById('take-photo-btn'),

    // Settings Inputs
    assistantNameInput: document.getElementById('assistant-name-input'),
    wakeWordInput: document.getElementById('wake-word-input'),
    ttsVoiceSelect: document.getElementById('tts-voice-select'),
    ttsPitchRange: document.getElementById('tts-pitch-range'),
    ttsRateRange: document.getElementById('tts-rate-range'),
    pitchValDisplay: document.getElementById('pitch-val-display'),
    rateValDisplay: document.getElementById('rate-val-display'),
    geminiKeyInput: document.getElementById('gemini-key-input')
  };

  // =========================================================================
  // 1. WEB AUDIO API - SIRI CHIME SYNTHESIZER
  // =========================================================================
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playSiriChime(type = 'activate') {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    if (type === 'activate') {
      // Authentic dual-tone Siri activation chime
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      
      osc2.frequency.setValueAtTime(659.25, now); 
      osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
      
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } else if (type === 'confirm') {
      // Command Success chime
      osc1.frequency.setValueAtTime(783.99, now); // G5
      osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.2); // C6
      gainNode.gain.setValueAtTime(0.18, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc1.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);
    } else if (type === 'alarm') {
      // Alarm chime
      osc1.frequency.setValueAtTime(880, now);
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);
    }

    // Trigger mobile vibration if available
    if (navigator.vibrate) {
      navigator.vibrate(type === 'activate' ? [30, 40, 30] : [50]);
    }
  }

  // =========================================================================
  // 2. SIRI CANVAS LIQUID ORB VISUALIZER ENGINE
  // =========================================================================
  const ctx = DOM.orbCanvas.getContext('2d');
  let animationFrameId;
  let wavePhase = 0;

  function drawOrb() {
    ctx.clearRect(0, 0, DOM.orbCanvas.width, DOM.orbCanvas.height);
    const centerX = DOM.orbCanvas.width / 2;
    const centerY = DOM.orbCanvas.height / 2;
    const radius = 95;

    wavePhase += state.isListening ? 0.08 : state.isSpeaking ? 0.12 : 0.03;

    // Draw glowing animated wave layers
    const layerColors = [
      'rgba(99, 102, 241, 0.45)', // Indigo
      'rgba(236, 72, 153, 0.4)',  // Magenta
      'rgba(6, 182, 212, 0.45)',  // Cyan
      'rgba(168, 85, 247, 0.35)'  // Purple
    ];

    layerColors.forEach((color, index) => {
      ctx.beginPath();
      const points = 36;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const waveAmp = state.isListening ? 14 : state.isSpeaking ? 22 : 6;
        const offset = Math.sin(angle * (index + 2) + wavePhase + index) * waveAmp;
        const r = radius + offset;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    });

    // Draw inner shiny core
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(centerX - 10, centerY - 10, 5, centerX, centerY, radius * 0.4);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.6)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fill();

    animationFrameId = requestAnimationFrame(drawOrb);
  }
  drawOrb();

  // =========================================================================
  // 3. SPEECH RECOGNITION & SYNTHESIS (WEB SPEECH API)
  // =========================================================================
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  const synth = window.speechSynthesis;

  function populateVoiceList() {
    if (!synth) return;
    const voices = synth.getVoices();
    DOM.ttsVoiceSelect.innerHTML = '<option value="">Default System Voice</option>';
    
    voices.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.voiceURI;
      option.textContent = `${voice.name} (${voice.lang})`;
      if (voice.voiceURI === state.selectedVoiceURI) {
        option.selected = true;
      }
      DOM.ttsVoiceSelect.appendChild(option);
    });
  }

  if (synth) {
    populateVoiceList();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = populateVoiceList;
    }
  }

  function speakText(text, callback) {
    if (state.isMuted || !synth) {
      if (callback) callback();
      return;
    }

    synth.cancel(); // Stop ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = state.voicePitch;
    utterance.rate = state.voiceRate;

    const voices = synth.getVoices();
    if (state.selectedVoiceURI) {
      const foundVoice = voices.find(v => v.voiceURI === state.selectedVoiceURI);
      if (foundVoice) utterance.voice = foundVoice;
    }

    utterance.onstart = () => {
      state.isSpeaking = true;
      setAssistantState('speaking', 'Speaking...');
    };

    utterance.onend = () => {
      state.isSpeaking = false;
      setAssistantState('ready', 'Tap mic or press Space to talk');
      if (callback) callback();
    };

    utterance.onerror = () => {
      state.isSpeaking = false;
      setAssistantState('ready', 'Tap mic or press Space to talk');
      if (callback) callback();
    };

    synth.speak(utterance);
  }

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      state.isListening = true;
      playSiriChime('activate');
      setAssistantState('listening', 'Listening to your voice...');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (interimTranscript) {
        DOM.orbStatusText.textContent = `"${interimTranscript}"`;
      }

      if (finalTranscript) {
        handleUserSpeechInput(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech Recognition Error:', event.error);
      state.isListening = false;
      setAssistantState('ready', 'Tap mic or press Space to talk');
    };

    recognition.onend = () => {
      state.isListening = false;
      if (!state.isSpeaking) {
        setAssistantState('ready', 'Tap mic or press Space to talk');
      }
    };
  } else {
    DOM.orbStatusText.textContent = 'Speech Recognition not supported in this browser. Use text input below!';
    DOM.micBtn.disabled = true;
  }

  function toggleListening() {
    if (!recognition) return;
    if (state.isListening) {
      recognition.stop();
    } else {
      if (synth) synth.cancel();
      try {
        recognition.start();
      } catch (err) {
        recognition.stop();
      }
    }
  }

  function setAssistantState(mode, messageText) {
    DOM.orbStatusText.textContent = messageText;
    DOM.statusBadgeText.textContent = mode.toUpperCase();
    
    DOM.speechStatusBadge.className = 'status-badge ' + mode;
    DOM.orbTriggerZone.className = 'orb-wrapper ' + mode;
    DOM.micBtn.className = 'mic-trigger-btn ' + (mode === 'listening' ? 'active' : '');
  }

  // =========================================================================
  // 4. SMART COMMAND PARSER & MOBILE AUTOMATION HANDLER
  // =========================================================================
  function handleUserSpeechInput(rawInput) {
    const query = rawInput.trim();
    if (!query) return;

    addChatBubble('user', query);
    setAssistantState('thinking', 'Processing command...');

    // Parse Command Skills
    setTimeout(() => {
      processCommand(query);
    }, 200);
  }

  async function processCommand(commandStr) {
    const cmd = commandStr.toLowerCase();
    let reply = '';
    let executedAction = false;

    // 1. Mobile Intent: Voice Call ("call 9876543210" or "call mom")
    if (cmd.startsWith('call ')) {
      const target = commandStr.substring(5).trim();
      const cleanNumber = target.replace(/[^0-9+]/g, '');
      reply = `Calling ${target}...`;
      playSiriChime('confirm');
      addChatBubble('assistant', reply);
      speakText(reply);
      setTimeout(() => {
        window.location.href = `tel:${cleanNumber || target}`;
      }, 1200);
      return;
    }

    // 2. Mobile Intent: WhatsApp Message ("whatsapp rahul message hi there")
    if (cmd.startsWith('whatsapp ')) {
      const body = commandStr.substring(9).trim();
      reply = `Opening WhatsApp for "${body}"...`;
      playSiriChime('confirm');
      addChatBubble('assistant', reply);
      speakText(reply);
      setTimeout(() => {
        window.open(`https://wa.me/?text=${encodeURIComponent(body)}`, '_blank');
      }, 1200);
      return;
    }

    // 3. Mobile Intent: SMS Message ("sms 9876543210 message meeting tomorrow")
    if (cmd.startsWith('sms ')) {
      const body = commandStr.substring(4).trim();
      reply = `Opening SMS composer...`;
      playSiriChime('confirm');
      addChatBubble('assistant', reply);
      speakText(reply);
      setTimeout(() => {
        window.location.href = `sms:?body=${encodeURIComponent(body)}`;
      }, 1200);
      return;
    }

    // 4. Mobile Intent: Navigation ("navigate to mumbai" or "take me to delhi")
    if (cmd.includes('navigate to') || cmd.includes('take me to') || cmd.includes('directions to')) {
      let destination = commandStr
        .replace(/navigate to/i, '')
        .replace(/take me to/i, '')
        .replace(/directions to/i, '')
        .trim();
      reply = `Starting navigation to ${destination} on Google Maps...`;
      playSiriChime('confirm');
      addChatBubble('assistant', reply);
      speakText(reply);
      setTimeout(() => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`, '_blank');
      }, 1200);
      return;
    }

    // 5. Open Camera ("open camera" or "take photo")
    if (cmd.includes('camera') || cmd.includes('photo')) {
      reply = `Opening live camera feed...`;
      playSiriChime('confirm');
      addChatBubble('assistant', reply);
      speakText(reply);
      openCameraModal();
      return;
    }

    // 6. Time & Date Commands
    if (cmd.includes('time') || cmd.includes('samay')) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      reply = `The current time is ${timeStr}.`;
      executedAction = true;
    } else if (cmd.includes('date') || cmd.includes('today') || cmd.includes('day')) {
      const now = new Date();
      const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      reply = `Today is ${dateStr}.`;
      executedAction = true;
    }

    // 7. Weather Commands ("weather in delhi")
    else if (cmd.includes('weather') || cmd.includes('mausam')) {
      let city = 'Mumbai';
      if (cmd.includes('in ')) {
        city = commandStr.split('in ')[1].trim();
      }
      reply = await fetchLiveWeather(city);
      executedAction = true;
    }

    // 8. Timer Commands ("set timer for 5 minutes")
    else if (cmd.includes('timer') || cmd.includes('alarm')) {
      const match = cmd.match(/(\d+)\s*(minute|min|second|sec)/);
      if (match) {
        const val = parseInt(match[1]);
        const unit = match[2];
        const seconds = unit.startsWith('min') ? val * 60 : val;
        startTimer(seconds);
        reply = `Timer set for ${val} ${unit}s.`;
      } else {
        startTimer(300); // default 5 min
        reply = `Timer started for 5 minutes.`;
      }
      executedAction = true;
    }

    // 9. Task Management Commands ("add task buy groceries")
    else if (cmd.includes('add task') || cmd.includes('remind me to')) {
      let taskText = commandStr.replace(/add task/i, '').replace(/remind me to/i, '').trim();
      if (taskText) {
        addNewTask(taskText);
        reply = `I have added "${taskText}" to your tasks list.`;
      } else {
        reply = `What would you like me to add to your tasks?`;
      }
      executedAction = true;
    }

    // 10. Voice Notes ("take note meeting tomorrow")
    else if (cmd.includes('take note') || cmd.includes('save note')) {
      let noteText = commandStr.replace(/take note/i, '').replace(/save note/i, '').trim();
      if (noteText) {
        addNewNote(noteText);
        reply = `Voice note saved: "${noteText}".`;
      } else {
        reply = `Please specify what note to save.`;
      }
      executedAction = true;
    }

    // 11. Google & YouTube Search ("search google for...", "play music...")
    else if (cmd.includes('search google for') || cmd.includes('google search')) {
      const q = commandStr.replace(/search google for/i, '').replace(/google search/i, '').trim();
      reply = `Searching Google for "${q}"...`;
      playSiriChime('confirm');
      addChatBubble('assistant', reply);
      speakText(reply);
      setTimeout(() => {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank');
      }, 1000);
      return;
    } else if (cmd.includes('play') && (cmd.includes('youtube') || cmd.includes('music') || cmd.includes('song'))) {
      const q = commandStr.replace(/play/i, '').replace(/on youtube/i, '').replace(/music/i, '').replace(/song/i, '').trim();
      reply = `Playing ${q} on YouTube...`;
      playSiriChime('confirm');
      addChatBubble('assistant', reply);
      speakText(reply);
      setTimeout(() => {
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank');
      }, 1000);
      return;
    }

    // 12. Jokes & Fun
    else if (cmd.includes('joke') || cmd.includes('funny')) {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "Why did the computer go to the doctor? Because it had a virus!",
        "Parallel lines have so much in common. It's a shame they'll never meet."
      ];
      reply = jokes[Math.floor(Math.random() * jokes.length)];
      executedAction = true;
    }

    // 13. Conversational / Gemini AI / Fallback
    if (!executedAction && !reply) {
      if (state.geminiKey) {
        reply = await fetchGeminiResponse(commandStr);
      } else {
        reply = getBuiltInSmartResponse(cmd);
      }
    }

    playSiriChime('confirm');
    addChatBubble('assistant', reply);
    speakText(reply);
  }

  function getBuiltInSmartResponse(cmd) {
    if (cmd.includes('hello') || cmd.includes('hi') || cmd.includes('hey')) {
      return `Hello! How can I assist you today with your phone or tasks?`;
    }
    if (cmd.includes('who are you') || cmd.includes('your name')) {
      return `I am ${state.assistantName}, your personal AI voice assistant and mobile automation hub.`;
    }
    if (cmd.includes('how are you')) {
      return `I'm functioning at full capacity and ready for your voice commands!`;
    }
    if (cmd.includes('thank')) {
      return `You're very welcome! Let me know if you need anything else.`;
    }
    return `I heard "${cmd}". I can make phone calls, WhatsApp messages, weather checks, set timers, and search the web for you!`;
  }

  async function fetchGeminiResponse(userPrompt) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${state.geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }]
        })
      });
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (e) {
      console.error(e);
      return `I attempted to connect to Gemini AI, but couldn't. Here is my offline response for "${userPrompt}".`;
    }
  }

  // =========================================================================
  // 5. WIDGET LOGIC & LOCAL STORAGE PERSISTENCE
  // =========================================================================

  // Live Digital Clock
  function updateClock() {
    const now = new Date();
    DOM.digitalClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    DOM.digitalDate.textContent = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Weather Fetcher (Open-Meteo API)
  async function fetchLiveWeather(city = 'Mumbai') {
    try {
      DOM.weatherCityText.textContent = `${city}`;
      DOM.weatherDescText.textContent = 'Fetching weather...';
      
      // Geocoding city
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
      const geoData = await geoRes.json();
      
      if (geoData.results && geoData.results.length > 0) {
        const { latitude, longitude, name, country } = geoData.results[0];
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const weatherData = await weatherRes.json();
        
        const temp = Math.round(weatherData.current_weather.temperature);
        const code = weatherData.current_weather.weathercode;
        const wind = weatherData.current_weather.windspeed;

        DOM.weatherTempText.textContent = `${temp}°C`;
        DOM.weatherCityText.textContent = `${name}, ${country || ''}`;
        DOM.weatherWindText.textContent = `Wind: ${wind} km/h`;
        DOM.weatherDescText.textContent = getWeatherDesc(code);
        DOM.weatherIconElement.innerHTML = `<i class="${getWeatherIconClass(code)} weather-icon"></i>`;

        return `The current weather in ${name} is ${temp} degrees Celsius with ${getWeatherDesc(code)}.`;
      }
    } catch (err) {
      console.warn('Weather fetch fallback:', err);
    }
    // Default mock fallback
    DOM.weatherTempText.textContent = '28°C';
    DOM.weatherDescText.textContent = 'Clear Sky';
    return `Currently in ${city}, it's 28 degrees Celsius and clear.`;
  }

  function getWeatherDesc(code) {
    if (code === 0) return 'Clear Sky';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 65) return 'Rainy';
    if (code <= 82) return 'Rain Showers';
    return 'Thunderstorm';
  }

  function getWeatherIconClass(code) {
    if (code === 0) return 'fa-solid fa-sun';
    if (code <= 3) return 'fa-solid fa-cloud-sun';
    if (code <= 65) return 'fa-solid fa-cloud-rain';
    return 'fa-solid fa-cloud-bolt';
  }

  DOM.refreshWeatherBtn.addEventListener('click', () => fetchLiveWeather('Mumbai'));
  fetchLiveWeather('Mumbai');

  // Tasks Widget
  function renderTasks() {
    DOM.taskListContainer.innerHTML = '';
    state.tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item ${task.completed ? 'completed' : ''}`;
      li.innerHTML = `
        <div class="task-left">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
          <span>${escapeHtml(task.text)}</span>
        </div>
        <button class="delete-task-btn" data-id="${task.id}"><i class="fa-solid fa-xmark"></i></button>
      `;
      DOM.taskListContainer.appendChild(li);
    });
    DOM.taskCountBadge.textContent = state.tasks.filter(t => !t.completed).length;
    localStorage.setItem('siri_tasks', JSON.stringify(state.tasks));
  }

  function addNewTask(text) {
    if (!text) return;
    state.tasks.push({ id: Date.now().toString(), text, completed: false });
    renderTasks();
  }

  DOM.addTaskBtn.addEventListener('click', () => {
    addNewTask(DOM.newTaskInput.value.trim());
    DOM.newTaskInput.value = '';
  });

  DOM.taskListContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('task-checkbox')) {
      const id = e.target.getAttribute('data-id');
      const task = state.tasks.find(t => t.id === id);
      if (task) task.completed = e.target.checked;
      renderTasks();
    } else if (e.target.closest('.delete-task-btn')) {
      const btn = e.target.closest('.delete-task-btn');
      const id = btn.getAttribute('data-id');
      state.tasks = state.tasks.filter(t => t.id !== id);
      renderTasks();
    }
  });
  renderTasks();

  // Voice Notes Widget
  function renderNotes() {
    DOM.notesContainer.innerHTML = '';
    if (state.notes.length === 0) {
      DOM.notesContainer.innerHTML = '<div class="empty-list-notice">No notes saved.</div>';
      return;
    }
    state.notes.forEach(note => {
      const div = document.createElement('div');
      div.className = 'note-card';
      div.innerHTML = `
        <div>
          <p>${escapeHtml(note.text)}</p>
          <div class="note-date">${note.date}</div>
        </div>
        <button class="delete-task-btn" data-id="${note.id}"><i class="fa-solid fa-trash-can"></i></button>
      `;
      DOM.notesContainer.appendChild(div);
    });
    localStorage.setItem('siri_notes', JSON.stringify(state.notes));
  }

  function addNewNote(text) {
    if (!text) return;
    const now = new Date();
    state.notes.unshift({ id: Date.now().toString(), text, date: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    renderNotes();
  }

  DOM.addNoteBtn.addEventListener('click', () => {
    const text = prompt('Enter new voice note:');
    if (text) addNewNote(text);
  });

  DOM.notesContainer.addEventListener('click', (e) => {
    if (e.target.closest('.delete-task-btn')) {
      const btn = e.target.closest('.delete-task-btn');
      const id = btn.getAttribute('data-id');
      state.notes = state.notes.filter(n => n.id !== id);
      renderNotes();
    }
  });
  renderNotes();

  // Timer & Alarm Engine
  function startTimer(seconds) {
    clearInterval(state.timer.interval);
    state.timer.totalSeconds = seconds;
    state.timer.remainingSeconds = seconds;
    state.timer.isActive = true;
    DOM.timerStatusTag.textContent = 'Running';

    updateTimerUI();
    state.timer.interval = setInterval(() => {
      state.timer.remainingSeconds--;
      updateTimerUI();

      if (state.timer.remainingSeconds <= 0) {
        clearInterval(state.timer.interval);
        state.timer.isActive = false;
        DOM.timerStatusTag.textContent = 'Finished!';
        playSiriChime('alarm');
        speakText('Timer complete!');
      }
    }, 1000);
  }

  function updateTimerUI() {
    const mins = Math.floor(state.timer.remainingSeconds / 60);
    const secs = state.timer.remainingSeconds % 60;
    DOM.timerCountdownDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    if (state.timer.totalSeconds > 0) {
      const percent = (state.timer.remainingSeconds / state.timer.totalSeconds);
      const dashoffset = 283 * (1 - percent);
      DOM.timerProgressBar.style.strokeDashoffset = dashoffset;
    }
  }

  DOM.timerStart1m.addEventListener('click', () => startTimer(60));
  DOM.timerStart5m.addEventListener('click', () => startTimer(300));
  DOM.timerCancelBtn.addEventListener('click', () => {
    clearInterval(state.timer.interval);
    state.timer.isActive = false;
    state.timer.remainingSeconds = 0;
    DOM.timerStatusTag.textContent = 'Idle';
    DOM.timerProgressBar.style.strokeDashoffset = 0;
    updateTimerUI();
  });

  // Camera Modal Handling
  let cameraStream = null;
  async function openCameraModal() {
    DOM.cameraModal.classList.add('active');
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      DOM.cameraVideoStream.srcObject = cameraStream;
    } catch (err) {
      alert('Camera permission denied or camera not available.');
      DOM.cameraModal.classList.remove('active');
    }
  }

  function closeCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    DOM.cameraModal.classList.remove('active');
  }

  DOM.closeCameraModal.addEventListener('click', closeCamera);

  // Helper Utilities
  function addChatBubble(sender, text) {
    const div = document.createElement('div');
    div.className = `chat-bubble ${sender === 'user' ? 'user-bubble' : 'assistant-bubble'}`;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = `
      <div class="bubble-avatar"><i class="fa-solid ${sender === 'user' ? 'fa-user' : 'fa-sparkles'}"></i></div>
      <div class="bubble-content">
        <p>${escapeHtml(text)}</p>
        <span class="bubble-time">${now}</span>
      </div>
    `;

    DOM.transcriptMessagesContainer.appendChild(div);
    DOM.transcriptMessagesContainer.scrollTop = DOM.transcriptMessagesContainer.scrollHeight;
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, match => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[match]));
  }

  DOM.clearTranscriptBtn.addEventListener('click', () => {
    DOM.transcriptMessagesContainer.innerHTML = '';
  });

  // Event Listeners for Controls
  DOM.micBtn.addEventListener('click', toggleListening);
  DOM.orbTriggerZone.addEventListener('click', toggleListening);

  DOM.sendCommandBtn.addEventListener('click', () => {
    const val = DOM.textCommandInput.value.trim();
    if (val) {
      handleUserSpeechInput(val);
      DOM.textCommandInput.value = '';
    }
  });

  DOM.textCommandInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      DOM.sendCommandBtn.click();
    }
  });

  // Keyboard Shortcut: Spacebar to speak
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      toggleListening();
    }
  });

  // Quick Action Skill Tiles
  document.querySelectorAll('.skill-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      const cmd = tile.getAttribute('data-command');
      if (cmd) handleUserSpeechInput(cmd);
    });
  });

  // Settings Modal & Preferences
  DOM.openSettingsBtn.addEventListener('click', () => DOM.settingsModal.classList.add('active'));
  DOM.closeSettingsBtn.addEventListener('click', () => DOM.settingsModal.classList.remove('active'));

  DOM.ttsMuteBtn.addEventListener('click', () => {
    state.isMuted = !state.isMuted;
    localStorage.setItem('siri_muted', state.isMuted);
    DOM.ttsMuteIcon.className = state.isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
    DOM.ttsMuteBtn.classList.toggle('active', state.isMuted);
  });

  DOM.ttsPitchRange.addEventListener('input', (e) => {
    DOM.pitchValDisplay.textContent = e.target.value;
  });
  DOM.ttsRateRange.addEventListener('input', (e) => {
    DOM.rateValDisplay.textContent = e.target.value;
  });

  DOM.saveSettingsBtn.addEventListener('click', () => {
    state.assistantName = DOM.assistantNameInput.value.trim() || 'Siri';
    state.wakeWord = DOM.wakeWordInput.value.trim() || 'Hey Siri';
    state.selectedVoiceURI = DOM.ttsVoiceSelect.value;
    state.voicePitch = parseFloat(DOM.ttsPitchRange.value);
    state.voiceRate = parseFloat(DOM.ttsRateRange.value);
    state.geminiKey = DOM.geminiKeyInput.value.trim();

    localStorage.setItem('siri_name', state.assistantName);
    localStorage.setItem('siri_wakeword', state.wakeWord);
    localStorage.setItem('siri_voice', state.selectedVoiceURI);
    localStorage.setItem('siri_pitch', state.voicePitch);
    localStorage.setItem('siri_rate', state.voiceRate);
    localStorage.setItem('siri_gemini_key', state.geminiKey);

    DOM.assistantNameDisplay.textContent = state.assistantName;
    DOM.engineAiStatus.textContent = state.geminiKey ? 'Gemini AI Pro' : 'Built-in Engine';
    DOM.settingsModal.classList.remove('active');
  });

  DOM.resetAppDataBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all saved tasks, notes, and assistant settings?')) {
      localStorage.clear();
      window.location.reload();
    }
  });

  // Theme Switching
  document.querySelectorAll('.theme-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.theme-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const themeId = chip.getAttribute('data-theme-id');
      document.body.setAttribute('data-theme', themeId);
      localStorage.setItem('siri_theme', themeId);
    });
  });

  // PWA Install Prompt Listener
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPwaPrompt = e;
    DOM.installPwaBtn.style.display = 'flex';
  });

  DOM.installPwaBtn.addEventListener('click', () => {
    if (state.deferredPwaPrompt) {
      state.deferredPwaPrompt.prompt();
      state.deferredPwaPrompt.userChoice.then(() => {
        state.deferredPwaPrompt = null;
        DOM.installPwaBtn.style.display = 'none';
      });
    }
  });

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW Registration Fail:', err));
  }
});
