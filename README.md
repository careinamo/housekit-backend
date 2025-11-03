<!--
title: 'HouseKit API - Serverless eWeLink Integration'
description: 'API serverless para gestión de casas, clientes, usuarios y dispositivos con integración a eWeLink'
layout: Doc
framework: v4
platform: AWS
language: nodeJS
authorLink: 'https://github.com/careinamo'
authorName: 'Christian Areinamo'
-->

# HouseKit API - Serverless Framework

API serverless construida con Node.js, AWS Lambda, API Gateway y DynamoDB usando Serverless Framework. Incluye integración con la API de eWeLink para gestión de dispositivos IoT.

## Características

- ✅ **Gestión de Clientes**: Crear y administrar clientes
- ✅ **Gestión de Casas**: Crear casas asociadas a clientes
- ✅ **Gestión de Usuarios**: Crear usuarios dentro de casas
- ✅ **Gestión de Dispositivos**: Crear dispositivos IoT en casas
- ✅ **Integración eWeLink**: Listar y controlar dispositivos eWeLink
- ✅ **Token Management**: Refresh automático de tokens de eWeLink
- ✅ **Autenticación**: API Key para todos los endpoints

## Arquitectura

### Tablas DynamoDB
- `housekit-table-{stage}`: Tokens de eWeLink
- `clients-housekit-table-{stage}`: Información de clientes
- `houses-housekit-table-{stage}`: Casas por cliente
- `users-housekit-table-{stage}`: Usuarios por casa
- `devices-housekit-table-{stage}`: Dispositivos por casa

## Deployment

```bash
serverless deploy --region us-east-1
```

## API Endpoints

### Autenticación
Todos los endpoints requieren el header:
```
x-api-key: AIzaSyAYIWRC7ATpF6mkbFEKrY8EH_Vk4oMGtrY
```

### 1. Hello World (Test)
```bash
curl -X GET https://YOUR-API-GATEWAY-URL/
```

**Respuesta:**
```json
{
  "message": "Go Serverless v4! Your function executed successfully!"
}
```

---

### 2. Crear Cliente

```bash
curl -X POST https://YOUR-API-GATEWAY-URL/createClient \
  -H "x-api-key: AIzaSyAYIWRC7ATpF6mkbFEKrY8EH_Vk4oMGtrY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+1234567890",
    "address": "123 Main St"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Cliente creado exitosamente.",
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "createdAt": "2025-10-25T10:30:00.000Z",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+1234567890",
    "address": "123 Main St"
  }
}
```

---

### 3. Crear Casa

```bash
curl -X POST https://YOUR-API-GATEWAY-URL/createHouse \
  -H "x-api-key: AIzaSyAYIWRC7ATpF6mkbFEKrY8EH_Vk4oMGtrY" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "houseName": "Casa Principal"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Casa creada exitosamente.",
  "data": {
    "houseId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "clientId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "houseName": "Casa Principal",
    "createdAt": "2025-10-25T10:30:00.000Z",
    "updatedAt": "2025-10-25T10:30:00.000Z"
  }
}
```

---

### 4. Crear Usuario

```bash
curl -X POST https://YOUR-API-GATEWAY-URL/createUser \
  -H "x-api-key: AIzaSyAYIWRC7ATpF6mkbFEKrY8EH_Vk4oMGtrY" \
  -H "Content-Type: application/json" \
  -d '{
    "houseId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "document": "ppt5492993",
    "name": "Christian Areinamo",
    "dateCut": 30
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario creado exitosamente.",
  "data": {
    "houseId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "document": "ppt5492993",
    "name": "Christian Areinamo",
    "dateCut": 30,
    "createdAt": "2025-10-25T10:30:00.000Z",
    "quotes": {
      "washing_machine": 4,
      "dryer_slots": 4
    },
    "penalties": {
      "washing_machine": 0,
      "dryer_slots": 0
    }
  }
}
```

---

### 5. Crear Dispositivo

```bash
curl -X POST https://YOUR-API-GATEWAY-URL/createDevice \
  -H "x-api-key: AIzaSyAYIWRC7ATpF6mkbFEKrY8EH_Vk4oMGtrY" \
  -H "Content-Type: application/json" \
  -d '{
    "houseId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "clientId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "lavadora izquierda",
    "serviceType": "washing_machine"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Dispositivo creado exitosamente.",
  "data": {
    "deviceId": "b1c2d3e4-f5g6-7890-abcd-ef1234567890",
    "houseId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "clientId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "lavadora izquierda",
    "serviceType": "washing_machine",
    "available": false,
    "userUsing": null,
    "createdAt": "2025-10-25T10:30:00.000Z"
  }
}
```

