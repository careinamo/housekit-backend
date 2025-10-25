import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const DEVICES_TABLE = process.env.DEVICES_TABLE;

// Inicializa cliente DynamoDB
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const createDevice = async (event) => {
    try {
        const VALID_API_KEY = "AIzaSyAYIWRC7ATpF6mkbFEKrY8EH_Vk4oMGtrY";

        // 🔍 Leer encabezado x-api-key del request
        const apiKey = event.headers?.["x-api-key"] || event.headers?.["X-Api-Key"];

        if (!apiKey || apiKey !== VALID_API_KEY) {
            return {
                statusCode: 401,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "Invalid API key.",
                }),
            };
        }

        // 📦 Parseamos el cuerpo recibido desde API Gateway
        const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        
        // Validar campos requeridos
        if (!body) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "El payload no puede estar vacío.",
                }),
            };
        }

        const { houseId, clientId, name, serviceType } = body;

        if (!houseId || typeof houseId !== "string") {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "El campo 'houseId' es requerido y debe ser un string.",
                }),
            };
        }

        if (!clientId || typeof clientId !== "string") {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "El campo 'clientId' es requerido y debe ser un string.",
                }),
            };
        }

        if (!name || typeof name !== "string") {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "El campo 'name' es requerido y debe ser un string.",
                }),
            };
        }

        if (!serviceType || typeof serviceType !== "string") {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "El campo 'serviceType' es requerido y debe ser un string.",
                }),
            };
        }

        // 🆔 Generar UUID único para el device
        const deviceId = uuidv4();

        // 📝 Preparar el item para DynamoDB
        const item = {
            PK: `house#${houseId}`,
            SK: `device#${deviceId}`,
            createdAt: new Date().toISOString(),
            name: name.trim(),
            available: false,
            serviceType: serviceType.trim(),
            userUsing: null,
            clientId: `client#${clientId}`
        };

        // 💾 Guardar en DynamoDB
        const params = {
            TableName: DEVICES_TABLE,
            Item: item,
            ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)" // Evitar sobrescribir si ya existe
        };

        await ddbDocClient.send(new PutCommand(params));

        // ✅ Respuesta exitosa
        return {
            statusCode: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: true,
                message: "Dispositivo creado exitosamente.",
                data: {
                    deviceId: deviceId,
                    houseId: houseId,
                    clientId: clientId,
                    name: item.name,
                    serviceType: item.serviceType,
                    available: item.available,
                    userUsing: item.userUsing,
                    createdAt: item.createdAt
                }
            }),
        };

    } catch (error) {
        console.error("Error al crear dispositivo:", error);

        // Manejar error de condición (item ya existe)
        if (error.name === "ConditionalCheckFailedException") {
            return {
                statusCode: 409,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "El dispositivo ya existe.",
                }),
            };
        }

        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: false,
                message: error.message,
                details: error.code || null,
            }),
        };
    }
};