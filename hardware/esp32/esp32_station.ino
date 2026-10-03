/*
  VoltReserve - IoT-Based EV Charging Slot Reservation System
  ESP32 Station Monitor
  
  Reads 3 sensors (simulating charging port occupancy)
  Sends status to Flask backend via HTTP API
  
  Hardware:
  - ESP32 DevKit
  - 3x Digital Sensors (GPIO pins)
  - 3x Status LEDs (GPIO pins)
  - WiFi connectivity
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ========================== CONFIGURATION ==========================

// WiFi Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Backend Server Configuration
const char* BACKEND_URL = "http://YOUR_IP:5000";
const char* API_ENDPOINT = "/api/device/status";
const int STATION_ID = 1; // VoltReserve Station ID in database

// Sensor Pin Configuration (GPIO Pins)
const int SENSOR_PIN_1 = 34;  // Port 1 Sensor (GPIO 34 - ADC)
const int SENSOR_PIN_2 = 35;  // Port 2 Sensor (GPIO 35 - ADC)
const int SENSOR_PIN_3 = 36;  // Port 3 Sensor (GPIO 36 - ADC)

// LED Pin Configuration (Status Indicators)
const int LED_PIN_1 = 25;     // Port 1 LED (Green)
const int LED_PIN_2 = 26;     // Port 2 LED (Green)
const int LED_PIN_3 = 27;     // Port 3 LED (Green)

// System LED
const int STATUS_LED = 2;     // System Status LED (Blue)

// Configuration Constants
const int SENSOR_THRESHOLD = 2048;  // ADC threshold (0-4095 range)
                                     // Below threshold = Occupied
                                     // Above threshold = Available

const unsigned long HEARTBEAT_INTERVAL = 5000;  // Send status every 5 seconds
const unsigned long SENSOR_READ_INTERVAL = 1000; // Read sensors every 1 second
const int MAX_RETRIES = 3;

// ========================== GLOBAL VARIABLES ==========================

unsigned long lastHeartbeatTime = 0;
unsigned long lastSensorReadTime = 0;
bool isConnected = false;

// Port States (true = occupied, false = available)
bool portOccupied[3] = {false, false, false};
int sensorValues[3] = {0, 0, 0};

// ========================== SETUP ==========================

void setup() {
  // Initialize Serial for debugging
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n\n");
  Serial.println("==================================");
  Serial.println("VoltReserve - ESP32 Station Init");
  Serial.println("==================================");
  
  // Initialize Pins
  initializePins();
  
  // Blink status LED to indicate startup
  blinkLED(STATUS_LED, 3, 200);
  
  // Connect to WiFi
  connectToWiFi();
  
  // System ready
  Serial.println("✓ System initialized and ready");
}

// ========================== LOOP ==========================

void loop() {
  unsigned long currentTime = millis();
  
  // Maintain WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, attempting reconnect...");
    connectToWiFi();
  }
  
  // Read sensors periodically
  if (currentTime - lastSensorReadTime >= SENSOR_READ_INTERVAL) {
    readSensors();
    updateLEDs();
    lastSensorReadTime = currentTime;
  }
  
  // Send status to backend periodically
  if (currentTime - lastHeartbeatTime >= HEARTBEAT_INTERVAL) {
    sendStatusToBackend();
    lastHeartbeatTime = currentTime;
  }
  
  delay(100);
}

// ========================== PIN INITIALIZATION ==========================

void initializePins() {
  Serial.println("Initializing pins...");
  
  // Sensor pins as input
  pinMode(SENSOR_PIN_1, INPUT);
  pinMode(SENSOR_PIN_2, INPUT);
  pinMode(SENSOR_PIN_3, INPUT);
  
  // LED pins as output
  pinMode(LED_PIN_1, OUTPUT);
  pinMode(LED_PIN_2, OUTPUT);
  pinMode(LED_PIN_3, OUTPUT);
  pinMode(STATUS_LED, OUTPUT);
  
  // Turn off all LEDs initially
  digitalWrite(LED_PIN_1, LOW);
  digitalWrite(LED_PIN_2, LOW);
  digitalWrite(LED_PIN_3, LOW);
  digitalWrite(STATUS_LED, LOW);
  
  Serial.println("✓ Pins initialized");
}

// ========================== WiFi CONNECTION ==========================

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✓ WiFi connected");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    isConnected = true;
    
    // Blink status LED to confirm connection
    blinkLED(STATUS_LED, 2, 300);
  } else {
    Serial.println();
    Serial.println("✗ WiFi connection failed");
    isConnected = false;
  }
}

// ========================== SENSOR READING ==========================

void readSensors() {
  // Read analog values from sensors
  sensorValues[0] = analogRead(SENSOR_PIN_1);
  sensorValues[1] = analogRead(SENSOR_PIN_2);
  sensorValues[2] = analogRead(SENSOR_PIN_3);
  
  // Determine occupancy (inverted logic)
  // Low sensor value = occupied (car present)
  // High sensor value = available (no car)
  portOccupied[0] = (sensorValues[0] < SENSOR_THRESHOLD);
  portOccupied[1] = (sensorValues[1] < SENSOR_THRESHOLD);
  portOccupied[2] = (sensorValues[2] < SENSOR_THRESHOLD);
  
  // Debug output (uncomment for troubleshooting)
  /*
  Serial.print("Sensors: ");
  Serial.print(sensorValues[0]); Serial.print(" ");
  Serial.print(sensorValues[1]); Serial.print(" ");
  Serial.print(sensorValues[2]); Serial.print(" | ");
  Serial.print("Occupied: ");
  Serial.print(portOccupied[0]); Serial.print(" ");
  Serial.print(portOccupied[1]); Serial.print(" ");
  Serial.println(portOccupied[2]);
  */
}

