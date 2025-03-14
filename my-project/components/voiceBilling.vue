<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// Constants for currency conversion
const USD_TO_INR = 70; // 1 USD = 70 INR

// Existing pricing structure
const selectedCategory = ref('Web');
const selectedPlan = ref('Monthly');
const userMinutes = ref(1500); // Start at minimum 1500 minutes
const basePriceFluent = 14999;
const basePriceLucid = 39999;
const yearlyDiscount = 0.9; // 10% discount for yearly plan
const costPerMinuteFluent = 6;
const costPerMinuteLucid = 5;
const minFluentMinutes = 1500;
const minLucidMinutes = 5000;
const maxFluentMinutes = 100000;
const maxLucidMinutes = 100000;
const stepSize = 500;

// Provider selection feature
const selectedRegion = ref('India');
const selectedTtsProvider = ref('tring'); // Tring selected by default (free)
const selectedTelephonyProvider = ref('plivo'); // Plivo selected by default
const incomingMinutesPercentage = ref(50); // Default 50% incoming, 50% outgoing
const outgoingMinutesPercentage = computed(() => 100 - incomingMinutesPercentage.value);

// Provider pricing data with regional support for both TTS and telephony
const providerPricing = {
  // TTS providers with regional pricing
  tring: {
    type: "tts",
    us: {
      isFree: true,
      monthlyCost: 0,
      description: "Free usage available"
    },
    india: {
      isFree: true,
      monthlyCost: 0,
      description: "Free usage available"
    }
  },
  elevenlabs: {
    type: "tts",
    us: {
      isFree: false,
      plans: [
        { name: "Creator", monthlyCost: 22, minutes: 100 },
        { name: "Pro", monthlyCost: 99, minutes: 500 },
        { name: "Scale", monthlyCost: 330, minutes: 2000 }
      ],
      description: "No free tier"
    },
    india: {
      isFree: false,
      plans: [
        { name: "Creator", monthlyCost: 22, minutes: 100 },
        { name: "Pro", monthlyCost: 99, minutes: 500 },
        { name: "Scale", monthlyCost: 330, minutes: 2000 }
      ],
      description: "No free tier"
    }
  },
  googlecloud: {
    type: "tts",
    us: {
      isFree: true,
      plans: [
        { name: "Standard", monthlyCost: 4, description: "per 1M characters" },
        { name: "WaveNet", monthlyCost: 16, description: "per 1M characters" }
      ],
      description: "First 4M characters free"
    },
    india: {
      isFree: true,
      plans: [
        { name: "Standard", monthlyCost: 4.5, description: "per 1M characters" },
        { name: "WaveNet", monthlyCost: 18, description: "per 1M characters" }
      ],
      description: "First 3M characters free"
    }
  },

  // Telephony providers remain the same
  twilio: {
    type: "telephony",
    us: {
      monthlyCost: 1.15,
      outgoingPerMin: 0.0140,
      incomingPerMin: 0.0085
    },
    india: {
      monthlyCost: null,
      outgoingPerMin: 0.0473,
      incomingPerMin: 0
    }
  },
  plivo: {
    type: "telephony",
    us: {
      monthlyCost: 0.50,
      outgoingPerMin: 0.01,
      incomingPerMin: 0.0055
    },
    india: {
      monthlyCost: 3.13,
      outgoingPerMin: 0.0057,
      incomingPerMin: 0.0057
    }
  },
  telnyx: {
    type: "telephony",
    us: {
      monthlyCost: 1.00,
      outgoingPerMin: 0.0035,
      incomingPerMin: 0.0035
    },
    india: {
      monthlyCost: null,
      outgoingPerMin: null,
      incomingPerMin: null
    }
  },
  exotel: {
    type: "telephony",
    us: {
      monthlyCost: null,
      outgoingPerMin: null,
      incomingPerMin: null
    },
    india: {
      monthlyCost: 157.13, // 10499 + 499 Rs converted to USD (at approx 70 Rs = 1 USD)
      outgoingPerMin: 0.0086,
      incomingPerMin: 0
    }
  }
};

