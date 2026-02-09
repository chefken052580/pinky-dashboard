/**
 * Wallet Connect Integration for PinkyBot Dashboard
 * Adds "Connect Wallet" button to pricing section and applies 20% PINKY discount
 */

(function() {
  'use strict';
  
  // Check if wallet is already connected
  function checkWalletStatus() {
    const discount = localStorage.getItem('pinky_token_discount');
    const balance = localStorage.getItem('pinky_token_balance');
    
    if (discount === 'true') {
      return {
        connected: true,
        balance: parseInt(balance) || 0,
        discount: 0.20
      };
    }
    
    return { connected: false, balance: 0, discount: 0 };
  }
  
  // Apply discount to pricing display
  function applyDiscountToPricing() {
    const status = checkWalletStatus();
    
    if (!status.connected) return;
    
    // Find Pro tier price element
    const priceElements = document.querySelectorAll('.price');
    priceElements.forEach(el => {
      const originalPrice = parseInt(el.textContent.replace(/[^0-9]/g, ''));
      if (originalPrice > 0) {
        const discountedPrice = Math.floor(originalPrice * (1 - status.discount));
        el.innerHTML = `<strike>$${originalPrice}</strike> <span style="color:#10b981">$${discountedPrice}</span>`;
      }
    });
    
    // Show discount badge
    const badge = document.createElement('div');
    badge.className = 'discount-badge';
    badge.style.cssText = 'background:#10b981;color:white;padding:8px 16px;border-radius:20px;margin:10px 0;font-weight:bold;';
    badge.textContent = `🎉 20% PINKY Holder Discount Active`;
    
    const pricingSection = document.querySelector('.pricing-section');
    if (pricingSection) {
      pricingSection.insertBefore(badge, pricingSection.firstChild);
    }
  }
  
  // Add "Connect Wallet" button to dashboard
  function addWalletButton() {
    const status = checkWalletStatus();
    
    const button = document.createElement('button');
    button.id = 'wallet-connect-btn';
    button.style.cssText = 'background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-weight:bold;margin:10px;';
    
    if (status.connected) {
      button.textContent = `✅ ${status.balance.toLocaleString()} PINKY`;
      button.onclick = () => window.open('/wallet-connect.html', '_blank');
    } else {
      button.textContent = '🔐 Connect Wallet for 20% OFF';
      button.onclick = () => window.open('/wallet-connect.html', '_blank');
    }
    
    // Add to top navigation or settings
    const nav = document.querySelector('nav') || document.querySelector('.top-bar');
    if (nav) {
      nav.appendChild(button);
    }
  }
  
  // Initialize on page load
  window.addEventListener('DOMContentLoaded', () => {
    addWalletButton();
    applyDiscountToPricing();
  });
  
  // Listen for wallet connection events from wallet-connect.html
  window.addEventListener('storage', (e) => {
    if (e.key === 'pinky_token_discount') {
      location.reload(); // Refresh to apply discount
    }
  });
  
})();