// ========================== LED CONTROL ==========================

void updateLEDs() {
  // Port 1: Green LED on if available
  digitalWrite(LED_PIN_1, portOccupied[0] ? LOW : HIGH);
  
  // Port 2: Green LED on if available
  digitalWrite(LED_PIN_2, portOccupied[1] ? LOW : HIGH);
  
  // Port 3: Green LED on if available
  digitalWrite(LED_PIN_3, portOccupied[2] ? LOW : HIGH);
}

void blinkLED(int pin, int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(delayMs);
    digitalWrite(pin, LOW);
    delay(delayMs);
  }
}

// ========================== BACKEND COMMUNICATION ==========================

void sendStatusToBackend() {
  if (!isConnected) {
    Serial.println("⚠ Not connected to WiFi, skipping status update");
    return;
  }
  
  HTTPClient http;
  String fullURL = String(BACKEND_URL) + String(API_ENDPOINT);
  
  Serial.print("Sending status to: ");
  Serial.println(fullURL);
  
  http.begin(fullURL);
  http.addHeader("Content-Type", "application/json");
  
  // Build JSON payload
  DynamicJsonDocument doc(512);
  doc["station_id"] = STATION_ID;
  doc["esp32_id"] = "ESP32_001";
  
  JsonArray portsArray = doc.createNestedArray("ports");
  
  for (int i = 0; i < 3; i++) {
    JsonObject port = portsArray.createNestedObject();
    port["port_number"] = i + 1;
    port["sensor_value"] = sensorValues[i];
    port["occupied"] = portOccupied[i];
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Send POST request
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    Serial.print("✓ Response Code: ");
    Serial.println(httpResponseCode);
    
    String response = http.getString();
    Serial.println("Response: " + response);
    
    // Blink status LED on successful update
    blinkLED(STATUS_LED, 1, 100);
  } else {
    Serial.print("✗ HTTP Error: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

// ========================== UTILITY FUNCTIONS ==========================

void printPortStatus() {
  Serial.println("\n--- Current Port Status ---");
  for (int i = 0; i < 3; i++) {
    Serial.print("Port ");
    Serial.print(i + 1);
    Serial.print(": ");
    Serial.print("Sensor=");
    Serial.print(sensorValues[i]);
    Serial.print(" | Status=");
    Serial.println(portOccupied[i] ? "OCCUPIED" : "AVAILABLE");
  }
  Serial.println("---------------------------\n");
}

// ========================== END OF CODE ==========================

/*
  
  TROUBLESHOOTING GUIDE:
  
  1. WiFi won't connect:
     - Check SSID and password in configuration
     - Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
     - Check WiFi signal strength
  
  2. Backend communication fails:
     - Verify BACKEND_URL is correct (http://YOUR_IP:5000)
     - Check Flask backend is running
     - Verify firewall allows connections
     - Check serial output for HTTP error codes
  
  3. Sensors not reading:
     - Verify sensor connections to GPIO pins
     - Check SENSOR_THRESHOLD value (2048 is middle of 0-4095 range)
     - Use Serial output to debug sensor values
     - Uncomment debug Serial.print lines in readSensors()
  
  4. LEDs not lighting:
     - Verify LED connections and polarity
     - Check GPIO pin assignments
     - Test with digitalWrite(LED_PIN_X, HIGH/LOW)
  
  5. How to enable debug output:
     - Uncomment the Serial.print section in readSensors()
     - Open Serial Monitor (Tools > Serial Monitor)
     - Set baud rate to 115200
     - You'll see real-time sensor values
  
*/