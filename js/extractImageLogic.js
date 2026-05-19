function previewStego() {
            const input = document.getElementById('stegoInput');
            const preview = document.getElementById('uploadPreview');
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
                passwordKey,
                { name: "AES-GCM", length: 256 },
                false, ["decrypt"]
            );

            return await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, encryptedContent);
        }

        async function processExtraction() {
    const stegoInput = document.getElementById('stegoInput');
    const password = document.getElementById('stegoPass').value;
    const status = document.getElementById('status');
    const extractBtn = document.getElementById('extractBtn');

    if (!stegoInput.files[0] || !password) {
        alert("Please upload the stego image and enter the password!");
        return;
    }

    status.innerHTML = "🔍 <span class='animate-pulse text-teal-400'>Analyzing bit layers...</span>";
    extractBtn.disabled = true;

    try {
        // 1. Load the stego image into a canvas
        const img = new Image();
        img.src = URL.createObjectURL(stegoInput.files[0]);
        await new Promise(r => img.onload = r);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        // 2. Extract raw bits from the LSB of RGB channels
        let allBits = [];
        for (let i = 0; i < pixels.length; i++) {
            if ((i + 1) % 4 === 0) continue; // Skip Alpha channel
            allBits.push(pixels[i] & 1);
        }

        // Helper function to convert bits to bytes
        const getBytes = (startBit, byteCount) => {
            let bytes = new Uint8Array(byteCount);
            for (let i = 0; i < byteCount; i++) {
                let byte = 0;
                for (let bit = 0; bit < 8; bit++) {
                    byte |= (allBits[startBit + (i * 8) + bit] << (7 - bit));
                }
                bytes[i] = byte;
            }
            return bytes;
        };

        // 3. Parse the Standardized Header
        // Header: [NameLen (1b)] + [FileName] + [DataLen (4b)] + [EncryptedData]
        
        // Get Filename Length (1 byte = 8 bits)
        const nameLen = getBytes(0, 1)[0];
        let currentBitPos = 8;

        // Get Filename
        const fileNameBytes = getBytes(currentBitPos, nameLen);
        const fileName = new TextDecoder().decode(fileNameBytes);
        currentBitPos += (nameLen * 8);

        // Get Data Length (4 bytes = 32 bits)
        const dataLenBytes = getBytes(currentBitPos, 4);
        const dataLen = new DataView(dataLenBytes.buffer).getUint32(0);
        currentBitPos += 32;

        // Get Encrypted Payload
        const encryptedBytes = getBytes(currentBitPos, dataLen);

        // 4. Decrypt the Payload
        status.innerHTML = "🔓 <span class='animate-pulse text-blue-400'>Decrypting data...</span>";
        const decryptedBuffer = await decryptData(encryptedBytes, password);
        
        const blob = new Blob([decryptedBuffer]);
        const url = URL.createObjectURL(blob);
        
        const secretPreview = document.getElementById('secretPreview');
        const secretPlaceholder = document.getElementById('secretPlaceholder');
        const extractionMsg = document.getElementById('extractionMsg');
        const downloadBtn = document.getElementById('downloadBtn');

        // 5. Update UI with the recovered filename
        extractionMsg.innerHTML = `📄 Found: <span class='text-teal-400 font-bold'>${fileName}</span>`;
        
        // Attempt image preview if it's an image
        const testImg = new Image();
        testImg.onload = () => {
            secretPreview.src = url;
            secretPreview.classList.remove('hidden');
            secretPlaceholder.classList.add('hidden');
        };
        testImg.onerror = () => {
            secretPreview.classList.add('hidden');
            secretPlaceholder.classList.remove('hidden');
        };
        testImg.src = url;

        downloadBtn.classList.remove('hidden');
        downloadBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName; // RESTORES ORIGINAL FILENAME AND EXTENSION
            a.click();
        };

        status.innerHTML = "<span class='text-teal-400 font-bold text-lg'>✅ Successfully extracted!</span>";

    } catch (err) {
        console.error(err);
        status.innerHTML = "<span class='text-red-400 font-bold'>❌ Error: Decryption Failed (Check Password)</span>";
    } finally {
        extractBtn.disabled = false;
    }
}