---

### 6. Listar Dispositivos eWeLink

```bash
curl -X GET https://YOUR-API-GATEWAY-URL/listDevices \
  -H "x-api-key: AIzaSyAYIWRC7ATpF6mkbFEKrY8EH_Vk4oMGtrY"
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "error": 0,
    "data": {
      "thingList": [
        {
          "thingid": "device123",
          "name": "Smart Switch",
          "devicekey": "abc123",
          "online": true
        }
      ]
    }
  }
}
```

---

### 7. Actualizar Estado de Dispositivo eWeLink

```bash
curl -X POST https://YOUR-API-GATEWAY-URL/updateDeviceStatus \
  -H "x-api-key: AIzaSyAYIWRC7ATpF6mkbFEKrY8EH_Vk4oMGtrY" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device123",
    "switch": true
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "sent": {
    "deviceId": "device123",
    "switch": "on"
  },
  "data": {
    "error": 0,
    "data": {}
  }
}
```

---

### 8. Obtener Usuario por Documento

```bash
curl -X GET https://YOUR-API-GATEWAY-URL/getUser/ppt5492993 \
  -H "x-api-key: AIzaSyAYIWRC7ATpF6mkbFEKrY8EH_Vk4oMGtrY"
```

**Respuesta (Usuario encontrado):**
```json
{
  "success": true,
  "message": "Usuario encontrado exitosamente.",
  "data": {
    "user": {
      "PK": "house#a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "SK": "user#ppt5492993",
      "createdAt": "2025-10-25T10:30:00.000Z",
      "name": "Christian Areinamo",
      "document": "ppt5492993",
      "dateCut": 30,
      "quotes": {
        "washing_machine": 4,
        "dryer_slots": 4
      },
      "penalties": {
        "washing_machine": 0,
        "dryer_slots": 0
      }
    },
    "totalHouses": 1,
    "allHouses": [
      // Array con todos los registros si el usuario está en múltiples casas
    ]
  }
}
```

**Respuesta (Usuario no encontrado):**
```json
{
  "success": false,
  "message": "Usuario con documento 'ppt5492993' no encontrado."
}
```

**Características especiales:**
- ⚡ **GSI Optimizado**: Utiliza el índice `SKIndex` para consultas O(1)
- 🏠 **Multi-casa**: Si el usuario está registrado en varias casas, retorna todos los registros
- 📊 **Estadísticas**: Incluye `totalHouses` para saber en cuántas casas está el usuario
- 📍 **Path Parameter**: El documento va directamente en la URL

## Arquitectura de Base de Datos

### 📊 Estructura de Tablas

El proyecto utiliza un diseño optimizado con **5 tablas DynamoDB independientes**, cada una con patrones de acceso específicos:

#### **1. Tabla Principal: `housekit-table-{stage}`**
```json
{
  "PK": "ewelinkToken#1",
  "SK": "ewelinkToken#1", 
  "data": {
    "accessToken": "bearer_token_here",
    "refreshToken": "refresh_token_here",
    "atExpiredTime": 1729123456789
  }
}
```
- **Propósito**: Almacenar tokens de eWeLink
- **Patrón**: Token management y refresh automático

#### **2. Tabla de Clientes: `clients-housekit-table-{stage}`**
```json
{
  "PK": "client#f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "createdAt": "2025-10-25T10:30:00.000Z",
  "updatedAt": "2025-10-25T10:30:00.000Z"
}
```
- **Patrón**: `client#{uuid}` solo en PK (sin Sort Key)
- **Entidad**: Cliente independiente

#### **3. Tabla de Casas: `houses-housekit-table-{stage}`**
```json
{
  "PK": "client#f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "SK": "house#a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "houseId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "houseName": "Casa Principal",
  "createdAt": "2025-10-25T10:30:00.000Z",
  "updatedAt": "2025-10-25T10:30:00.000Z"
}
```
- **Patrón**: PK = `client#{clientId}`, SK = `house#{houseId}`
- **Relación**: Casas pertenecen a clientes (1:N)

#### **4. Tabla de Usuarios: `users-housekit-table-{stage}`**
```json
{
  "PK": "house#a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "SK": "user#ppt5492993",
  "createdAt": "2025-10-25T10:30:00.000Z",
  "name": "Christian Areinamo",
  "document": "ppt5492993",
  "dateCut": 30,
  "quotes": {
    "washing_machine": 4,
    "dryer_slots": 4
  },
  "penalties": {
    "washing_machine": 0,
    "dryer_slots": 0
  }
}
```
- **Patrón**: PK = `house#{houseId}`, SK = `user#{document}`
- **Relación**: Usuarios pertenecen a casas (1:N)

