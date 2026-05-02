#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

const char* WIFI_SSID = "Galaxy A34 5G 3A1A";
const char* WIFI_PASSWORD = "06242615";
const char* BACKEND_URL = "https://riego-iot-backend.onrender.com";
const char* IOT_API_KEY = "esp32_riego_iot_2026";
const char* MQTT_HOST = "0713384684bd4a7ab6c477adf62c2883.s1.eu.hivemq.cloud";
const int MQTT_PORT = 8883;
const char* MQTT_USER = "riegoiq_esp32";
const char* MQTT_PASS = "Samo2615";

const char* DEVICE_ID = "ESP32-SUP-01";
const char* SECTOR = "Superior";

const int PIN_SENSOR[5] = { 36, 39, 34, 35, 32 };
const int PIN_RELE[5] = { 26, 27, 14, 12, 13 };

const unsigned long INTERVALO_SENSOR = 10000;
const unsigned long INTERVALO_HEARTBEAT = 30000;
const unsigned long INTERVALO_VALVULAS = 10000;

const int SECO_ADC = 3200;
const int HUMEDO_ADC = 1000;
const int ADC_MIN_VALIDO = 800;
const int ADC_MAX_VALIDO = 3400;

const uint8_t MAX_PENDING_REPORTS = 8;

WiFiClientSecure wifiClientSecure;
PubSubClient mqttClient(wifiClientSecure);
HTTPClient httpClient;
Preferences preferences;

String TOPIC_CMD;
String TOPIC_REPORT;
String TOPIC_HEARTBEAT;

unsigned long tSensor = 0;
unsigned long tHeartbeat = 0;
unsigned long tValvulas = 0;

bool relActivo[5] = { false, false, false, false, false };
int ultimaHumedad[5] = { -1, -1, -1, -1, -1 };

uint8_t pendingHead = 0;
uint8_t pendingTail = 0;
uint8_t pendingCount = 0;

String queueKey(uint8_t index) {
  return "p" + String(index);
}

void saveQueueMeta() {
  preferences.putUChar("qHead", pendingHead);
  preferences.putUChar("qTail", pendingTail);
  preferences.putUChar("qCount", pendingCount);
}

void loadQueueMeta() {
  pendingHead = preferences.getUChar("qHead", 0);
  pendingTail = preferences.getUChar("qTail", 0);
  pendingCount = preferences.getUChar("qCount", 0);

  if (pendingHead >= MAX_PENDING_REPORTS || pendingTail >= MAX_PENDING_REPORTS || pendingCount > MAX_PENDING_REPORTS) {
    pendingHead = 0;
    pendingTail = 0;
    pendingCount = 0;
    saveQueueMeta();
  }
}

void removeQueuedReport(uint8_t index) {
  preferences.remove(queueKey(index).c_str());
}

bool queueReportPayload(const String& payload) {
  if (payload.length() == 0) return false;

  if (pendingCount >= MAX_PENDING_REPORTS) {
    removeQueuedReport(pendingHead);
    pendingHead = (pendingHead + 1) % MAX_PENDING_REPORTS;
    pendingCount--;
  }

  preferences.putString(queueKey(pendingTail).c_str(), payload);
  pendingTail = (pendingTail + 1) % MAX_PENDING_REPORTS;
  pendingCount++;
  saveQueueMeta();
  Serial.printf("[QUEUE] Reporte guardado. Pendientes: %u\n", pendingCount);
  return true;
}

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

void flushQueuedReports() {
  if (WiFi.status() != WL_CONNECTED || pendingCount == 0) return;

  while (pendingCount > 0) {
    const String key = queueKey(pendingHead);
    const String payload = preferences.getString(key.c_str(), "");

    if (payload.length() == 0) {
      pendingHead = (pendingHead + 1) % MAX_PENDING_REPORTS;
      pendingCount--;
      saveQueueMeta();
      continue;
    }

    if (!postIotJson("/api/iot/report", payload)) {
      Serial.println("[QUEUE] No se pudo reenviar cola offline");
      return;
    }

    removeQueuedReport(pendingHead);
    pendingHead = (pendingHead + 1) % MAX_PENDING_REPORTS;
    pendingCount--;
    saveQueueMeta();
    Serial.printf("[QUEUE] Reporte reenviado. Restantes: %u\n", pendingCount);
    delay(120);
  }
}

