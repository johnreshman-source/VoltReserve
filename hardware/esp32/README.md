# VoltReserve ESP32 Station Monitor

Arduino sketch for ESP32 microcontroller to monitor EV charging ports and communicate with the VoltReserve backend system.

## Hardware Requirements

### Microcontroller
- **ESP32 DevKit** (or any ESP32 board with WiFi)
- USB cable for programming and power
- 5V power supply (optional, for standalone operation)

### Sensors (Port Occupancy Detection)
- 3x Analog Sensors (e.g., capacitive sensors, distance sensors, or motion detectors)
  - Port 1: GPIO 34 (ADC1_CH6)
  - Port 2: GPIO 35 (ADC1_CH7)
  - Port 3: GPIO 36 (ADC1_CH0)

### Status Indicators
- 3x Green LEDs (Port Status Indicators)
  - Port 1: GPIO 25
  - Port 2: GPIO 26
  - Port 3: GPIO 27
- 1x Blue LED (System Status)
  - GPIO 2

### Additional Components
- Resistors (220Ω for LEDs)
- Capacitors (100µF for power smoothing)
- Breadboard or PCB for connections
- Jumper wires

## Pin Configuration