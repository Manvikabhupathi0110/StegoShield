function previewAudio() {
            const input = document.getElementById('audioInput');
            const preview = document.getElementById('audioPreview');
            const placeholder = document.getElementById('audioPlaceholder');
            if (input.files[0]) {
                preview.src = URL.createObjectURL(input.files[0]);
                preview.classList.remove('hidden');
                placeholder.classList.add('hidden');
            }
        }

        function updateFileInfo() {
            const input = document.getElementById('secretInput');
            const placeholder = document.getElementById('filePlaceholder');
            if (input.files[0]) {
                placeholder.innerHTML = `📄 <span class="text-teal-400 font-bold">${input.files[0].name}</span>`;
            }
        }

        async function encryptData(data, password) {
            const encoder = new TextEncoder();
            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const passwordKey = await window.crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
            const aesKey = await window.crypto.subtle.deriveKey(
                { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
                passwordKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
            );
            const encryptedContent = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, data);
            const combined = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
            combined.set(salt, 0); 
            combined.set(iv, 16); 
            combined.set(new Uint8Array(encryptedContent), 28);
            return combined;
        }

        async function processAudioEmbedding() {
    const audioInput = document.getElementById('audioInput');
    const secretInput = document.getElementById('secretInput');
    const password = document.getElementById('passphrase').value;
    const status = document.getElementById('status');

    if (!audioInput.files[0] || !secretInput.files[0] || !password) {
        alert("Please fill all fields!");
        return;
    }

    status.innerHTML = "🎵 <span class='animate-pulse'>Processing Audio & Embedding Metadata...</span>";

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await audioInput.files[0].arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        let pcmData = audioBuffer.getChannelData(0);
        let intData = new Int16Array(pcmData.length);

        // --- BIT-PERFECT PCM CONVERSION ---
        for (let i = 0; i < pcmData.length; i++) {
            let s = Math.max(-1, Math.min(1, pcmData[i]));
            intData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        const secretBuffer = await secretInput.files[0].arrayBuffer();
        const encryptedData = await encryptData(new Uint8Array(secretBuffer), password);
        
        // --- NEW HEADER LOGIC: Store Name + Extension ---
        // Structure: [NameLen (1b)] + [FileName] + [DataLen (4b)] + [EncryptedPayload]
        const fileName = secretInput.files[0].name;
        const fileNameBytes = new TextEncoder().encode(fileName);
        
        let dataToHide = new Uint8Array(1 + fileNameBytes.length + 4 + encryptedData.length);
        let view = new DataView(dataToHide.buffer);

        // 1. Store Filename Length (1 byte)
        view.setUint8(0, fileNameBytes.length);
        // 2. Store Filename
        dataToHide.set(fileNameBytes, 1);
        // 3. Store Encrypted Data Length (4 bytes)
        view.setUint32(1 + fileNameBytes.length, encryptedData.length);
        // 4. Store the Encrypted Payload
        dataToHide.set(encryptedData, 1 + fileNameBytes.length + 4);
        // -------------------------------------------------

        if (dataToHide.length * 8 > intData.length) {
            throw new Error("Audio too short for this file!");
        }

        // LSB Embedding
        let bitIdx = 0;
        const totalBits = dataToHide.length * 8;
        for (let i = 0; i < intData.length && bitIdx < totalBits; i++) {
            const byteIdx = Math.floor(bitIdx / 8);
            const bitValue = (dataToHide[byteIdx] >> (7 - (bitIdx % 8))) & 1;
            intData[i] = (intData[i] & 0xFFFE) | bitValue;
            bitIdx++;
        }

        const wavBlob = createWavBlob(intData, audioBuffer.sampleRate);
        const url = URL.createObjectURL(wavBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "stego_audio.wav";
        link.click();

        status.innerHTML = "<span class='text-teal-400 font-bold'>✅ Success! Downloaded stego_audio.wav</span>";
    } catch (err) {
        status.innerText = "❌ Error: " + err.message;
    }
}

        function createWavBlob(samples, sampleRate) {
            const buffer = new ArrayBuffer(44 + samples.length * 2);
            const view = new DataView(buffer);
            const writeString = (offset, string) => {
                for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
            };

            writeString(0, 'RIFF');
            view.setUint32(4, 36 + samples.length * 2, true);
            writeString(8, 'WAVE');
            writeString(12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true); // PCM
            view.setUint16(22, 1, true); // Mono
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * 2, true);
            view.setUint16(32, 2, true);
            view.setUint16(34, 16, true);
            writeString(36, 'data');
            view.setUint32(40, samples.length * 2, true);

            for (let i = 0; i < samples.length; i++) {
                view.setInt16(44 + i * 2, samples[i], true);
            }
            return new Blob([view], { type: 'audio/wav' });
        }
