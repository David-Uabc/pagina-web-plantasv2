// RiegoIQ - ESP32 Nodo A Sector Inferior
// Nodo A controla V1, V2 y lee S1, S2.

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID     = "INFINITUM56B3_2.4_EXT";
const char* WIFI_PASSWORD = "zF2yWDG7gt";

const char* BACKEND_URL = "https://riegoiq-backend.onrender.com";
const char* IOT_API_KEY = "esp32_riego_iot_2026";

const char* MQTT_HOST = "0713384684bd4a7ab6c477adf62c2883.s1.eu.hivemq.cloud";
const int   MQTT_PORT = 8883;
const char* MQTT_USER = "riegoiq_esp32";
const char* MQTT_PASS = "Samo2615";

const char* DEVICE_ID = "ESP32-INF-A";
const char* ROLE      = "relay";
const char* SECTOR    = "Inferior";
const char* NODE      = "A";

const uint8_t SENSOR_COUNT = 2;
const uint8_t RELAY_COUNT  = 2;

const int PIN_SENSOR[SENSOR_COUNT]   = { 36, 39 };
const int SENSOR_VALVE[SENSOR_COUNT] = {  1,  2 };
const int PIN_RELE[RELAY_COUNT]      = { 16, 17 };
const int RELE_VALVE[RELAY_COUNT]    = {  1,  2 };

const unsigned long INTERVALO_SENSOR    = 10000;
const unsigned long INTERVALO_HEARTBEAT = 30000;
const unsigned long INTERVALO_VALVULAS  = 10000;

const int SECO_ADC       = 3200;
const int HUMEDO_ADC     = 1000;
const int ADC_MIN_VALIDO = 800;
const int ADC_MAX_VALIDO = 3400;
const int ADC_RUIDO_MAX  = 220;
const uint8_t MUESTRAS_SENSOR = 25;

WiFiClientSecure wifiClientSecure;
PubSubClient mqttClient(wifiClientSecure);
HTTPClient httpClient;

String TOPIC_CMD;
String TOPIC_REPORT;
String TOPIC_HEARTBEAT;

unsigned long tSensor = 0;
unsigned long tHeartbeat = 0;
unsigned long tValvulas = 0;

bool relActivo[RELAY_COUNT] = { false, false };
int ultimaHumedad[SENSOR_COUNT] = { -1, -1 };

bool postIotJson(const String& path, const String& body) {
  if (WiFi.status() != WL_CONNECTED) return false;
  httpClient.begin(String(BACKEND_URL) + path);
  httpClient.addHeader("Content-Type", "application/json");
  httpClient.addHeader("x-device-id", DEVICE_ID);
  httpClient.addHeader("x-api-key", IOT_API_KEY);
  httpClient.setTimeout(8000);
  int code = httpClient.POST(body);
  httpClient.end();
  return code >= 200 && code < 300;
}

int buscarRelayPorValvula(int valveNumber) {
  for (int i = 0; i < RELAY_COUNT; i++) {
    if (RELE_VALVE[i] == valveNumber) return i;
  }
  return -1;
}

void activarRele(int relayIndex, bool abrir) {
  if (relayIndex < 0 || relayIndex >= RELAY_COUNT) return;
  relActivo[relayIndex] = abrir;
  digitalWrite(PIN_RELE[relayIndex], abrir ? LOW : HIGH);
  Serial.printf("[RELE] V%d -> %s\n", RELE_VALVE[relayIndex], abrir ? "ABIERTA" : "CERRADA");
}

void callbackMQTT(char* topic, byte* payload, unsigned int length) {
  char buf[512];
  if (length >= sizeof(buf)) length = sizeof(buf) - 1;
  memcpy(buf, payload, length);
  buf[length] = '\0';

  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, buf)) {
    Serial.println("[MQTT] Comando invalido");
    return;
  }

  int valveNumber = doc["valveNumber"] | doc["valve"] | 0;
  String command = doc["command"] | "";
  int relayIndex = buscarRelayPorValvula(valveNumber);
  if (relayIndex < 0) return;

  if (command == "OPEN") activarRele(relayIndex, true);
  else if (command == "CLOSED" || command == "CLOSE") activarRele(relayIndex, false);
}