// Filter available providers by type and region availability
const availableTtsProviders = computed(() => {
  const region = selectedRegion.value.toLowerCase();
  return Object.entries(providerPricing)
    .filter(([_, data]) =>
      data.type === 'tts' && data[region] &&
      (data[region].monthlyCost !== null || (data[region].plans && data[region].plans.length > 0))
    )
    .map(([key, data]) => {
      return {
        id: key,
        name: key === 'googlecloud' ? 'Google Cloud' : key.charAt(0).toUpperCase() + key.slice(1),
        ...data
      };
    });
});

const availableTelephonyProviders = computed(() => {
  const region = selectedRegion.value.toLowerCase();
  return Object.entries(providerPricing)
    .filter(([_, data]) =>
      data.type === 'telephony' && data[region] && data[region].monthlyCost !== null
    )
    .map(([key, data]) => {
      return {
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        ...data
      };
    });
});

// Get selected provider data with region support
const selectedTtsProviderData = computed(() => {
  const provider = providerPricing[selectedTtsProvider.value];
  const region = selectedRegion.value.toLowerCase();
  return provider[region];
});

const selectedTelephonyProviderData = computed(() => {
  return providerPricing[selectedTelephonyProvider.value];
});

// Calculate TTS provider costs - updated for regional pricing
const ttsMonthlyCost = computed(() => {
  const provider = selectedTtsProviderData.value;

  if (provider.isFree && !provider.plans) {
    return 0; // Free provider with no paid plans (Tring)
  }

  // For providers with plans (ElevenLabs, Google Cloud)
  if (provider.plans) {
    // Find appropriate plan based on minutes
    const plan = provider.plans.find((p, index) =>
      (p.minutes && userMinutes.value <= p.minutes) || index === provider.plans.length - 1
    );

    if (plan) {
      // If the provider has a free tier and we're under the free limit
      if (provider.isFree && userMinutes.value <= (provider.freeLimit || 0)) {
        return 0;
      }
      return plan.monthlyCost;
    }
  }

  return 'Contact Sales';
});

// Calculate telephony provider costs
const telephonyMonthlyCost = computed(() => {
  const provider = selectedTelephonyProviderData.value;
  const region = selectedRegion.value.toLowerCase();

  if (!provider[region] || provider[region].monthlyCost === null) {
    return 'Not Available';
  }

  const baseFee = provider[region].monthlyCost;
  const incomingMins = userMinutes.value * (incomingMinutesPercentage.value / 100);
  const outgoingMins = userMinutes.value * (outgoingMinutesPercentage.value / 100);
  const incomingCost = incomingMins * provider[region].incomingPerMin;
  const outgoingCost = outgoingMins * provider[region].outgoingPerMin;

  return baseFee + incomingCost + outgoingCost;
});

// Format provider costs as strings with regional currency
const formattedTtsCost = computed(() => {
  if (typeof ttsMonthlyCost.value === 'number') {
    if (ttsMonthlyCost.value === 0) {
      return 'Free';
    }
    return selectedRegion.value === 'US'
      ? `$${ttsMonthlyCost.value.toFixed(2)}`
      : `₹${(ttsMonthlyCost.value * USD_TO_INR).toFixed(2)}`;
  }
  return ttsMonthlyCost.value;
});

const formattedTelephonyCost = computed(() => {
  if (typeof telephonyMonthlyCost.value === 'number') {
    return selectedRegion.value === 'US'
      ? `$${telephonyMonthlyCost.value.toFixed(2)}`
      : `₹${(telephonyMonthlyCost.value * USD_TO_INR).toFixed(2)}`;
  }
  return telephonyMonthlyCost.value;
});

