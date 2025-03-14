<script setup lang="ts">
import { ref, computed } from 'vue';

const selectedCategory = ref('Web');
const selectedPlan = ref('Monthly');
const userRange = ref(60);
const basePriceIntelligence = 1999;
const basePriceSuperIntelligence = 6999;
const yearlyDiscount = 0.9; // 10% discount for yearly plan
const costPerSessionWebIntelligence = 10;
const costPerSessionWebSuperIntelligence = 8;
const costPerSessionWhatsApp = 1.5;
const minSessions = 60;
const freeSessionsSuperIntelligence = 250;
const maxIntelligenceSessions = 1000;
const maxSuperIntelligenceSessions = 10000;
const stepSize = 50;

// WhatsApp specific configuration
const whatsAppMinSessions = 1000; // Higher minimum for WhatsApp
const whatsAppFreeSessionsIntelligence = 1000; 
const whatsAppFreeSessionsSuperIntelligence = 3000;

const costPerSessionIntelligence = computed(() =>
  selectedCategory.value === 'WhatsApp' ? costPerSessionWhatsApp : costPerSessionWebIntelligence
);

const costPerSessionSuperIntelligence = computed(() =>
  selectedCategory.value === 'WhatsApp' ? costPerSessionWhatsApp : costPerSessionWebSuperIntelligence
);

const displayMinSessions = computed(() => 
  selectedCategory.value === 'WhatsApp' ? whatsAppMinSessions : minSessions
);

const displayFreeSessionsIntelligence = computed(() => 
  selectedCategory.value === 'WhatsApp' ? whatsAppFreeSessionsIntelligence : userRange.value
);

const displayFreeSessionsSuperIntelligence = computed(() => 
  selectedCategory.value === 'WhatsApp' ? 
    Math.max(userRange.value, whatsAppFreeSessionsSuperIntelligence) : 
    Math.max(userRange.value, freeSessionsSuperIntelligence)
);

// Reset range when changing category
const handleCategoryChange = (category) => {
  selectedCategory.value = category;
  userRange.value = selectedCategory.value === 'WhatsApp' ? whatsAppMinSessions : minSessions;
};

const additionalCostIntelligence = computed(() => {
  if (selectedCategory.value === 'WhatsApp') {
    const extraSessions = userRange.value - whatsAppFreeSessionsIntelligence;
    return extraSessions > 0 ? extraSessions * costPerSessionWhatsApp : 0;
  } else {
    const extraSessions = userRange.value - minSessions;
    return extraSessions > 0 ? extraSessions * costPerSessionWebIntelligence : 0;
  }
});

const totalPriceIntelligence = computed(() => {
  let price = basePriceIntelligence + additionalCostIntelligence.value;
  return selectedPlan.value === 'Yearly' ? (price * 12 * yearlyDiscount).toFixed(2) : price.toFixed(2);
});

const additionalCostSuperIntelligence = computed(() => {
  if (selectedCategory.value === 'WhatsApp') {
    const extraSessions = Math.max(userRange.value, whatsAppFreeSessionsSuperIntelligence) - whatsAppFreeSessionsSuperIntelligence;
    return extraSessions > 0 ? extraSessions * costPerSessionWhatsApp : 0;
  } else {
    const extraSessions = Math.max(userRange.value, freeSessionsSuperIntelligence) - freeSessionsSuperIntelligence;
    return extraSessions > 0 ? extraSessions * costPerSessionWebSuperIntelligence : 0;
  }
});

const totalPriceSuperIntelligence = computed(() => {
  let price = basePriceSuperIntelligence + additionalCostSuperIntelligence.value;
  return selectedPlan.value === 'Yearly' ? (price * 12 * yearlyDiscount).toFixed(2) : price.toFixed(2);
});

const intelligenceFeatures = computed(() => {
  if (selectedCategory.value === 'Web') {
    return [
      `₹${costPerSessionIntelligence.value} per Chat Session`,
      '2 Chatbots',
      `${userRange.value} Free Chat Sessions`,
      'Widget Customization',
      'Lead Gen',
      'CRM Integration',
      'Free 1 year data storage',
    ];
  } else {
    return [
      `₹${costPerSessionIntelligence.value} per WhatsApp Message`,
      '2 WhatsApp Business Numbers',
      `${displayFreeSessionsIntelligence.value} Free Messages`,
      'Automated Responses',
      'Lead Collection',
      'CRM Integration',
      'Free 1 year conversation storage',
    ];
  }
});