int leerHumedad(int pin, int* adcOut = nullptr, int* spreadOut = nullptr) {
  long suma = 0;
  int adcMin = 4095;
  int adcMax = 0;

  for (int i = 0; i < MUESTRAS_SENSOR; i++) {
    int lectura = analogRead(pin);
    suma += lectura;
    if (lectura < adcMin) adcMin = lectura;
    if (lectura > adcMax) adcMax = lectura;
    delay(5);
  }

  int adc = suma / MUESTRAS_SENSOR;
  int spread = adcMax - adcMin;

  if (adcOut) *adcOut = adc;
  if (spreadOut) *spreadOut = spread;

  if (adc < ADC_MIN_VALIDO || adc > ADC_MAX_VALIDO || spread > ADC_RUIDO_MAX) {
    return -1;
  }

  return constrain(map(adc, SECO_ADC, HUMEDO_ADC, 0, 100), 0, 100);
}

void conectarWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.printf("[WiFi] Conectando a %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long inicio = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
    if (millis() - inicio > 15000) {
      Serial.println("\n[WiFi] Timeout");
      ESP.restart();
    }
  }
  Serial.printf("\n[WiFi] OK IP: %s\n", WiFi.localIP().toString().c_str());
}

void conectarMQTT() {
  wifiClientSecure.setInsecure();
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(callbackMQTT);
  mqttClient.setBufferSize(1024);
  mqttClient.setKeepAlive(60);

  int intentos = 0;
  while (!mqttClient.connected() && intentos < 5) {
    String clientId = String(DEVICE_ID) + "_" + String(millis() % 9999);
    Serial.printf("[MQTT] Conectando (%d/5)...\n", intentos + 1);
    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      mqttClient.subscribe(TOPIC_CMD.c_str(), 1);
      Serial.printf("[MQTT] OK suscrito a %s\n", TOPIC_CMD.c_str());
      return;
    }
    Serial.printf("[MQTT] Fallo rc=%d\n", mqttClient.state());
    delay(2000);
    intentos++;
  }
}

void enviarHeartbeatHTTP() {
  StaticJsonDocument<224> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["sector"]   = SECTOR;
  doc["node"]     = NODE;
  doc["role"]     = ROLE;
  doc["mqttOk"]   = mqttClient.connected();
  doc["rssi"]     = WiFi.RSSI();
  String body;
  serializeJson(doc, body);
  bool ok = postIotJson("/api/iot/heartbeat", body);
  Serial.printf("[HTTP] Heartbeat -> %s\n", ok ? "OK" : "FALLO");
}

void publicarHeartbeatMQTT() {
  if (!mqttClient.connected()) return;
  StaticJsonDocument<224> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["sector"]   = SECTOR;
  doc["node"]     = NODE;
  doc["role"]     = ROLE;
  doc["rssi"]     = WiFi.RSSI();
  char payload[224];
  serializeJson(doc, payload);
  mqttClient.publish(TOPIC_HEARTBEAT.c_str(), payload, false);
}

String construirPayloadLecturas() {
  StaticJsonDocument<768> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["sector"]   = SECTOR;
  doc["node"]     = NODE;
  doc["role"]     = ROLE;

  JsonArray readings = doc.createNestedArray("readings");
  for (int i = 0; i < SENSOR_COUNT; i++) {
    if (ultimaHumedad[i] < 0) continue;
    JsonObject rd = readings.createNestedObject();
    rd["sector"]      = SECTOR;
    rd["node"]        = NODE;
    rd["valve"]       = SENSOR_VALVE[i];
    rd["valveNumber"] = SENSOR_VALVE[i];
    rd["humidity"]    = ultimaHumedad[i];
  }

  String body;
  serializeJson(doc, body);
  return body;
}