void activarRele(int i, bool abrir) {
  if (i < 0 || i >= 5) return;
  relActivo[i] = abrir;
  digitalWrite(PIN_RELE[i], abrir ? LOW : HIGH);
  Serial.printf("[RELE] Valvula %d -> %s\n", i + 1, abrir ? "ABIERTA" : "CERRADA");
}

void callbackMQTT(char* topic, byte* payload, unsigned int length) {
  char buf[1024];
  if (length >= sizeof(buf)) length = sizeof(buf) - 1;
  memcpy(buf, payload, length);
  buf[length] = '\0';

  Serial.printf("[MQTT] <- %s\n        %s\n", topic, buf);

  StaticJsonDocument<512> doc;
  if (deserializeJson(doc, buf)) {
    Serial.println("[MQTT] JSON invalido");
    return;
  }

  if (doc.containsKey("command")) {
    String command = doc["command"].as<String>();
    int valve = -1;

    if (doc.containsKey("valve")) valve = doc["valve"].as<int>();
    if (valve == -1 && doc.containsKey("valveNumber")) valve = doc["valveNumber"].as<int>();

    if (valve >= 1 && valve <= 5) {
      activarRele(valve - 1, command == "OPEN");
      return;
    }

    if (command == "CLOSE_ALL") {
      for (int i = 0; i < 5; i++) activarRele(i, false);
      return;
    }
  }

  if (doc.containsKey("valve") && doc.containsKey("state")) {
    activarRele(doc["valve"].as<int>() - 1, doc["state"].as<bool>());
    return;
  }

  if (doc.containsKey("plants")) {
    for (JsonObject plant : doc["plants"].as<JsonArray>()) {
      int valve = plant["valveNumber"] | 0;
      String status = plant["valveStatus"] | "CLOSED";
      if (valve >= 1 && valve <= 5) activarRele(valve - 1, status == "OPEN");
    }
  }
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
  flushQueuedReports();
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
      bool ok = mqttClient.subscribe(TOPIC_CMD.c_str(), 1);
      Serial.printf("[MQTT] OK suscrito a %s: %s\n", TOPIC_CMD.c_str(), ok ? "si" : "no");

      String online = "{\"deviceId\":\"" + String(DEVICE_ID) +
                      "\",\"sector\":\"" + String(SECTOR) + "\",\"status\":\"online\"}";
      mqttClient.publish(TOPIC_HEARTBEAT.c_str(), online.c_str(), false);
      flushQueuedReports();
      return;
    }

    Serial.printf("[MQTT] Fallo rc=%d\n", mqttClient.state());
    delay(2000);
    intentos++;
  }

  Serial.println("[MQTT] Sin conexion MQTT");
}

int leerHumedad(int pin) {
  long suma = 0;
  for (int i = 0; i < 20; i++) {
    suma += analogRead(pin);
    delay(5);
  }

  int adc = suma / 20;
  if (adc < ADC_MIN_VALIDO || adc > ADC_MAX_VALIDO) {
    return -1;
  }

  return constrain(map(adc, SECO_ADC, HUMEDO_ADC, 0, 100), 0, 100);
}

void enviarHeartbeatHTTP() {
  if (WiFi.status() != WL_CONNECTED) return;

  StaticJsonDocument<128> doc;
  doc["sector"] = SECTOR;
  doc["deviceId"] = DEVICE_ID;
  doc["mqttOk"] = mqttClient.connected();
  doc["rssi"] = WiFi.RSSI();

  String body;
  serializeJson(doc, body);

  bool ok = postIotJson("/api/iot/heartbeat", body);
  Serial.printf("[HTTP] Heartbeat -> %s\n", ok ? "OK" : "FALLO");
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
      for (JsonObject plant : doc["plants"].as<JsonArray>()) {
        int valve = plant["valveNumber"] | 0;
        String status = plant["valveStatus"] | "CLOSED";
        if (valve >= 1 && valve <= 5 && (status == "OPEN") != relActivo[valve - 1]) {
          activarRele(valve - 1, status == "OPEN");
        }
      }
    }
  }

  httpClient.end();
}

