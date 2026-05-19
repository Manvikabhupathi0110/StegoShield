const MARKER = "STEGO_SHIELD_V1";

        // Helper to update text labels when files are picked
        function updateFileInfo(type) {
            const input = document.getElementById(`${type}Input`);
            const nameDisplay = document.getElementById(`${type}Name`);
            const placeholder = document.getElementById(`${type}Placeholder`);
            
            if (input.files[0]) {
                placeholder.classList.add('hidden');
                nameDisplay.innerText = `📄 ${input.files[0].name}`;
            }
        }

        async function processUniversal() {
    const carrierFile = document.getElementById('carrierInput').files[0];
    const secretFile = document.getElementById('secretInput').files[0];
    const password = document.getElementById('password').value;
    const status = document.getElementById('status');

    if (!carrierFile || !secretFile || !password) { 
        alert("Please select both files and enter a password!"); 
        return; 
    }
    
    status.innerHTML = "🔐 <span class='animate-pulse'>Encrypting & Cloaking...</span>";

    try {
        const carrierBuf = await carrierFile.arrayBuffer();
        const secretBuf = await secretFile.arrayBuffer();
        
        // 1. Encrypt the secret file
        const encrypted = await encryptData(new Uint8Array(secretBuf), password);
        
        const markerBytes = new TextEncoder().encode(MARKER);
        const nameBytes = new TextEncoder().encode(secretFile.name); // Stores "secret.pdf"
        
        // 2. Create Header: 1 byte (NameLen) + 4 bytes (DataLen)
        const header = new ArrayBuffer(5);
        const headerView = new DataView(header);
        headerView.setUint8(0, nameBytes.length);
        headerView.setUint32(1, encrypted.length);

        // 3. Construct the "Cloaked" file structure
        // [Carrier] + [MARKER] + [Header] + [Original FileName] + [Encrypted Data]
        const finalBlob = new Blob([
            carrierBuf, 
            markerBytes, 
            header, 
            nameBytes, 
            encrypted
        ], { type: carrierFile.type });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(finalBlob);
        link.download = "cloaked_" + carrierFile.name;
        link.click();
        
        status.innerHTML = "<span class='text-teal-400 font-bold'>✅ Successfully cloaked!</span>";
    } catch (e) { 
        status.innerHTML = "❌ Error: " + e.message; 
    }
}

        async function encryptData(data, password) {
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
            const key = await crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:100000,hash:"SHA-256"}, keyMaterial, {name:"AES-GCM",length:256}, false, ["encrypt"]);
            const encrypted = await crypto.subtle.encrypt({name:"AES-GCM",iv}, key, data);
            const res = new Uint8Array(16+12+encrypted.byteLength);
            res.set(salt,0); res.set(iv,16); res.set(new Uint8Array(encrypted),28);
            return res;
        }