void enviarReporteSensores() {
  int validCount = 0;
  for (int i = 0; i < SENSOR_COUNT; i++) {
    if (ultimaHumedad[i] >= 0) validCount++;
  }
  if (validCount == 0) {
    Serial.println("[INFO] Sin lecturas validas");
    return;
  }

  String body = construirPayloadLecturas();
  bool ok = false;
  if (mqttClient.connected()) {
    ok = mqttClient.publish(TOPIC_REPORT.c_str(), body.c_str());
    Serial.printf("[MQTT] Reporte -> %s\n", ok ? "OK" : "FALLO");
  }
  if (!ok) {
    bool httpOk = postIotJson("/api/iot/report", body);
    Serial.printf("[HTTP] Reporte -> %s\n", httpOk ? "OK" : "FALLO");
  }
}

void consultarValvulasHTTP() {
  if (WiFi.status() != WL_CONNECTED) return;
  httpClient.begin(String(BACKEND_URL) + "/api/iot/valve/" + String(SECTOR));
  httpClient.addHeader("x-device-id", DEVICE_ID);
  httpClient.addHeader("x-api-key", IOT_API_KEY);
  httpClient.setTimeout(8000);
  int code = httpClient.GET();
  if (code == 200) {
    String resp = httpClient.getString();
    StaticJsonDocument<1024> doc;
    if (!deserializeJson(doc, resp) && doc.containsKey("plants")) {
      for (JsonObject p : doc["plants"].as<JsonArray>()) {
        int valveNumber = p["valveNumber"] | 0;
        String status = p["valveStatus"] | "CLOSED";
        int relayIndex = buscarRelayPorValvula(valveNumber);
        if (relayIndex >= 0) {
          bool shouldOpen = status == "OPEN";
          if (relActivo[relayIndex] != shouldOpen) activarRele(relayIndex, shouldOpen);
        }
      }
    }
  }
  httpClient.end();
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== RiegoIQ - Nodo A Inferior ===");

  for (int i = 0; i < RELAY_COUNT; i++) {
    pinMode(PIN_RELE[i], OUTPUT);
    digitalWrite(PIN_RELE[i], HIGH);
  }

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  TOPIC_CMD       = "riegoiq/" + String(SECTOR) + "/" + String(NODE) + "/valve/command";
  TOPIC_REPORT    = "riegoiq/" + String(SECTOR) + "/" + String(NODE) + "/report";
  TOPIC_HEARTBEAT = "riegoiq/" + String(SECTOR) + "/" + String(NODE) + "/heartbeat";

  conectarWiFi();
  conectarMQTT();
  enviarHeartbeatHTTP();
  publicarHeartbeatMQTT();
  consultarValvulasHTTP();

  Serial.println("=== Nodo listo ===");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) conectarWiFi();
  if (!mqttClient.connected()) conectarMQTT();
  mqttClient.loop();

  unsigned long ahora = millis();

  if (ahora - tSensor >= INTERVALO_SENSOR) {
    tSensor = ahora;
    for (int i = 0; i < SENSOR_COUNT; i++) {
      int adcCrudo = 0;
      int adcRango = 0;
      int humedad = leerHumedad(PIN_SENSOR[i], &adcCrudo, &adcRango);
      ultimaHumedad[i] = humedad;
      if (humedad == -1) {
        Serial.printf("[SENSOR] S%d (GPIO %d) -> sin sensor | ADC=%d | delta=%d\n", SENSOR_VALVE[i], PIN_SENSOR[i], adcCrudo, adcRango);
      } else {
        Serial.printf("[SENSOR] S%d -> %3d%% | ADC=%d | delta=%d\n", SENSOR_VALVE[i], humedad, adcCrudo, adcRango);
      }
    }
    enviarReporteSensores();
  }

  if (ahora - tValvulas >= INTERVALO_VALVULAS) {
    tValvulas = ahora;
    consultarValvulasHTTP();
  }

  if (ahora - tHeartbeat >= INTERVALO_HEARTBEAT) {
    tHeartbeat = ahora;
    publicarHeartbeatMQTT();
    enviarHeartbeatHTTP();
    Serial.printf("[SYS] RAM: %d | RSSI: %d | MQTT: %s\n",
      ESP.getFreeHeap(), WiFi.RSSI(), mqttClient.connected() ? "OK" : "NO");
  }
}