#### **5. Tabla de Dispositivos: `devices-housekit-table-{stage}`**
```json
{
  "PK": "house#a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "SK": "device#b1c2d3e4-f5g6-7890-abcd-ef1234567890",
  "createdAt": "2025-10-25T10:30:00.000Z",
  "name": "lavadora izquierda",
  "available": false,
  "serviceType": "washing_machine",
  "userUsing": null,
  "clientId": "client#f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```
- **Patrón**: PK = `house#{houseId}`, SK = `device#{deviceId}`
- **Relación**: Dispositivos pertenecen a casas (1:N)

### 🔗 Modelo de Relaciones

```
Cliente (1) ──┐
              ├─── Casa (N) ──┐
              │               ├─── Usuario (N)
              │               └─── Dispositivo (N)
              └─── Casa (N) ──┐
                              ├─── Usuario (N)
                              └─── Dispositivo (N)
```

### 📈 Patrones de Acceso Optimizados

#### **Consultas por Cliente:**
```javascript
// Obtener todas las casas de un cliente
const params = {
  TableName: "houses-housekit-table-dev",
  KeyConditionExpression: "PK = :clientId",
  ExpressionAttributeValues: {
    ":clientId": "client#f47ac10b-58cc-4372-a567-0e02b2c3d479"
  }
};
```

#### **Consultas por Casa:**
```javascript
// Obtener todos los usuarios y dispositivos de una casa
const params = {
  TableName: "users-housekit-table-dev", // o devices-housekit-table-dev
  KeyConditionExpression: "PK = :houseId",
  ExpressionAttributeValues: {
    ":houseId": "house#a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
};

// Solo usuarios de una casa
const paramsUsers = {
  TableName: "users-housekit-table-dev",
  KeyConditionExpression: "PK = :houseId AND begins_with(SK, :prefix)",
  ExpressionAttributeValues: {
    ":houseId": "house#a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    ":prefix": "user#"
  }
};

// Solo dispositivos de una casa
const paramsDevices = {
  TableName: "devices-housekit-table-dev",
  KeyConditionExpression: "PK = :houseId AND begins_with(SK, :prefix)",
  ExpressionAttributeValues: {
    ":houseId": "house#a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    ":prefix": "device#"
  }
};
```

#### **Consultas por Tipo de Servicio:**
```javascript
// Todos los dispositivos de lavado
const params = {
  TableName: "devices-housekit-table-dev",
  FilterExpression: "serviceType = :serviceType",
  ExpressionAttributeValues: {
    ":serviceType": "washing_machine"
  }
};
```

### ✅ Fortalezas del Diseño

1. **🚀 Escalabilidad**: Excelente distribución de datos entre particiones
2. **⚡ Consultas eficientes**: Patrones de acceso bien definidos sin hot partitions
3. **🔗 Jerarquía clara**: Cliente → Casa → Usuario/Dispositivo
4. **🔧 Flexibilidad**: Fácil agregar nuevos tipos de entidades
5. **📊 Consistencia**: Uso consistente de prefijos (`client#`, `house#`, `user#`, `device#`)
6. **🆔 Identificadores únicos**: UUID para evitar colisiones
7. **🔄 Referencias cruzadas**: Campo `clientId` en dispositivos para consultas adicionales
8. **⏰ Timestamps**: `createdAt` y `updatedAt` consistentes en todas las entidades

### 🎯 Casos de Uso Optimizados

- **Dashboard por cliente**: Una sola query obtiene todas sus casas
- **Vista de casa específica**: Una query obtiene usuarios y dispositivos
- **Gestión de cuotas**: Acceso directo por `house#{id}` y `user#{document}`
- **Control de dispositivos**: Acceso directo por `house#{id}` y `device#{id}`
- **Reportes por tipo**: Filtros eficientes por `serviceType`

## Funciones Automáticas

- **refreshToken**: Se ejecuta cada 5 minutos para refrescar tokens de eWeLink automáticamente

## Manejo de Errores

Todos los endpoints manejan errores estándar:

- **401**: API Key inválida
- **400**: Datos de entrada inválidos
- **409**: Recurso ya existe
- **500**: Error interno del servidor

## Desarrollo Local

```bash
serverless dev
```

## Variables de Entorno

