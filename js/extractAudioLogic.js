function previewAudio() {
            const input = document.getElementById('audioInput');
            const preview = document.getElementById('audioPreview');
            const placeholder = document.getElementById('uploadPlaceholder');
            if (input.files[0]) {
                preview.src = URL.createObjectURL(input.files[0]);
                preview.classList.remove('hidden');
                placeholder.classList.add('hidden');
            }
        }

        async function decryptData(combinedData, password) {
            const encoder = new TextEncoder();
            const salt = combinedData.slice(0, 16);
            const iv = combinedData.slice(16, 28);
            const encryptedContent = combinedData.slice(28);

            const passwordKey = await window.crypto.subtle.importKey(
                "raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]
            );

            const aesKey = await window.crypto.subtle.deriveKey(
                { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
                passwordKey, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
            );

            return await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, encryptedContent);
        }


async function processAudioExtraction() {
    const audioInput = document.getElementById('audioInput');
    const password = document.getElementById('stegoPass').value;
    const status = document.getElementById('status');
    const extractBtn = document.getElementById('extractBtn');

    if (!audioInput.files[0] || !password) {
        alert("Please upload the audio and enter the password!");
        return;
    }

    status.innerHTML = "🔍 <span class='animate-pulse'>Scanning Audio Frequencies...</span>";
    extractBtn.disabled = true;

    try {
        const arrayBuffer = await audioInput.files[0].arrayBuffer();
        
        // Skip the 44-byte WAV header to reach raw 16-bit PCM samples
        const intData = new Int16Array(arrayBuffer, 44);

        // 1. Extract ALL possible hidden bytes from the LSBs
        let allBytes = new Uint8Array(Math.floor(intData.length / 8));
        let bitIdx = 0;
        for (let i = 0; i < allBytes.length; i++) {
            let byte = 0;
            for (let bit = 0; bit < 8; bit++) {
                // Read the Least Significant Bit and shift into place
                byte |= ((intData[bitIdx] & 1) << (7 - bit));
                bitIdx++;
            }
            allBytes[i] = byte;
        }

        // 2. Parse the Header
        // Header Structure: [NameLen (1b)][Name][DataLen (4b)][EncryptedData]
        const view = new DataView(allBytes.buffer);
        
        // Get Filename Length
        const nameLen = view.getUint8(0);
        if (nameLen === 0 || nameLen > 255) throw new Error("No valid stego header found.");

        // Get Filename
        const fileName = new TextDecoder().decode(allBytes.slice(1, 1 + nameLen));
        
        // Get Encrypted Data Length
        const dataLen = view.getUint32(1 + nameLen);
        
        // Extract the exact encrypted payload
        const encryptedPart = allBytes.slice(1 + nameLen + 4, 1 + nameLen + 4 + dataLen);

        // 3. Decrypt the Data
        const decryptedBuffer = await decryptData(encryptedPart, password);
        const blob = new Blob([decryptedBuffer]);
        const url = URL.createObjectURL(blob);
        
        // UI Updates
        document.getElementById('extractionMsg').innerHTML = `📄 <span class='text-teal-400 font-bold'>${fileName}</span> recovered!`;
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.classList.remove('hidden');
        
        downloadBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName; // Recovery with original extension
            a.click();
        };

        status.innerHTML = "<span class='text-teal-400 font-bold'>✅ Success! Audio secret decoded.</span>";

    } catch (err) {
        console.error(err);
        status.innerHTML = "<span class='text-red-400 font-bold'>❌ Error: Wrong password or corrupted audio.</span>";
    } finally {
        extractBtn.disabled = false;
    }
}
