<template>
  <div class="max-w-7xl mx-auto p-5 font-sans bg-gray-50">
    <div class="w-full bg-white rounded-lg overflow-hidden">
      <!-- Tab Navigation -->
      <UiTabs v-model="activeTab" default-value="chat" class="pr-6">
        <div class="flex items-center justify-center p-6 my-5">
          <UiTabsList class="flex rounded-xl p-2 overflow-hidden border border-amber-400">
            <UiTabsTrigger value="chat" @click="activeTab = 'chat'" class="px-6 py-2 text-sm font-medium transition-all duration-300 rounded-xl"
              :class="activeTab === 'chat' ? 'bg-amber-400 text-black' : 'text-gray-700 bg-white'">
              Chat Bot
            </UiTabsTrigger>
            <UiTabsTrigger value="voice" @click="activeTab = 'voice'" class="px-6 py-2 text-sm font-medium transition-all duration-300 rounded-xl"
              :class="activeTab === 'voice' ? 'bg-amber-400 text-black' : 'text-gray-700 bg-white'">
              Voice Bot
            </UiTabsTrigger>
          </UiTabsList>
        </div>
        <!-- {{ activeTab }} -->
        <!-- Tab Content -->
        <UiTabsContent v-show="(activeTab === 'voice')" value="voice">
          <VoiceBilling />
        </UiTabsContent>

        <UiTabsContent v-show="(activeTab === 'chat')" value="chat">
          <ChatBilling />
          <!-- <VoiceBilling /> -->
          <!-- <div>chat</div> -->
           <!-- <chatBilling /> -->
        </UiTabsContent>
      </UiTabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const activeTab = ref('chat');
</script>