void enviarReporteHTTP() {
  if (WiFi.status() != WL_CONNECTED) return;

  StaticJsonDocument<512> doc;
  doc["sector"] = SECTOR;
  doc["deviceId"] = DEVICE_ID;
  JsonArray readings = doc.createNestedArray("readings");

  for (int i = 0; i < 5; i++) {
    if (ultimaHumedad[i] < 0) continue;
    JsonObject reading = readings.createNestedObject();
    reading["valve"] = i + 1;
    reading["valveNumber"] = i + 1;
    reading["humidity"] = ultimaHumedad[i];
  }

  String body;
  serializeJson(doc, body);

  bool ok = postIotJson("/api/iot/report", body);
  Serial.printf("[HTTP] Reporte -> %s\n", ok ? "OK" : "FALLO");
  if (!ok) queueReportPayload(body);
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== RiegoIQ - ESP32 SUPERIOR ===");

  preferences.begin("riegoiq", false);
  loadQueueMeta();

  for (int i = 0; i < 5; i++) {
    pinMode(PIN_RELE[i], OUTPUT);
    digitalWrite(PIN_RELE[i], HIGH);
  }

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  TOPIC_CMD = "riegoiq/" + String(SECTOR) + "/valve/command";
  TOPIC_REPORT = "riegoiq/" + String(SECTOR) + "/report";
  TOPIC_HEARTBEAT = "riegoiq/" + String(SECTOR) + "/heartbeat";

  conectarWiFi();
  conectarMQTT();
  enviarHeartbeatHTTP();
  consultarValvulasHTTP();
  flushQueuedReports();

  Serial.println("=== Sistema listo ===");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) conectarWiFi();
  if (mqttClient.connected()) mqttClient.loop();
  else conectarMQTT();

  unsigned long ahora = millis();

  if (ahora - tSensor >= INTERVALO_SENSOR) {
    tSensor = ahora;

    bool haySensores = false;
    for (int i = 0; i < 5; i++) {
      int humedad = leerHumedad(PIN_SENSOR[i]);
      ultimaHumedad[i] = humedad;

      if (humedad == -1) {
        Serial.printf("[SENSOR] S%d -> sin sensor fisico\n", i + 1);
      } else {
        haySensores = true;
        Serial.printf("[SENSOR] S%d -> %3d%% | V%d: %s\n", i + 1, humedad, i + 1, relActivo[i] ? "ABIERTA" : "CERRADA");
      }
    }

    if (haySensores) {
      if (mqttClient.connected()) {
        StaticJsonDocument<512> doc;
        doc["sector"] = SECTOR;
        doc["deviceId"] = DEVICE_ID;
        JsonArray readings = doc.createNestedArray("readings");

        for (int i = 0; i < 5; i++) {
          if (ultimaHumedad[i] < 0) continue;
          JsonObject reading = readings.createNestedObject();
          reading["valve"] = i + 1;
          reading["valveNumber"] = i + 1;
          reading["humidity"] = ultimaHumedad[i];
        }

        char msg[512];
        serializeJson(doc, msg);
        bool ok = mqttClient.publish(TOPIC_REPORT.c_str(), msg);
        Serial.printf("[MQTT] Reporte -> %s\n", ok ? "OK" : "FALLO");
        if (!ok) enviarReporteHTTP();
      } else {
        enviarReporteHTTP();
      }
    } else {
      Serial.println("[INFO] Sin sensores fisicos - no se reporta humedad");
    }
  }

  if (ahora - tValvulas >= INTERVALO_VALVULAS) {
    tValvulas = ahora;
    consultarValvulasHTTP();
  }

  if (ahora - tHeartbeat >= INTERVALO_HEARTBEAT) {
    tHeartbeat = ahora;

    if (mqttClient.connected()) {
      String hb = "{\"deviceId\":\"" + String(DEVICE_ID) +
                  "\",\"sector\":\"" + String(SECTOR) +
                  "\",\"rssi\":" + String(WiFi.RSSI()) + "}";
      mqttClient.publish(TOPIC_HEARTBEAT.c_str(), hb.c_str());
    }

    enviarHeartbeatHTTP();
    flushQueuedReports();
    Serial.printf("[SYS] RAM: %d | RSSI: %d | MQTT: %s | Cola: %u\n",
      ESP.getFreeHeap(),
      WiFi.RSSI(),
      mqttClient.connected() ? "OK" : "NO",
      pendingCount
    );
  }
}