- `UNIQUE_TABLE`: Tabla principal de tokens
- `CLIENTS_TABLE`: Tabla de clientes
- `HOUSES_TABLE`: Tabla de casas
- `USERS_TABLE_NAME`: Tabla de usuarios
- `DEVICES_TABLE`: Tabla de dispositivos
- `SERVICES_TABLE`: Tabla de servicios

---

## 🆕 Sistema de Servicios

### 9. Solicitar Servicio (Reservar Dispositivo)

Este endpoint permite que un usuario reserve un dispositivo para usar por 1.5 horas. Incluye validación de disponibilidad, manejo de cuotas y programación automática de finalización.

```bash
curl -X POST https://YOUR-API-GATEWAY-URL/requestService \
  -H "x-api-key: AIzaSyAYIWRC7ATpF6mkbFEKrY8EH_Vk4oMGtrY" \
  -H "Content-Type: application/json" \
  -d '{
    "house": "house#a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "device": "device#b1c2d3e4-f5g6-7890-abcd-ef1234567890", 
    "user": "user#12345678"
  }'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Servicio reservado exitosamente.",
  "data": {
    "device": "device#b1c2d3e4-f5g6-7890-abcd-ef1234567890",
    "user": "user#12345678",
    "house": "house#a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "reservedAt": "2025-10-25T14:30:00.000Z",
    "scheduledFinishAt": "2025-10-25T16:00:00.000Z",
    "userQuotaRemaining": 4,
    "eventScheduled": true
  }
}
```

**Errores posibles:**
- **400**: Dispositivo no disponible
- **400**: Usuario sin cuotas suficientes
- **404**: Dispositivo o usuario no encontrado

### 10. Finalizar Servicio (Automático)

Esta función se ejecuta automáticamente 1.5 horas después de reservar un servicio. Libera el dispositivo y marca el servicio como finalizado.

> **Nota**: Esta función es invocada automáticamente por EventBridge. No requiere llamada manual.

**Proceso automático:**
1. ⏰ EventBridge programa la ejecución 1.5 horas después
2. 🔄 Lambda libera el dispositivo (userUsing = null)
3. 📝 Marca el servicio como finalizado (finishedAt)

---

## 📊 Estructura de Datos Completa

### 📋 Tablas DynamoDB

#### 1. **clients-housekit-table**
```
PK: client#{clientId}
SK: METADATA
Attributes: name, email, phone, address, createdAt
```

#### 2. **houses-housekit-table**
```
PK: house#{houseId}  
SK: client#{clientId}
Attributes: address, name, clientId, createdAt
```

#### 3. **users-housekit-table**
```
PK: house#{houseId}
SK: user#{document}
Attributes: name, document, phoneNumber, quota{totalQuota, usedQuota, penalties}, createdAt
GSI: SKIndex (SK as PK, PK as SK)
```

#### 4. **devices-housekit-table**
```
PK: house#{houseId}
SK: device#{deviceId}
Attributes: clientId, name, serviceType, available, userUsing, createdAt
GSI: SKIndex (SK as PK, PK as SK)
```

#### 5. **services-housekit-table** 🆕
```
PK: device#{deviceId}
SK: user#{document}
Attributes: house, reservedAt, scheduledFinishAt, finishedAt
GSI: SKIndex (SK as PK, PK as SK)
```

---

## 🔄 Flujo de Servicios

### 📝 Proceso de Reserva
1. **Validación**: Verifica que el dispositivo esté disponible
2. **Cuotas**: Verifica que el usuario tenga cuotas disponibles
3. **Reserva**: Asigna el dispositivo al usuario
4. **Descuento**: Reduce las cuotas del usuario en 1
5. **Registro**: Crea el registro del servicio
6. **Programación**: Programa la finalización automática en 1.5 horas

### ⏰ Finalización Automática
1. **EventBridge**: Ejecuta lambda después de 1.5 horas
2. **Liberación**: Marca dispositivo como disponible
3. **Finalización**: Registra hora de finalización del servicio

---

## 🏗️ Arquitectura del Sistema

### 🛠️ Componentes Principales
- **AWS Lambda**: 11 funciones serverless
- **DynamoDB**: 5 tablas con GSI para consultas eficientes  
- **EventBridge**: Programación automática de tareas
- **API Gateway**: 9 endpoints HTTP
- **Serverless Framework**: Infraestructura como código

### 🔄 Patrones de Acceso
- **Single Table Design**: Optimizado para consultas relacionales
- **Global Secondary Index**: Consultas inversas eficientes
- **Event-Driven**: Automatización con EventBridge
- **ACID Operations**: Operaciones atómicas en DynamoDB