// Convert USD to INR if needed
const convertCurrency = (amount, toINR = false) => {
  if (typeof amount !== 'number') return amount;
  return toINR ? amount * USD_TO_INR : amount;
};

// Get numeric values for provider costs (or 0 if not available)
const numericTtsCost = computed(() => {
  return typeof ttsMonthlyCost.value === 'number' ? ttsMonthlyCost.value : 0;
});

const numericTelephonyCost = computed(() => {
  return typeof telephonyMonthlyCost.value === 'number' ? telephonyMonthlyCost.value : 0;
});

// Total provider cost (TTS + Telephony)
const totalProviderCost = computed(() => {
  return numericTtsCost.value + numericTelephonyCost.value;
});

const formattedTotalProviderCost = computed(() => {
  return selectedRegion.value === 'US'
    ? `$${totalProviderCost.value.toFixed(2)}`
    : `₹${(totalProviderCost.value * USD_TO_INR).toFixed(2)}`;
});

// Updated TTS pricing info with regional support
const ttsPricingInfo = computed(() => {
  const provider = selectedTtsProviderData.value;

  if (provider.isFree && !provider.plans) {
    return 'Free usage available';
  }

  if (provider.plans) {
    if (selectedRegion.value === 'US') {
      return provider.plans.map(plan =>
        `${plan.name}: $${plan.monthlyCost} ${plan.description ? plan.description : plan.minutes ? `(${plan.minutes} mins)` : ''}`
      ).join(' | ');
    } else {
      return provider.plans.map(plan =>
        `${plan.name}: ₹${(plan.monthlyCost * USD_TO_INR).toFixed(2)} ${plan.description ? plan.description : plan.minutes ? `(${plan.minutes} mins)` : ''}`
      ).join(' | ');
    }
  }

  return '';
});

const telephonyPricingInfo = computed(() => {
  const provider = selectedTelephonyProviderData.value;
  const region = selectedRegion.value.toLowerCase();

  if (!provider[region] || provider[region].monthlyCost === null) {
    return 'Not available in this region';
  }

  if (selectedRegion.value === 'US') {
    return `Monthly: $${provider[region].monthlyCost} | Outgoing: $${provider[region].outgoingPerMin}/min | Incoming: $${provider[region].incomingPerMin}/min`;
  } else {
    return `Monthly: ₹${(provider[region].monthlyCost * USD_TO_INR).toFixed(2)} | Outgoing: ₹${(provider[region].outgoingPerMin * USD_TO_INR).toFixed(2)}/min | Incoming: ₹${(provider[region].incomingPerMin * USD_TO_INR).toFixed(2)}/min`;
  }
});

// Update best TTS provider calculation for regional pricing
const bestTtsProvider = computed(() => {
  const region = selectedRegion.value.toLowerCase();
  let lowestCost = Infinity;
  let bestProvider = '';

  for (const [provider, data] of Object.entries(providerPricing)) {
    if (data.type === 'tts' && data[region]) {
      // If it's free with no plans, it's the best
      if (data[region].isFree && !data[region].plans) {
        return provider;
      }

      // Calculate cost for providers with plans
      let cost = Infinity;
      if (data[region].plans) {
        const plan = data[region].plans[0]; // Use first plan for comparison
        cost = plan.monthlyCost;
      }

      if (cost < lowestCost) {
        lowestCost = cost;
        bestProvider = provider;
      }
    }
  }

  return bestProvider;
});

const bestTelephonyProvider = computed(() => {
  const region = selectedRegion.value.toLowerCase();
  let lowestCost = Infinity;
  let bestProvider = '';

  for (const [provider, pricing] of Object.entries(providerPricing)) {
    if (pricing.type === 'telephony' &&
      pricing[region] &&
      pricing[region].monthlyCost !== null) {

      const incomingMins = userMinutes.value * (incomingMinutesPercentage.value / 100);
      const outgoingMins = userMinutes.value * (outgoingMinutesPercentage.value / 100);
      const incomingCost = incomingMins * pricing[region].incomingPerMin;
      const outgoingCost = outgoingMins * pricing[region].outgoingPerMin;
      const totalCost = pricing[region].monthlyCost + incomingCost + outgoingCost;

      if (totalCost < lowestCost) {
        lowestCost = totalCost;
        bestProvider = provider;
      }
    }
  }

  return bestProvider;
});