const superIntelligenceFeatures = computed(() => {
  if (selectedCategory.value === 'Web') {
    return [
      `₹${costPerSessionSuperIntelligence.value} per Chat Session`,
      '10 Chatbots',
      `${Math.max(userRange.value, freeSessionsSuperIntelligence)} Free Chat Sessions`,
      'Advanced Widget Customization',
      'Lead Gen',
      'CRM Integration',
      'Free 2 years data storage',
    ];
  } else {
    return [
      `₹${costPerSessionSuperIntelligence.value} per WhatsApp Message`,
      '10 WhatsApp Business Numbers',
      `${displayFreeSessionsSuperIntelligence.value} Free Messages`,
      'Advanced Response Templates',
      'Lead Collection & Analytics',
      'Priority CRM Integration',
      'Free 2 years conversation storage',
    ];
  }
});

const freeFeatures = computed(() => {
  if (selectedCategory.value === 'Web') {
    return [
      '1 Chatbot',
      '50 Free Chat Sessions',
      'No Extra Chat Session',
      'No Widget Customization',
      'No Lead Gen',
      'No CRM Integration',
    ];
  } else {
    return [
      '0 WhatsApp Business Number',
      '0 Free Messages',
      'No Extra Messages',
      'Basic Templates Only',
      'No Lead Collection',
      'No CRM Integration',
    ];
  }
});

const enterpriseFeatures = computed(() => {
  if (selectedCategory.value === 'Web') {
    return [
      'Talk to sales for Extra Chat Session',
      'Unlimited Chatbots',
      '1000+ Free Chat Sessions',
      'Advanced Widget Customization',
      'Lead Gen',
      'CRM Integration',
    ];
  } else {
    return [
      'Custom Pricing Per Message',
      'Unlimited WhatsApp Numbers',
      '5000+ Free Messages',
      'Custom Templates & Flows',
      'Advanced Analytics',
      'Enterprise CRM Integration',
    ];
  }
});

const pricingPlans = computed(() => {
  return [
    {
      name: 'Free',
      price: '₹0',
      description: 'Lifetime',
      features: freeFeatures.value,
      buttonText: 'Get Started',
    },
    {
      name: 'Intelligence',
      price: userRange.value > maxIntelligenceSessions ? 'Contact us' : `₹${totalPriceIntelligence.value} / ${selectedPlan.value}`,
      description: selectedCategory.value === 'Web' ? 
        `${userRange.value} Free Chat Sessions` : 
        `${displayFreeSessionsIntelligence.value} Free WhatsApp Messages`,
      features: intelligenceFeatures.value,
      buttonText: userRange.value > maxIntelligenceSessions ? 'Talk to Sales' : 'Subscribe',
    },
    {
      name: 'Super Intelligence',
      price: userRange.value > maxSuperIntelligenceSessions || userRange.value > 1000 ? 'Contact us' : `₹${totalPriceSuperIntelligence.value} / ${selectedPlan.value}`,
      description: selectedCategory.value === 'Web' ? 
        `${Math.max(userRange.value, freeSessionsSuperIntelligence)} Free Chat Sessions` : 
        `${displayFreeSessionsSuperIntelligence.value} Free WhatsApp Messages`,
      features: superIntelligenceFeatures.value,
      buttonText: userRange.value > maxSuperIntelligenceSessions || userRange.value > 1000 ? 'Talk to Sales' : 'Subscribe',
    },
    {
      name: 'Enterprise',
      price: 'Contact us',
      description: 'For Enterprises',
      features: enterpriseFeatures.value,
      buttonText: 'Talk to Sales',
    },
  ];
});
</script>

