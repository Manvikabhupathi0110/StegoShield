function previewFile(type) {
            const input = document.getElementById(`${type}Input`);
            const placeholder = document.getElementById(`${type}Placeholder`);
            if (type === 'cover') {
                const preview = document.getElementById('coverPreview');
                if (input.files[0]) {
                    preview.src = URL.createObjectURL(input.files[0]);
                    preview.classList.remove('hidden');
                    placeholder.classList.add('hidden');
                }
            } else {
                const nameDisplay = document.getElementById('secretName');
                if (input.files[0]) nameDisplay.innerText = input.files[0].name;
            }
        }

        async function encryptData(rawData, password) {
            const encoder = new TextEncoder();
            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            const passwordKey = await window.crypto.subtle.importKey(
                "raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]
            );

            const aesKey = await window.crypto.subtle.deriveKey(
                { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
                passwordKey,
                { name: "AES-GCM", length: 256 },
                false, ["encrypt"]
            );

            const encryptedContent = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, rawData);
            
            const combined = new Uint8Array(16 + 12 + encryptedContent.byteLength);
            combined.set(salt, 0);
            combined.set(iv, 16);
            combined.set(new Uint8Array(encryptedContent), 28);
            return combined;
        }

        async function processEmbedding() {
    const coverInput = document.getElementById('coverInput');
    const secretInput = document.getElementById('secretInput');
    const password = document.getElementById('stegoPass').value;
    const status = document.getElementById('status');

    if (!coverInput.files[0] || !secretInput.files[0] || !password) {
        alert("Please select both files and enter a password!");
        return;
    }

    status.innerHTML = "🔒 <span class='animate-pulse'>Encrypting & Embedding...</span>";
    const btn = document.getElementById('embedBtn');
    btn.disabled = true;

    try {
        // 1. Encrypt the secret file data
        const secretBuffer = await secretInput.files[0].arrayBuffer();
        const encryptedData = await encryptData(new Uint8Array(secretBuffer), password);

        // 2. Prepare the Binary Header
        // Structure: [NameLen (1b)] + [FileName] + [DataLen (4b)] + [EncryptedData]
        const fileName = secretInput.files[0].name;
        const nameBytes = new TextEncoder().encode(fileName);
        
        let dataToHide = new Uint8Array(1 + nameBytes.length + 4 + encryptedData.length);
        let view = new DataView(dataToHide.buffer);

        view.setUint8(0, nameBytes.length); // Offset 0: Filename length
        dataToHide.set(nameBytes, 1);       // Offset 1: Filename bytes
        view.setUint32(1 + nameBytes.length, encryptedData.length); // Next 4 bytes: Encrypted data length
        dataToHide.set(encryptedData, 1 + nameBytes.length + 4);     // Remaining: The actual payload

        // 3. Load the Cover Image
        const img = new Image();
        img.src = URL.createObjectURL(coverInput.files[0]);
        await new Promise(r => img.onload = r);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;

        // 4. Capacity Verification
        const availableBits = (pixels.length / 4) * 3; // RGB channels only
        const requiredBits = dataToHide.length * 8;

        if (requiredBits > availableBits) {
            throw new Error(`File too large! Required: ${(requiredBits/8/1024).toFixed(2)}KB, Available: ${(availableBits/8/1024).toFixed(2)}KB`);
        }

        // 5. LSB Embedding Loop
        let bitIdx = 0;
        const totalBits = requiredBits;
        for (let i = 0; i < pixels.length && bitIdx < totalBits; i++) {
            if ((i + 1) % 4 === 0) continue; // Skip Alpha channel
            
            const byteIdx = Math.floor(bitIdx / 8);
            const bitValue = (dataToHide[byteIdx] >> (7 - (bitIdx % 8))) & 1;
            
            pixels[i] = (pixels[i] & 0xFE) | bitValue; // Modify the Least Significant Bit
            bitIdx++;
        }

        // 6. Output the Stego Image
        ctx.putImageData(imgData, 0, 0);
        const link = document.createElement('a');
        const baseName = coverInput.files[0].name.split('.')[0];
        link.download = `${baseName}_stego.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

        status.innerHTML = "<span class='text-teal-400 font-bold'>✅ Success! Downloaded: " + link.download + "</span>";
    } catch (err) {
        status.innerHTML = `<span class='text-red-400'>❌ Error: ${err.message}</span>`;
    } finally {
        btn.disabled = false;
    }
}
