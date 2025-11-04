// ✅ ClickStagePro Checkout System — Final Production Version (Locked 2025-11-04)
/**
 * ⚠️ PRODUCTION STABLE - DO NOT MODIFY WITHOUT REVIEW
 * @version 1.0.0-stable
 * @last-updated 2025-11-04
 * 
 * ClickStagePro Branded Checkout Feedback System
 * 
 * This utility provides two branded notifications:
 * 1. Popup blocker detection with retry functionality
 * 2. Success confirmation when checkout opens
 * 
 * Brand Colors (DO NOT CHANGE):
 * - Navy: #1A3568 (primary brand color)
 * - Silver: #CDD4E1 (accent/border color)
 * - Green: #4CAF50 (success accent)
 * - White: #FFFFFF (text color)
 * 
 * DO NOT REMOVE: openStripeCheckout, showPopupBlockerToast, showCheckoutSuccessToast
 */

/**
 * Opens Stripe Checkout in a new tab with popup blocker detection and success feedback
 * @param sessionUrl - The Stripe checkout session URL
 */
export async function openStripeCheckout(sessionUrl: string): Promise<void> {
  const stripeWindow = window.open(sessionUrl, "_blank");

  // If popup blocked
  if (!stripeWindow || stripeWindow.closed || typeof stripeWindow.closed === "undefined") {
    showPopupBlockerToast(sessionUrl);
    return;
  }

  stripeWindow.focus();
  showCheckoutSuccessToast(); // ✅ Success confirmation
}

/**
 * Displays a ClickStagePro-branded toast notification when popup is blocked
 * @param sessionUrl - The Stripe checkout session URL for retry functionality
 */
function showPopupBlockerToast(sessionUrl: string): void {
  // Prevent duplicate toasts
  if (document.getElementById("popupBlockerToast")) return;

  const toast = document.createElement("div");
  toast.id = "popupBlockerToast";
  toast.innerHTML = `
    <div style="
      color: #FFFFFF;
      font-size: 15px;
      font-family: system-ui, sans-serif;
      margin-bottom: 8px;
    ">
      Pop-up blocked — please allow pop-ups to complete your order.
    </div>
    <button id="retryCheckoutBtn" style="
      background: #CDD4E1;
      color: #1A3568;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      cursor: pointer;
      font-size: 14px;
    ">Try Again</button>
  `;

  // Style container with ClickStagePro branding
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = "#1A3568"; // ClickStagePro navy
  toast.style.padding = "14px 20px";
  toast.style.borderRadius = "12px";
  toast.style.border = "1px solid #CDD4E1"; // soft silver border
  toast.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
  toast.style.textAlign = "center";
  toast.style.zIndex = "9999";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease-in-out";
  document.body.appendChild(toast);

  // Fade in animation
  setTimeout(() => (toast.style.opacity = "1"), 50);

  // Retry button click handler
  const retryBtn = document.getElementById("retryCheckoutBtn");
  if (retryBtn) {
    retryBtn.addEventListener("click", async () => {
      toast.remove();
      const newWin = window.open(sessionUrl, "_blank");
      if (!newWin || newWin.closed || typeof newWin.closed === "undefined") {
        showPopupBlockerToast(sessionUrl);
      } else {
        newWin.focus();
        showCheckoutSuccessToast(); // ✅ Success on retry
      }
    });
  }

  // Auto-remove after 10 seconds if ignored
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 10000);
}

/**
 * Displays a success confirmation toast when checkout opens successfully
 * Shows green-bordered navy toast with checkmark
 */
function showCheckoutSuccessToast(): void {
  // Prevent duplicate toasts
  if (document.getElementById("checkoutSuccessToast")) return;

  const toast = document.createElement("div");
  toast.id = "checkoutSuccessToast";
  toast.innerHTML = `
    <div style="
      color: #FFFFFF;
      font-size: 15px;
      font-family: system-ui, sans-serif;
      margin-bottom: 4px;
      font-weight: 500;
    ">
      ✅ Secure Stripe checkout opened successfully.
    </div>
  `;

  // Style container with success branding (green border accent)
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = "#1A3568"; // ClickStagePro navy
  toast.style.padding = "12px 18px";
  toast.style.borderRadius = "10px";
  toast.style.border = "1px solid #4CAF50"; // green success accent
  toast.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
  toast.style.textAlign = "center";
  toast.style.zIndex = "9999";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease-in-out";
  document.body.appendChild(toast);

  // Fade in animation
  setTimeout(() => (toast.style.opacity = "1"), 50);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