<template>
  <div class="flex flex-col items-center p-6 bg-white text-black">
    <!-- Header Section -->
    <div class="w-full max-w-7xl space-y-6">
      <!-- Use Case and Billing Cycle -->
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-4">
          <h3 class="text-sm font-medium">Choose your integration type:</h3>
          <div class="inline-flex rounded-full bg-gray-100 p-1">
            <button @click="handleCategoryChange('Web')"
              :class="{ 'bg-blue-200 text-blue-700': selectedCategory === 'Web', 'text-gray-600': selectedCategory !== 'Web' }"
              class="px-4 py-1 rounded-full text-sm transition-all">
              Web
            </button>
            <button @click="handleCategoryChange('WhatsApp')"
              :class="{ 'bg-blue-200 text-blue-700': selectedCategory === 'WhatsApp', 'text-gray-600': selectedCategory !== 'WhatsApp' }"
              class="px-4 py-1 rounded-full text-sm transition-all">
              WhatsApp
            </button>
          </div>
        </div>

        <div class="inline-flex rounded-full bg-gray-100 p-1">
          <button @click="selectedPlan = 'Monthly'"
            :class="{ 'bg-blue-200 text-blue-700': selectedPlan === 'Monthly', 'text-gray-600': selectedPlan !== 'Monthly' }"
            class="px-4 py-1 rounded-full text-sm transition-all">
            Monthly
          </button>
          <button @click="selectedPlan = 'Yearly'"
            :class="{ 'bg-blue-200 text-blue-700': selectedPlan === 'Yearly', 'text-gray-600': selectedPlan !== 'Yearly' }"
            class="px-4 py-1 rounded-full text-sm transition-all">
            Yearly
          </button>
        </div>
      </div>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium">
            {{ selectedCategory === 'Web' ? 'How many chat sessions do you need?' : 'How many WhatsApp messages do you need?' }} 
            <!-- <span class="text-gray-400 ml-1">ℹ️</span> -->
          </h3>
        </div>
        <div class="flex flex-col gap-4">
          <!-- Range Slider -->
          <input type="range" :min="displayMinSessions" :max="maxSuperIntelligenceSessions" :step="stepSize"
            v-model="userRange" class="w-full" />
          <!-- Value Indicators -->
          <div class="flex justify-between text-sm text-gray-600">
            <span>{{ displayMinSessions }}</span>
            <span>{{ maxSuperIntelligenceSessions }}</span>
          </div>
          <!-- Current Value -->
          <div class="text-center text-sm font-medium text-blue-700">
            {{ userRange }} {{ selectedCategory === 'Web' ? 'sessions' : 'messages' }}
          </div>
        </div>
      </div>

      <!-- Pricing Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div v-for="plan in pricingPlans" :key="plan.name"
          class="flex flex-col p-6 rounded-xl border border-gray-200 bg-white">
          <!-- Plan Header -->
          <div class="mb-6">
            <h3 class="text-xl font-semibold text-blue-700 mb-4">{{ plan.name }}</h3>
            <div class="space-y-1">
              <p class="text-2xl font-bold text-gray-900">{{ plan.price }}</p>
              <p class="text-sm text-gray-500">{{ plan.description }}</p>
            </div>
          </div>

          <!-- Action Button -->
          <button class="w-full py-2 rounded-[8px] text-sm font-medium mb-6" :class="[
            plan.name === 'Free' ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700',
            (plan.name === 'Intelligence' && userRange > maxIntelligenceSessions) ||
              (plan.name === 'Super Intelligence' && (userRange > maxSuperIntelligenceSessions || userRange > 1000))
              ? 'bg-gray-600' : ''
          ]">
            {{ plan.buttonText }}
          </button>

          <!-- Features List -->
          <div class="flex-grow">
            <ul class="space-y-3">
              <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-2">
                <span class="text-blue-600 mt-1">✓</span>
                <span class="text-sm text-gray-600">{{ feature }}</span>
              </li>
            </ul>
          </div>

          <!-- Add-on Features -->
          <div v-if="plan.name !== 'Free' && plan.name !== 'Enterprise'" class="mt-6 pt-4">
            <div v-if="plan.name === 'Professional'" class="flex items-center justify-between text-sm">
              <span>Service Authorization</span>
              <span class="px-2 py-1 bg-gray-100 rounded text-gray-600">ADD-ON</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
button {
  transition: all 0.3s ease;
}
/* Custom range input styling */
input[type="range"] {
  -webkit-appearance: none;
  @apply h-2 bg-gray-200 rounded-full;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  @apply w-4 h-4 bg-blue-600 rounded-full cursor-pointer;
}

input[type="range"]::-moz-range-thumb {
  @apply w-4 h-4 bg-blue-600 rounded-full cursor-pointer border-0;
}
</style>