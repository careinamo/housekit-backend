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

## Estructura de Datos en DynamoDB

### Clientes
```json
{
  "PK": "client#f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "createdAt": "2025-10-25T10:30:00.000Z"
}
```

### Casas
```json
{
  "PK": "client#f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "SK": "house#a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "houseId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "houseName": "Casa Principal",
  "createdAt": "2025-10-25T10:30:00.000Z"
}
```

### Usuarios
```json
{
  "PK": "house#a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "SK": "user#ppt5492993",
  "name": "Christian Areinamo",
  "document": "ppt5492993",
  "dateCut": 30,
  "quotes": { "washing_machine": 4, "dryer_slots": 4 },
  "penalties": { "washing_machine": 0, "dryer_slots": 0 }
}
```

### Dispositivos
```json
{
  "PK": "house#a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "SK": "device#b1c2d3e4-f5g6-7890-abcd-ef1234567890",
  "name": "lavadora izquierda",
  "serviceType": "washing_machine",
  "available": false,
  "userUsing": null,
  "clientId": "client#f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

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
