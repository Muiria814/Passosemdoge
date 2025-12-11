// Simple conversion logic from steps to Dogecoin.
// NOTE: This uses a fixed placeholder rate. Replace with real exchange rate calls
// if you want live conversion (requires external API and API keys).

// Example policy chosen:
// - 1000 steps -> 1000 DOGE (example)
// You can change STEPS_PER_DOGE to tune conversion.

const STEPS_PER_DOGE = 100000; // placeholder: 100k steps = 100k DOGE
const DOGE_SATS = 100000000; // Dogecoin has 100,000,000 "satoshi"-like units (if using same scale)

function convertStepsToDoge(steps) {
  const doge = steps / STEPS_PER_DOGE;
  const sats = Math.round(doge * DOGE_SATS);
  return {
    steps,
    doge: Number(doge.toFixed(8)),
    sats
  };
}

module.exports = { convertStepsToDoge };
