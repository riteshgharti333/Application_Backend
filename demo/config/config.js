// jioConfig.js

export const jioConfig = {
    mobileNumber: '8580483491',  // Replace with the mobile number you use for login
    loginUrl: 'https://www.jio.com/selfcare/login/',  // The login URL for Jio
    otpFieldSelector: '#otp-input',        // The OTP input field's selector
    submitOtpSelector: '#submit-otp',      // The submit button for OTP
    mobileNumberFieldSelector: '#mobile-input', // Mobile number input field's selector
    retryInterval: 5000, // Retry interval in ms for submitting OTP (optional)
    headless: false, // Set to false if you want to see the browser
      chromePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"

  };
  