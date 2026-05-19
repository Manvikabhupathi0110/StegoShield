let currentMode = null;

function setMode(mode) {
    currentMode = mode;
    
    const embedBtn = document.getElementById('headerEmbed');
    const extractBtn = document.getElementById('headerExtract');
    const tabSection = document.getElementById('tabSection');
    const statusMsg = document.getElementById('statusMessage');

    // Toggle button styles
    if (mode === 'embed') {
        embedBtn.classList.add('btn-gradient-fill');
        extractBtn.classList.remove('btn-gradient-fill');
        statusMsg.innerText = "Mode: EMBED - Choose a file type to hide your data.";
    } else {
        extractBtn.classList.add('btn-gradient-fill');
        embedBtn.classList.remove('btn-gradient-fill');
        statusMsg.innerText = "Mode: EXTRACT - Choose the file type you want to decode.";
    }

    // UNLOCK the cards
    tabSection.classList.remove('opacity-40', 'pointer-events-none');
    tabSection.classList.add('scale-100');
}

function handleTabClick(type) {
    // Only allow clicking if a mode has been selected first
    if (!currentMode) {
        alert("Please select EMBED or EXTRACT mode first!");
        return;
    }

    if (type === 'image') {
        if (currentMode === 'extract') {
            window.location.href = 'extractimage.html';
        } else {
            window.location.href = 'image.html';
        }
    }
    else if (type === 'video') {
        if (currentMode === 'extract') {
            // Redirect to your video extraction page
            window.location.href = 'extractvideo.html'; 
        } else {
            // Redirect to your video embedding page
            window.location.href = 'video.html';
        }
    }
    else if (type === 'audio') {
        if (currentMode === 'extract') {
            // Redirect to your video extraction page
            window.location.href = 'extractaudio.html'; 
        } else {
            // Redirect to your video embedding page
            window.location.href = 'audio.html';
        }
    }
    else if (type === 'document') {
        window.location.href = (currentMode === 'extract') ? 'extractdocument.html' : 'document.html';
    }
}

// Initializing the buttons
document.getElementById('headerEmbed').onclick = () => setMode('embed');
document.getElementById('headerExtract').onclick = () => setMode('extract');
