/**
 * CryptoBot Dashboard View - Interactive Wallet & Portfolio Manager
 * Handles wallet connections, token tracking, price updates, and sparkline charts
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        API_BASE: 'http://192.168.254.4:3030/api/crypto',
        PRICE_UPDATE_INTERVAL: 30000, // 30 seconds
        SUPPORTED_TOKENS: ['BTC', 'ETH', 'SOL', 'XRP', 'LTC', 'SUI', 'JUP', 'PINKY'],
        PINKY_DISCOUNT_THRESHOLD: 1000
    };

    // State
    const state = {
        connectedWallets: [],
        tokenHoldings: [],
        priceData: {},
        selectedFilter: 'all',
        portfolioValue: 0,
        pinkyBalance: 0
    };

    /**
     * Initialize CryptoBot view
     */
    function initCryptoBot() {
        console.log('[CryptoBot] Initializing dashboard view...');
        
        // Set up event listeners
        setupEventListeners();
        
        // Load saved state from localStorage
        loadSavedState();
        
        // Fetch initial data
        fetchWallets();
        fetchTokenPrices();
        
        // Start price update interval
        setInterval(fetchTokenPrices, CONFIG.PRICE_UPDATE_INTERVAL);
        
        // Render initial UI
        renderPortfolioCards();
        renderWalletsList();
        renderTokenHoldings();
        updatePriceTicker();
        
        console.log('[CryptoBot] Dashboard initialized successfully');
    }

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Connect wallet buttons
        document.querySelectorAll('.btn-connect-wallet, .btn-connect-wallet-primary').forEach(btn => {
            btn.addEventListener('click', openWalletModal);
        });
        
        // Manage wallets button
        const manageBtn = document.querySelector('.btn-manage-wallets');
        if (manageBtn) {
            manageBtn.addEventListener('click', openWalletModal);
        }
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                setFilter(filter);
            });
        });
        
        // Modal close
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', closeWalletModal);
        }
        
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', closeWalletModal);
        }
        
        // Wallet options
        document.querySelectorAll('.wallet-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const walletType = e.currentTarget.dataset.wallet;
                connectWallet(walletType);
            });
        });
    }

    /**
     * Load saved state from localStorage
     */
    function loadSavedState() {
        const savedWallets = localStorage.getItem('cryptobot_wallets');
        if (savedWallets) {
            try {
                state.connectedWallets = JSON.parse(savedWallets);
                console.log('[CryptoBot] Loaded saved wallets:', state.connectedWallets.length);
            } catch (e) {
                console.error('[CryptoBot] Failed to parse saved wallets:', e);
            }
        }
        
        const savedHoldings = localStorage.getItem('cryptobot_holdings');
        if (savedHoldings) {
            try {
                state.tokenHoldings = JSON.parse(savedHoldings);
                console.log('[CryptoBot] Loaded saved holdings:', state.tokenHoldings.length);
            } catch (e) {
                console.error('[CryptoBot] Failed to parse saved holdings:', e);
            }
        }
    }

    /**
     * Save state to localStorage
     */
    function saveState() {
        localStorage.setItem('cryptobot_wallets', JSON.stringify(state.connectedWallets));
        localStorage.setItem('cryptobot_holdings', JSON.stringify(state.tokenHoldings));
    }

    /**
     * Fetch connected wallets from API
     */
    async function fetchWallets() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/wallets`);
            if (!response.ok) throw new Error('API not available');
            
            const data = await response.json();
            if (data.success && data.wallets) {
                state.connectedWallets = data.wallets;
                saveState();
                renderWalletsList();
            }
        } catch (error) {
            console.warn('[CryptoBot] Failed to fetch wallets from API, using local state:', error);
        }
    }

    /**
     * Fetch token prices from API
     */
    async function fetchTokenPrices() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/prices?tokens=${CONFIG.SUPPORTED_TOKENS.join(',')}`);
            if (!response.ok) throw new Error('API not available');
            
            const data = await response.json();
            if (data.success && data.prices) {
                state.priceData = data.prices;
                updatePriceTicker();
                calculatePortfolioValue();
                renderPortfolioCards();
            }
        } catch (error) {
            console.warn('[CryptoBot] Failed to fetch prices from API:', error);
            // Use mock data for demo
            useMockPrices();
        }
    }

    /**
     * Use mock price data for demo purposes
     */
    function useMockPrices() {
        state.priceData = {
            BTC: { price: 43250.50, change24h: 2.34, change7d: 5.12 },
            ETH: { price: 2305.75, change24h: -0.87, change7d: 3.45 },
            SOL: { price: 98.42, change24h: 4.21, change7d: 12.30 },
            XRP: { price: 0.54, change24h: 1.15, change7d: -2.10 },
            LTC: { price: 72.10, change24h: 0.95, change7d: 1.80 },
            SUI: { price: 1.23, change24h: 3.50, change7d: 8.20 },
            JUP: { price: 0.87, change24h: 5.60, change7d: 15.40 },
            PINKY: { price: 0.0042, change24h: 12.50, change7d: 45.20 }
        };
        updatePriceTicker();
    }

    /**
     * Calculate total portfolio value
     */
    function calculatePortfolioValue() {
        let totalValue = 0;
        let totalChange24h = 0;
        
        state.tokenHoldings.forEach(holding => {
            const priceInfo = state.priceData[holding.symbol];
            if (priceInfo) {
                const value = holding.amount * priceInfo.price;
                totalValue += value;
                totalChange24h += value * (priceInfo.change24h / 100);
            }
        });
        
        state.portfolioValue = totalValue;
        state.portfolio24hChange = totalChange24h;
        
        // Update PINKY balance
        const pinkyHolding = state.tokenHoldings.find(h => h.symbol === 'PINKY');
        state.pinkyBalance = pinkyHolding ? pinkyHolding.amount : 0;
    }

    /**
     * Render portfolio summary cards
     */
    function renderPortfolioCards() {
        // Portfolio value
        const portfolioValueEl = document.querySelector('.portfolio-value');
        if (portfolioValueEl) {
            portfolioValueEl.textContent = `$${state.portfolioValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }
        
        // 24h change
        const change24hEl = document.querySelector('.change-24h');
        if (change24hEl) {
            const changePercent = state.portfolioValue > 0 
                ? (state.portfolio24hChange / state.portfolioValue) * 100 
                : 0;
            const sign = changePercent >= 0 ? '+' : '';
            change24hEl.textContent = `${sign}${changePercent.toFixed(2)}% (24h)`;
            change24hEl.className = changePercent >= 0 ? 'change-24h positive' : 'change-24h negative';
        }
        
        // Wallet count
        const walletCountEl = document.querySelector('.wallet-count');
        if (walletCountEl) {
            walletCountEl.textContent = state.connectedWallets.length;
        }
        
        // PINKY balance
        const pinkyBalanceEl = document.querySelector('.pinky-balance');
        if (pinkyBalanceEl) {
            pinkyBalanceEl.textContent = state.pinkyBalance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        
        // Discount status
        const discountStatusEl = document.querySelector('.discount-status');
        if (discountStatusEl) {
            if (state.pinkyBalance >= CONFIG.PINKY_DISCOUNT_THRESHOLD) {
                discountStatusEl.textContent = '20% discount active! 🎉';
                discountStatusEl.classList.add('active');
            } else {
                const needed = CONFIG.PINKY_DISCOUNT_THRESHOLD - state.pinkyBalance;
                discountStatusEl.textContent = `${needed.toFixed(0)} more for 20% off`;
                discountStatusEl.classList.remove('active');
            }
        }
        
        // P&L
        const profitLossEl = document.querySelector('.profit-loss');
        if (profitLossEl) {
            const sign = state.portfolio24hChange >= 0 ? '+' : '';
            profitLossEl.textContent = `${sign}$${Math.abs(state.portfolio24hChange).toFixed(2)}`;
            profitLossEl.className = state.portfolio24hChange >= 0 ? 'profit-loss positive' : 'profit-loss negative';
        }
        
        const plPercentEl = document.querySelector('.pl-percentage');
        if (plPercentEl) {
            const changePercent = state.portfolioValue > 0 
                ? (state.portfolio24hChange / state.portfolioValue) * 100 
                : 0;
            const sign = changePercent >= 0 ? '+' : '';
            plPercentEl.textContent = `${sign}${changePercent.toFixed(2)}%`;
        }
    }

    /**
     * Render connected wallets list
     */
    function renderWalletsList() {
        const walletsList = document.querySelector('.wallets-list');
        if (!walletsList) return;
        
        if (state.connectedWallets.length === 0) {
            // Show empty state (already in HTML)
            return;
        }
        
        // TODO: Render actual wallet cards when wallets are connected
        console.log('[CryptoBot] Would render', state.connectedWallets.length, 'wallets');
    }

    /**
     * Render token holdings list with sparklines
     */
    function renderTokenHoldings() {
        const holdingsList = document.querySelector('.holdings-list');
        if (!holdingsList) return;
        
        // TODO: Filter based on state.selectedFilter
        // TODO: Generate sparkline charts using canvas
        // For now, the sample token row is visible as placeholder
        
        console.log('[CryptoBot] Token holdings rendered with', state.tokenHoldings.length, 'tokens');
    }

    /**
     * Update price ticker at bottom
     */
    function updatePriceTicker() {
        const tickerScroll = document.querySelector('.ticker-scroll');
        if (!tickerScroll) return;
        
        tickerScroll.innerHTML = '';
        
        CONFIG.SUPPORTED_TOKENS.forEach(symbol => {
            const priceInfo = state.priceData[symbol];
            if (!priceInfo) return;
            
            const tickerItem = document.createElement('div');
            tickerItem.className = 'ticker-item';
            
            const changeClass = priceInfo.change24h >= 0 ? 'positive' : 'negative';
            const sign = priceInfo.change24h >= 0 ? '+' : '';
            
            tickerItem.innerHTML = `
                <span class="ticker-symbol">${symbol}</span>
                <span class="ticker-price">$${priceInfo.price.toFixed(symbol === 'PINKY' ? 4 : 2)}</span>
                <span class="ticker-change ${changeClass}">${sign}${priceInfo.change24h.toFixed(2)}%</span>
            `;
            
            tickerScroll.appendChild(tickerItem);
        });
    }

    /**
     * Set holdings filter
     */
    function setFilter(filter) {
        state.selectedFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        // Re-render holdings
        renderTokenHoldings();
    }

    /**
     * Open wallet connection modal
     */
    function openWalletModal() {
        const modal = document.querySelector('.wallet-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    /**
     * Close wallet connection modal
     */
    function closeWalletModal() {
        const modal = document.querySelector('.wallet-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Connect to a specific wallet type
     */
    async function connectWallet(walletType) {
        console.log('[CryptoBot] Connecting to wallet:', walletType);
        
        try {
            switch (walletType) {
                case 'phantom':
                    await connectPhantom();
                    break;
                case 'metamask':
                    await connectMetaMask();
                    break;
                case 'solflare':
                    await connectSolflare();
                    break;
                case 'walletconnect':
                    await connectWalletConnect();
                    break;
                case 'coinbase':
                    await connectCoinbaseWallet();
                    break;
                case 'readonly':
                    await connectReadOnly();
                    break;
                default:
                    throw new Error('Unknown wallet type');
            }
            
            closeWalletModal();
            fetchWallets();
        } catch (error) {
            console.error('[CryptoBot] Wallet connection failed:', error);
            alert(`Failed to connect to ${walletType}: ${error.message}`);
        }
    }

    /**
     * Connect Phantom wallet (Solana)
     */
    async function connectPhantom() {
        if (!window.solana || !window.solana.isPhantom) {
            throw new Error('Phantom wallet not installed. Please install from phantom.app');
        }
        
        const response = await window.solana.connect();
        const publicKey = response.publicKey.toString();
        
        console.log('[CryptoBot] Phantom connected:', publicKey);
        
        // Save to API
        await saveWallet({
            type: 'phantom',
            address: publicKey,
            chain: 'solana',
            name: 'Phantom Wallet'
        });
    }

    /**
     * Connect MetaMask wallet (Ethereum/EVM)
     */
    async function connectMetaMask() {
        if (!window.ethereum) {
            throw new Error('MetaMask not installed. Please install from metamask.io');
        }
        
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        
        console.log('[CryptoBot] MetaMask connected:', address);
        
        // Save to API
        await saveWallet({
            type: 'metamask',
            address: address,
            chain: 'ethereum',
            name: 'MetaMask Wallet'
        });
    }

    /**
     * Connect Solflare wallet (Solana)
     */
    async function connectSolflare() {
        if (!window.solflare) {
            throw new Error('Solflare wallet not installed. Please install from solflare.com');
        }
        
        await window.solflare.connect();
        const publicKey = window.solflare.publicKey.toString();
        
        console.log('[CryptoBot] Solflare connected:', publicKey);
        
        await saveWallet({
            type: 'solflare',
            address: publicKey,
            chain: 'solana',
            name: 'Solflare Wallet'
        });
    }

    /**
     * Connect via WalletConnect
     */
    async function connectWalletConnect() {
        alert('WalletConnect integration coming soon! Check back in Phase 2.');
        throw new Error('Not implemented yet');
    }

    /**
     * Connect Coinbase Wallet
     */
    async function connectCoinbaseWallet() {
        alert('Coinbase Wallet integration coming soon! Check back in Phase 2.');
        throw new Error('Not implemented yet');
    }

    /**
     * Connect in read-only mode (enter address manually)
     */
    async function connectReadOnly() {
        const address = prompt('Enter wallet address to track (read-only mode):');
        if (!address) return;
        
        // Detect chain from address format
        let chain = 'unknown';
        if (address.length === 42 && address.startsWith('0x')) {
            chain = 'ethereum';
        } else if (address.length === 44) {
            chain = 'solana';
        }
        
        await saveWallet({
            type: 'readonly',
            address: address,
            chain: chain,
            name: 'Read-Only Wallet'
        });
    }

    /**
     * Save wallet to API
     */
    async function saveWallet(walletData) {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/wallets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(walletData)
            });
            
            if (!response.ok) throw new Error('API save failed');
            
            const data = await response.json();
            console.log('[CryptoBot] Wallet saved:', data);
            
            // Update local state
            state.connectedWallets.push(walletData);
            saveState();
            renderWalletsList();
            
        } catch (error) {
            console.warn('[CryptoBot] Failed to save wallet to API, saving locally:', error);
            // Fallback: save to localStorage only
            state.connectedWallets.push(walletData);
            saveState();
            renderWalletsList();
        }
    }

    /**
     * Draw sparkline chart on canvas
     */
    function drawSparkline(canvas, dataPoints) {
        if (!canvas || !dataPoints || dataPoints.length === 0) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Find min/max for scaling
        const min = Math.min(...dataPoints);
        const max = Math.max(...dataPoints);
        const range = max - min || 1;
        
        // Determine color based on trend
        const firstPoint = dataPoints[0];
        const lastPoint = dataPoints[dataPoints.length - 1];
        const isPositive = lastPoint >= firstPoint;
        ctx.strokeStyle = isPositive ? '#10b981' : '#ef4444';
        ctx.lineWidth = 2;
        
        // Draw line
        ctx.beginPath();
        dataPoints.forEach((point, index) => {
            const x = (index / (dataPoints.length - 1)) * width;
            const y = height - ((point - min) / range) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCryptoBot);
    } else {
        initCryptoBot();
    }

    // Export for external use
    window.cryptoBot = {
        init: initCryptoBot,
        fetchWallets,
        fetchTokenPrices,
        connectWallet,
        state
    };

})();
