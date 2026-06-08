// ==========================================================================
// RikFinTech-Pro - Hybrid Cloud & Local Server Hashing Sync Engine
// ==========================================================================

class MicroTransaction {
    constructor(index, sender, receiver, amount, previousHash = '', timestamp = null) {
        this.index = index;
        this.timestamp = timestamp || new Date().toISOString();
        this.sender = sender;
        this.receiver = receiver;
        this.amount = amount;
        this.previousHash = previousHash;
        this.hash = '';
    }

    async calculateHash() {
        const dataString = this.index + this.timestamp + this.sender + this.receiver + this.amount + this.previousHash;
        const msgUint8 = new TextEncoder().encode(dataString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        this.hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return this.hash;
    }
}

class CommunityLedger {
    constructor() {
        this.chain = [];
        // Detect environment: Check if running locally on Python server or live on GitHub Pages
        this.isLocalServer = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
        this.initLedger();
    }

    async initLedger() {
        if (this.isLocalServer) {
            try {
                const response = await fetch('/load-ledger');
                if (response.ok) {
                    const rawChain = await response.json();
                    if (rawChain.length > 0) {
                        this.chain = rawChain.map(b => new MicroTransaction(b.index, b.sender, b.receiver, b.amount, b.previousHash, b.timestamp));
                        for (let block of this.chain) { await block.calculateHash(); }
                    } else { await this.createGenesisBlock(); }
                } else { await this.createGenesisBlock(); }
            } catch (error) {
                await this.createGenesisBlock();
            }
        } else {
            // Cloud Fallback Mode: Process data safely in browser engine storage profiles
            const savedChain = localStorage.getItem('rik_fintech_ledger');
            if (savedChain) {
                const rawChain = JSON.parse(savedChain);
                this.chain = rawChain.map(b => new MicroTransaction(b.index, b.sender, b.receiver, b.amount, b.previousHash, b.timestamp));
                for (let block of this.chain) { await block.calculateHash(); }
            } else {
                await this.createGenesisBlock();
                this.saveToCloudFallback();
            }
        }
        this.renderAllLocalBlocks();
    }

    async createGenesisBlock() {
        const genesisBlock = new MicroTransaction(0, "System Initialization", "Genesis Secure Pool", 0, "0");
        await genesisBlock.calculateHash();
        this.chain.push(genesisBlock);
    }

    async addTransaction(sender, receiver, amount) {
        const previousBlock = this.chain[this.chain.length - 1];
        const newBlock = new MicroTransaction(this.chain.length, sender, receiver, amount, previousBlock.hash);
        await newBlock.calculateHash();
        this.chain.push(newBlock);

        if (this.isLocalServer) {
            await this.streamBlockToServer(newBlock);
        } else {
            this.saveToCloudFallback();
        }
        return newBlock;
    }

    saveToCloudFallback() {
        localStorage.setItem('rik_fintech_ledger', JSON.stringify(this.chain));
    }

    async streamBlockToServer(block) {
        try {
            await fetch('/append-block', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(block)
            });
        } catch (e) {
            console.error("Local disk stream error:", e);
        }
    }

    async validateLedger() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];
            const reCalculatedHash = await currentBlock.calculateHash();
            if (currentBlock.hash !== reCalculatedHash) return false;
            if (currentBlock.previousHash !== previousBlock.hash) return false;
        }
        return true;
    }

    async renderAllLocalBlocks() {
        const logDiv = document.getElementById('ledger-log');
        if (!logDiv) return;
        const isValid = await this.validateLedger();
        
        logDiv.innerHTML = this.isLocalServer 
            ? "<b>Continuous Local Disk Records Linked:</b>" 
            : "<b>Cloud Sandbox Sandbox Mode Active (Browser Memory Linked):</b>";
            
        this.chain.forEach(block => {
            logDiv.innerHTML += `<br>[Block #${block.index}] ${block.sender} ➔ ${block.receiver}: ₹${block.amount.toLocaleString('en-IN')} | Signature: ${block.hash.substring(0,16)}`;
        });
    }
}

const RikLedger = new CommunityLedger();