// Additional cost for extra minutes
const additionalCostFluent = computed(() => {
  const extraMinutes = userMinutes.value - minFluentMinutes;
  return extraMinutes > 0 ? extraMinutes * costPerMinuteFluent : 0;
});

const additionalCostLucid = computed(() => {
  const extraMinutes = userMinutes.value - minLucidMinutes;
  return extraMinutes > 0 ? extraMinutes * costPerMinuteLucid : 0;
});

// Base plans with regional currency conversion
const baseFluentPrice = computed(() => {
  const baseFluent = basePriceFluent + additionalCostFluent.value;
  if (selectedRegion.value === 'US') {
    return baseFluent / USD_TO_INR;
  }
  return baseFluent;
});

const baseLucidPrice = computed(() => {
  const baseLucid = basePriceLucid + additionalCostLucid.value;
  if (selectedRegion.value === 'US') {
    return baseLucid / USD_TO_INR;
  }
  return baseLucid;
});

// Total prices including provider costs
const totalPriceFluent = computed(() => {
  let price = baseFluentPrice.value;

  // Add provider costs if in the same currency
  if (selectedRegion.value === 'US') {
    price += totalProviderCost.value;
  } else {
    price += totalProviderCost.value * USD_TO_INR;
  }

  // Apply yearly discount if yearly plan is selected
  if (selectedPlan.value === 'Yearly') {
    price = price * 12 * yearlyDiscount;
  }

  return price.toFixed(2);
});

const totalPriceLucid = computed(() => {
  let price = baseLucidPrice.value;

  // Add provider costs if in the same currency
  if (selectedRegion.value === 'US') {
    price += totalProviderCost.value;
  } else {
    price += totalProviderCost.value * USD_TO_INR;
  }

  // Apply yearly discount if yearly plan is selected
  if (selectedPlan.value === 'Yearly') {
    price = price * 12 * yearlyDiscount;
  }

  return price.toFixed(2);
});

// Currency symbol based on selected region
const currencySymbol = computed(() => {
  return selectedRegion.value === 'US' ? '$' : '₹';
});

// Format currency based on region
const formatCurrency = (amount, includeSymbol = true) => {
  if (typeof amount !== 'number' && isNaN(parseFloat(amount))) {
    return amount;
  }

  const formattedAmount = parseFloat(amount).toFixed(2);
  return includeSymbol ? `${currencySymbol.value}${formattedAmount}` : formattedAmount;
};

