import { BleClient, ConnectionPriority, ScanMode, ScanResult, numberToUUID  } from "@capacitor-community/bluetooth-le";
import { ref } from 'vue';
import { Device } from '@capacitor/device';

const ZEPHYR_THROUGHPUT_SVC_UUID = '1fb3e464-54bd-4af8-a745-4bde4136ecf4';
const ZEPHYR_THROUGHPUT_CMD_CHAR_UUID = numberToUUID(0x1000);
const ZEPHYR_THROUGHPUT_NOTIFY_CHAR_UUID = numberToUUID(0x1001);
const startCmd = new Uint8Array([0x01, 0x01]);
const stopCmd  = new Uint8Array([0x01, 0x00]);
enum BleState {
    Disconnected,
    Scanning,
    Connecting,
    Connected,
    Error
};

const bleState = ref(BleState.Disconnected);
const bytesReceived = ref(0);
const throughput = ref(0);
let connectedId: string | undefined = undefined;
let isAndroid = false;
let startTime: Date  = new Date(Date.now());
let stopTime: Date | undefined = undefined;
let byteCount: number = 0;


function updateReactiveValues()
{
    // Do this at 5Hz so traces aren't swamped with reactivity work 
    let endTime = Date.now();
    bytesReceived.value = byteCount;
    if (stopTime) {
        endTime = stopTime.valueOf();
    }
    throughput.value = (bytesReceived.value * 1000) / (endTime - startTime.valueOf())
}

function bleError(message: string) {
    bleState.value = BleState.Error;
    console.warn(message);
}

async function initializeBLE() {
    setInterval(updateReactiveValues, 200);
    console.log(`Initializing BLE`);
    bleState.value = BleState.Disconnected;
    try {
        isAndroid =  (await Device.getInfo()).platform === 'android';
        await BleClient.initialize({androidNeverForLocation: true});
        await BleClient.requestLEScan({
            services: [ZEPHYR_THROUGHPUT_SVC_UUID],
            namePrefix: 'Notification',
        }, bleScanCallback);
        bleState.value = BleState.Scanning;
    } catch(e) {
        bleError(`Exception during initalizeBLE: ${e}`);
    }
}

async function startTest()
{
    if (connectedId) {
        byteCount = 0;
        if (isAndroid) {
            await BleClient.requestConnectionPriority(connectedId, ConnectionPriority.CONNECTION_PRIORITY_HIGH);
        }
        await BleClient.writeWithoutResponse(connectedId,
            ZEPHYR_THROUGHPUT_SVC_UUID,
            ZEPHYR_THROUGHPUT_CMD_CHAR_UUID,
            new DataView(startCmd.buffer));
    }
}

async function stopTest()
{
    if (connectedId) {
        stopTime = new Date(Date.now());
        await BleClient.writeWithoutResponse(connectedId,
            ZEPHYR_THROUGHPUT_SVC_UUID,
            ZEPHYR_THROUGHPUT_CMD_CHAR_UUID,
            new DataView(stopCmd.buffer));
            await BleClient.requestConnectionPriority(connectedId, ConnectionPriority.CONNECTION_PRIORITY_LOW_POWER);
    }
}

async function bleScanCallback(result: ScanResult) {
    console.log(`Processing BLE scan result`);
    // Connect to the first detected device utilizing the BLE throughput service
    try {
        bleState.value = BleState.Connected;
        await BleClient.stopLEScan();
        await BleClient.connect(result.device.deviceId, 
                                disconnected,
                                {timeout: 10000});
        connectedId = result.device.deviceId;
        await BleClient.startNotifications(result.device.deviceId,
                                           ZEPHYR_THROUGHPUT_SVC_UUID,
                                           ZEPHYR_THROUGHPUT_NOTIFY_CHAR_UUID,
                                           notificationCallback);
    } catch(e) {
        bleError(`Exception during peripheral setup: ${e}`);
    }
}

async function disconnected(deviceId: string) {
    updateReactiveValues();
    bleState.value = BleState.Disconnected;
    if (!stopTime) {
        stopTime = new Date(Date.now());
    }
    await BleClient.requestLEScan({
        services: [ZEPHYR_THROUGHPUT_SVC_UUID],
        namePrefix: 'Notification',
    }, bleScanCallback);
    bleState.value = BleState.Scanning;
}

function notificationCallback(value: DataView) {
    if (byteCount === 0) {
        startTime = new Date(Date.now());
        stopTime = undefined;
    }
    byteCount += value.byteLength;
}

export {
    initializeBLE,
    BleState,
    bleState,
    bytesReceived,
    throughput,
    startTest,
    stopTest
};