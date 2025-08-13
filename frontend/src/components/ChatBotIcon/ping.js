const createPingSound = () => {
  // Simple WAV file data URL with a short beep
  // This is a minimal WAV file containing a 440Hz tone for about 200ms
  const wavData = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCdKR2/LVdiMFl5qQ0NJhJwAVZrXn6UoMCtmr5uW5bhoFl6mc0dVmDAOJmdR+UD0hD2K76dVrHwgXirLe2HIqBTyDyfHchzIFC0G25+mxWhAJYKHV7b1qLwU0g8rx34k1BTGByvHciEAHGGy88tyWPgUmfMs+4YlEBTqByvHci0EGH3LB9deWP";
  
  return wavData;
};

// Export the ping sound
const beepUrl = createPingSound();
export default beepUrl;
