<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>BLE Throughput</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">BLE Throughput</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="container">
        <ion-label>BLE State: <b>{{ BleState[bleState] }}</b></ion-label>
        <ion-label>Throughput: <b>{{ throughputString }}</b></ion-label>
        <ion-label>Total Transfer: <b>{{ prettyBytes(bytesReceived) }}</b></ion-label>
        <div id="buttons">
          <ion-button :disabled="bleState !== BleState.Connected" @click="startTest()">Send Data</ion-button>
          <ion-button :disabled="bleState !== BleState.Connected" @click="stopTest()">Stop Data</ion-button>
        </div>
        <ion-label>@capacitor-community/bluetooth-le version: <b>{{  p.packages['node_modules/@capacitor-community/bluetooth-le'].version }}</b></ion-label>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonLabel, IonHeader, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/vue';
import { BleState, bleState, bytesReceived, throughput, startTest, stopTest } from '@/controllers/Bluetooth';
import p from '../../package-lock.json';
import { ref, computed } from 'vue';
import prettyBytes from 'pretty-bytes';
const throughputString = computed(()=>{
  return `${prettyBytes(throughput.value)}/s`;
});

</script>

<style scoped>
#container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

#buttons {
  display: flex;
  flex-direction: row;
  align-items: center;
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;
  
  color: #8c8c8c;
  
  margin: 0;
}

#container a {
  text-decoration: none;

}
</style>