// Updated pricing plans with proper currency handling
const pricingPlans = computed(() => {
  return [
    {
      name: 'Fluent',
      price: userMinutes.value > maxFluentMinutes ? 'Contact us' : `${currencySymbol.value}${totalPriceFluent.value} / ${selectedPlan.value}`,
      description: `${Math.max(userMinutes.value, minFluentMinutes)} Minutes`,
      features: [
        'Lead Gen',
        'CRM Integration',
        'Real Time Booking',
        `${Math.max(userMinutes.value, minFluentMinutes)} Minutes`,
        `${currencySymbol.value}${selectedRegion.value === 'US' ? (costPerMinuteFluent / USD_TO_INR).toFixed(2) : costPerMinuteFluent} per Extra Minute`,
        'Voice Customization',
        userMinutes.value >= 10000 ? 'Multi-Lingual' : '✘ Multi-Lingual',
      ],
      buttonText: userMinutes.value > minFluentMinutes ? 'Talk to Sales' : 'Subscribe',
      baseCost: baseFluentPrice.value,
      additionalCost: additionalCostFluent.value,
      totalCost: totalPriceFluent.value
    },
    {
      name: 'Lucid',
      price: userMinutes.value > maxLucidMinutes ? 'Contact us' : `${currencySymbol.value}${totalPriceLucid.value} / ${selectedPlan.value}`,
      description: `${Math.max(userMinutes.value, minLucidMinutes)} Minutes`,
      features: [
        'Lead Gen',
        'CRM Integration',
        'Real Time Booking',
        `${Math.max(userMinutes.value, minLucidMinutes)} Minutes`,
        `${currencySymbol.value}${selectedRegion.value === 'US' ? (costPerMinuteLucid / USD_TO_INR).toFixed(2) : costPerMinuteLucid} per Extra Minute`,
        'Advanced Voice Customization',
        'Multi-Lingual',
      ],
      buttonText: userMinutes.value > minLucidMinutes ? 'Talk to Sales' : 'Subscribe',
      baseCost: baseLucidPrice.value,
      additionalCost: additionalCostLucid.value,
      totalCost: totalPriceLucid.value
    },
    {
      name: 'Enterprise',
      price: 'Contact us',
      description: 'For Enterprises',
      features: [
        'Talk to sales for Extra Minutes Cost',
        '10,000+ Minutes',
        'Advanced Voice Customization',
        'Multi-Lingual',
      ],
      buttonText: 'Talk to Sales',
      baseCost: null,
      additionalCost: null,
      totalCost: null
    },
  ];
});

