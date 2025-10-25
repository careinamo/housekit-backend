import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;
const DEVICES_TABLE = process.env.DEVICES_TABLE;

// Inicializa cliente DynamoDB
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const getDevicesByUser = async (event) => {
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
        
        if (!body || !body.house || !body.user) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "Los campos 'house' y 'user' son requeridos en el body.",
                }),
            };
        }

        const { house, user } = body;

        if (typeof house !== "string" || typeof user !== "string") {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "Los campos 'house' y 'user' deben ser strings.",
                }),
            };
        }

        // 1️⃣ Obtener información del usuario desde la tabla users
        const getUserParams = {
            TableName: USERS_TABLE_NAME,
            Key: {
                PK: house,
                SK: user
            }
        };

        const userResult = await ddbDocClient.send(new GetCommand(getUserParams));

        if (!userResult.Item) {
            return {
                statusCode: 404,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: `Usuario '${user}' no encontrado en la casa '${house}'.`,
                }),
            };
        }

        const userData = userResult.Item;
        const userQuotes = userData.quotes || {};

        // 2️⃣ Obtener todos los dispositivos de la casa
        const getDevicesParams = {
            TableName: DEVICES_TABLE,
            KeyConditionExpression: "PK = :houseId AND begins_with(SK, :devicePrefix)",
            ExpressionAttributeValues: {
                ":houseId": house,
                ":devicePrefix": "device#"
            }
        };

        const devicesResult = await ddbDocClient.send(new QueryCommand(getDevicesParams));

        if (!devicesResult.Items || devicesResult.Items.length === 0) {
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: true,
                    message: "No hay dispositivos en esta casa.",
                    data: {
                        user: userData,
                        devices: []
                    }
                }),
            };
        }

        // 3️⃣ Agregar quotas del usuario a cada dispositivo
        const devicesWithQuotas = devicesResult.Items.map(device => {
            const serviceType = device.serviceType;
            const userQuotaForService = userQuotes[serviceType] || 0;

            return {
                ...device,
                quotasUser: userQuotaForService
            };
        });

        // ✅ Respuesta exitosa
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: true,
                message: "Dispositivos obtenidos exitosamente.",
                data: {
                    user: userData,
                    devices: devicesWithQuotas
                }
            }),
        };

    } catch (error) {
        console.error("Error al obtener dispositivos del usuario:", error);

        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: false,
                message: "Error interno del servidor.",
                error: error.message
            }),
        };
    }
};