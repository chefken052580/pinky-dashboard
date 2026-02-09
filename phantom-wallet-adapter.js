/**
 * Phantom Wallet Adapter for CryptoBot
 * Solana wallet integration with @solana/wallet-adapter
 * Features: Connect, sign message auth, read SOL + SPL token balances
 */

(function() {
    'use strict';

    const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
    const PINKY_TOKEN_MINT = 'YOUR_PINKY_TOKEN_MINT_ADDRESS_HERE'; // TODO: Replace with actual mint

    class PhantomWalletAdapter {
        constructor() {
            this.wallet = null;
            this.publicKey = null;
            this.connection = null;
            this.isConnected = false;
            this.callbacks = {
                onConnect: [],
                onDisconnect: [],
                onBalanceChange: []
            };
        }

        /**
         * Initialize Solana connection
         */
        init() {
            console.log('[Phantom] Initializing Solana RPC connection...');
            this.connection = new solanaWeb3.Connection(SOLANA_RPC, 'confirmed');
        }

        /**
         * Check if Phantom wallet is installed
         */
        isPhantomInstalled() {
            return window.solana && window.solana.isPhantom;
        }

        /**
         * Connect to Phantom wallet
         */
        async connect() {
            if (!this.isPhantomInstalled()) {
                throw new Error('Phantom wallet not installed. Please install from phantom.app');
            }

            try {
                console.log('[Phantom] Requesting wallet connection...');
                
                // Connect to Phantom
                const response = await window.solana.connect();
                this.publicKey = response.publicKey.toString();
                this.wallet = window.solana;
                this.isConnected = true;

                console.log('[Phantom] Connected to wallet:', this.publicKey);

                // Sign message for authentication
                const authSignature = await this.signAuthMessage();

                // Fetch balances
                const balances = await this.fetchBalances();

                // Store wallet data
                await this.storeWalletData({
                    address: this.publicKey,
                    authSignature: authSignature,
                    balances: balances,
                    timestamp: Date.now()
                });

                // Trigger callbacks
                this.triggerCallbacks('onConnect', {
                    address: this.publicKey,
                    balances: balances
                });

                return {
                    address: this.publicKey,
                    balances: balances,
                    authSignature: authSignature
                };

            } catch (error) {
                console.error('[Phantom] Connection failed:', error);
                throw new Error(`Failed to connect: ${error.message}`);
            }
        }

        /**
         * Sign authentication message
         */
        async signAuthMessage() {
            const message = `Sign this message to authenticate with PinkyBot Dashboard.\n\nTimestamp: ${Date.now()}\nWallet: ${this.publicKey}`;
            const encodedMessage = new TextEncoder().encode(message);

            try {
                const signedMessage = await window.solana.signMessage(encodedMessage, 'utf8');
                const signature = Buffer.from(signedMessage.signature).toString('hex');
                
                console.log('[Phantom] Auth message signed successfully');
                return signature;

            } catch (error) {
                console.error('[Phantom] Failed to sign auth message:', error);
                throw new Error('User rejected signature request');
            }
        }

        /**
         * Fetch SOL and SPL token balances
         */
        async fetchBalances() {
            if (!this.connection || !this.publicKey) {
                throw new Error('Wallet not connected');
            }

            try {
                console.log('[Phantom] Fetching balances...');

                // Fetch SOL balance
                const publicKeyObj = new solanaWeb3.PublicKey(this.publicKey);
                const solBalance = await this.connection.getBalance(publicKeyObj);
                const solBalanceFormatted = solBalance / solanaWeb3.LAMPORTS_PER_SOL;

                console.log('[Phantom] SOL balance:', solBalanceFormatted);

                // Fetch SPL token accounts
                const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
                    publicKeyObj,
                    { programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
                );

                const splBalances = [];
                let pinkyBalance = 0;

                for (const accountInfo of tokenAccounts.value) {
                    const tokenData = accountInfo.account.data.parsed.info;
                    const mint = tokenData.mint;
                    const amount = tokenData.tokenAmount.uiAmount;

                    splBalances.push({
                        mint: mint,
                        amount: amount,
                        decimals: tokenData.tokenAmount.decimals
                    });

                    // Check for PINKY token
                    if (mint === PINKY_TOKEN_MINT) {
                        pinkyBalance = amount;
                        console.log('[Phantom] PINKY token balance:', pinkyBalance);
                    }
                }

                const balances = {
                    SOL: solBalanceFormatted,
                    PINKY: pinkyBalance,
                    tokens: splBalances,
                    timestamp: Date.now()
                };

                // Trigger balance change callbacks
                this.triggerCallbacks('onBalanceChange', balances);

                return balances;

            } catch (error) {
                console.error('[Phantom] Failed to fetch balances:', error);
                throw new Error(`Failed to fetch balances: ${error.message}`);
            }
        }

        /**
         * Store wallet data to backend
         */
        async storeWalletData(walletData) {
            try {
                const response = await fetch('http://192.168.254.4:3030/api/crypto/wallets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: 'phantom',
                        chain: 'solana',
                        address: walletData.address,
                        authSignature: walletData.authSignature,
                        balances: walletData.balances,
                        connectedAt: walletData.timestamp
                    })
                });

                if (!response.ok) {
                    console.warn('[Phantom] Failed to save wallet to backend, storing locally');
                    // Fallback to localStorage
                    this.storeWalletLocally(walletData);
                    return;
                }

                const data = await response.json();
                console.log('[Phantom] Wallet data saved to backend:', data);

            } catch (error) {
                console.warn('[Phantom] Backend unavailable, storing locally:', error);
                this.storeWalletLocally(walletData);
            }
        }

        /**
         * Store wallet data locally (fallback)
         */
        storeWalletLocally(walletData) {
            const existingWallets = JSON.parse(localStorage.getItem('crypto_wallets') || '[]');
            
            // Remove any existing Phantom wallet
            const filtered = existingWallets.filter(w => w.type !== 'phantom');
            
            // Add new wallet data
            filtered.push({
                type: 'phantom',
                chain: 'solana',
                address: walletData.address,
                balances: walletData.balances,
                connectedAt: walletData.timestamp
            });

            localStorage.setItem('crypto_wallets', JSON.stringify(filtered));
            console.log('[Phantom] Wallet data stored locally');
        }

        /**
         * Disconnect wallet
         */
        async disconnect() {
            if (!this.isConnected) {
                return;
            }

            try {
                await window.solana.disconnect();
                
                this.wallet = null;
                this.publicKey = null;
                this.isConnected = false;

                console.log('[Phantom] Wallet disconnected');

                // Trigger callbacks
                this.triggerCallbacks('onDisconnect', {});

            } catch (error) {
                console.error('[Phantom] Failed to disconnect:', error);
            }
        }

        /**
         * Refresh balances
         */
        async refreshBalances() {
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }

            return await this.fetchBalances();
        }

        /**
         * Register callback
         */
        on(event, callback) {
            if (this.callbacks[event]) {
                this.callbacks[event].push(callback);
            }
        }

        /**
         * Trigger callbacks for event
         */
        triggerCallbacks(event, data) {
            if (this.callbacks[event]) {
                this.callbacks[event].forEach(cb => cb(data));
            }
        }

        /**
         * Get current wallet data
         */
        getWalletData() {
            return {
                address: this.publicKey,
                isConnected: this.isConnected,
                type: 'phantom',
                chain: 'solana'
            };
        }
    }

    // Auto-initialize
    const phantomAdapter = new PhantomWalletAdapter();
    phantomAdapter.init();

    // Export globally
    window.PhantomWalletAdapter = PhantomWalletAdapter;
    window.phantomAdapter = phantomAdapter;

    console.log('[Phantom] Wallet adapter loaded and ready');

})();