// Initialize with best providers
onMounted(() => {
  // Set the best TTS provider as default if available
  if (bestTtsProvider.value) {
    selectedTtsProvider.value = bestTtsProvider.value;
  }

  // Set the best telephony provider as default if available
  if (bestTelephonyProvider.value) {
    selectedTelephonyProvider.value = bestTelephonyProvider.value;
  }

  // Watch for region changes to update provider selections to the best available in that region
  watch(selectedRegion, () => {
    if (bestTtsProvider.value) {
      selectedTtsProvider.value = bestTtsProvider.value;
    }

    if (bestTelephonyProvider.value) {
      selectedTelephonyProvider.value = bestTelephonyProvider.value;
    }
  });
});
</script>
<template>
  <div class="flex flex-col items-center p-6 bg-white text-black">
    <div class="w-full max-w-7xl space-y-6">
      
      <!-- Minutes Selection (existing) -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium">How many minutes do you need?</h3>
          <div class="inline-flex rounded-full bg-gray-100 p-1">
            <UiButton @click="selectedPlan = 'Monthly'"
              :class="{ 'bg-blue-200 text-blue-700': selectedPlan === 'Monthly', 'text-gray-600': selectedPlan !== 'Monthly' }"
              class="px-4 py-1 rounded-full text-sm transition-all">
              Monthly
            </UiButton>
            <button @click="selectedPlan = 'Yearly'"
              :class="{ 'bg-blue-200 text-blue-700': selectedPlan === 'Yearly', 'text-gray-600': selectedPlan !== 'Yearly' }"
              class="px-4 py-1 rounded-full text-sm transition-all">
              Yearly
            </button>
          </div>
        </div>
        <div class="flex flex-col gap-4">
          <input type="range" :min="minFluentMinutes" :max="maxLucidMinutes" :step="stepSize" v-model="userMinutes"
            class="w-full" />
          <div class="flex justify-between text-sm text-gray-600">
            <span>{{ minFluentMinutes }}</span>
            <span>{{ maxLucidMinutes }}</span>
          </div>
          <div class="text-center text-sm font-medium text-blue-700">
            {{ userMinutes }} minutes
          </div>
        </div>
      </div>

      <!-- Pricing Plans with integrated provider costs -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div v-for="plan in pricingPlans" :key="plan.name"
          class="flex flex-col p-6 rounded-xl border border-gray-200 bg-white">
          <div class="mb-6">
            <h3 class="text-xl font-semibold text-blue-700 mb-4">{{ plan.name }}</h3>
            <div class="space-y-1">
              <p class="text-2xl font-bold text-gray-900">{{ plan.price }}</p>
              <p class="text-sm text-gray-500">{{ plan.description }}</p>
            </div>
          </div>
          <button class="w-full py-2 rounded-[8px] text-sm font-medium mb-6 bg-blue-600 text-white hover:bg-blue-700">
            {{ plan.buttonText }}
          </button>
          <ul class="space-y-3">
            <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-2">
              <span class="text-blue-600 mt-1">✓</span>
              <span class="text-sm text-gray-600">{{ feature }}</span>
            </li>
          </ul>

          <!-- Provider cost breakdown with integrated totals -->
          <div v-if="plan.name !== 'Enterprise'" class="pt-4 mt-3 border-t border-gray-200">
            <!-- Base Plan Cost -->
            <div class="flex justify-between text-sm mb-1" v-if="plan.baseCost">
              <span class="text-gray-500">Base Plan:</span>
              <span class="font-medium">
                {{ currencySymbol }}{{ formatCurrency(plan.baseCost, false) }}
              </span>
            </div>
            
            <!-- Additional Minutes Cost -->
            <div v-if="plan.additionalCost && plan.additionalCost > 0" class="flex justify-between text-sm mb-1">
              <span class="text-gray-500">Additional Minutes:</span>
              <span class="font-medium">
                {{ currencySymbol }}{{ formatCurrency(selectedRegion === 'US' ? plan.additionalCost / USD_TO_INR : plan.additionalCost, false) }}
              </span>
            </div>
            
            <!-- TTS Provider Cost -->
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-500">
                {{ selectedTtsProvider === 'googlecloud' ? 'Google Cloud TTS' : 
                   selectedTtsProvider.charAt(0).toUpperCase() + selectedTtsProvider.slice(1) }}:
              </span>
              <span class="font-medium">{{ formattedTtsCost }}</span>
            </div>
            
            <!-- Telephony Provider Cost -->
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-500">
                {{ selectedTelephonyProvider.charAt(0).toUpperCase() + selectedTelephonyProvider.slice(1) }}:
              </span>
              <span class="font-medium">{{ formattedTelephonyCost }}</span>
            </div>
            
            <!-- Total Cost with Plan + Provider Costs -->
            <div class="flex justify-between text-sm mt-2 pt-2 border-t border-gray-100">
              <span class="text-gray-700 font-medium">Total:</span>
              <span class="font-bold text-blue-700">{{ plan.price }}</span>
            </div>
          </div>
        </div>
      </div>
      <!-- Provider Selection Section -->
      <div class="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Provider Settings</h3>

        <!-- TTS Provider Selection with integrated region selector -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-medium text-gray-700">TTS Provider</label>
            
            <!-- Region Selection integrated in TTS section -->
            <div class="inline-flex rounded-full bg-gray-100 p-1">
              <button @click="selectedRegion = 'US'"
                :class="{ 'bg-blue-200 text-blue-700': selectedRegion === 'US', 'text-gray-600': selectedRegion !== 'US' }"
                class="px-4 py-1 rounded-full text-sm transition-all">
                US
              </button>
              <button @click="selectedRegion = 'India'"
                :class="{ 'bg-blue-200 text-blue-700': selectedRegion === 'India', 'text-gray-600': selectedRegion !== 'India' }"
                class="px-4 py-1 rounded-full text-sm transition-all">
                India
              </button>
            </div>
          </div>
          
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            <button 
              v-for="provider in availableTtsProviders" 
              :key="provider.id"
              @click="selectedTtsProvider = provider.id"
              :class="[
                'px-3 py-2 rounded-md text-sm font-medium transition-all',
                selectedTtsProvider === provider.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                provider.id === bestTtsProvider && selectedTtsProvider !== provider.id
                  ? 'ring-2 ring-green-500'
                  : ''
              ]"
            >
              {{ provider.name }}
              <span v-if="provider.id === bestTtsProvider && providerPricing[provider.id][selectedRegion.toLowerCase()].isFree" 
                    class="text-xs bg-green-500 text-white px-1 rounded ml-1">Free</span>
              <span v-else-if="provider.id === bestTtsProvider" 
                    class="text-xs bg-green-500 text-white px-1 rounded ml-1">Best</span>
            </button>
          </div>
          
          <!-- TTS Provider Cost Summary -->
          <div class="mt-3 p-3 bg-white rounded-lg border border-gray-200">
            <div class="flex justify-between items-center">
              <div>
                <h4 class="text-sm font-medium text-gray-700">TTS Provider Cost</h4>
                <p class="text-base font-bold text-blue-700">{{ formattedTtsCost }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ ttsPricingInfo }}</p>
              </div>
              <div v-if="bestTtsProvider && bestTtsProvider !== selectedTtsProvider" class="text-sm">
                <p class="text-gray-600">
                  Switch to {{ bestTtsProvider === 'googlecloud' ? 'Google Cloud' : bestTtsProvider.charAt(0).toUpperCase() + bestTtsProvider.slice(1) }} 
                  for {{ providerPricing[bestTtsProvider][selectedRegion.toLowerCase()].isFree && !providerPricing[bestTtsProvider][selectedRegion.toLowerCase()].plans ? 'free usage' : 'better pricing' }}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Telephony Provider Selection (using the same region as TTS) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">Telephony Provider</label>
          
          <!-- Telephony Provider Buttons -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <button 
              v-for="provider in availableTelephonyProviders" 
              :key="provider.id"
              @click="selectedTelephonyProvider = provider.id"
              :class="[
                'px-3 py-2 rounded-md text-sm font-medium transition-all',
                selectedTelephonyProvider === provider.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                provider.id === bestTelephonyProvider && selectedTelephonyProvider !== provider.id
                  ? 'ring-2 ring-green-500'
                  : ''
              ]"
            >
              {{ provider.name }}
              <span v-if="provider.id === bestTelephonyProvider" 
                    class="text-xs bg-green-500 text-white px-1 rounded ml-1">Best</span>
            </button>
          </div>
          
          <!-- Incoming/Outgoing Split -->
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Call Distribution: {{ incomingMinutesPercentage }}% Incoming / {{ outgoingMinutesPercentage }}% Outgoing
            </label>
            <input type="range" v-model="incomingMinutesPercentage" min="0" max="100" step="5" class="w-full" />
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>0% Incoming</span>
              <span>50/50</span>
              <span>100% Incoming</span>
            </div>
          </div>
          
          <!-- Telephony Provider Cost Summary -->
          <div class="p-3 bg-white rounded-lg border border-gray-200">
            <div class="flex justify-between items-center">
              <div>
                <h4 class="text-sm font-medium text-gray-700">Telephony Provider Cost</h4>
                <p class="text-base font-bold text-blue-700">{{ formattedTelephonyCost }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ telephonyPricingInfo }}</p>
              </div>
              <div v-if="bestTelephonyProvider && bestTelephonyProvider !== selectedTelephonyProvider" class="text-sm">
                <p class="text-gray-600">
                  Switch to {{ bestTelephonyProvider.charAt(0).toUpperCase() + bestTelephonyProvider.slice(1) }} for better pricing
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Total Provider Cost -->
        <div class="mt-4 p-4 bg-blue-50 rounded-lg">
          <div class="flex justify-between items-center">
            <div>
              <h4 class="text-sm font-medium text-gray-700">Total Provider Costs</h4>
              <p class="text-lg font-bold text-blue-700">{{ formattedTotalProviderCost }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>