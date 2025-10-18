import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const HOUSES_TABLE = process.env.HOUSES_TABLE;

// Inicializa cliente DynamoDB
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const createHouse = async (event) => {
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
        
        if (!body || !body.houseName || typeof body.houseName !== "string") {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "El campo 'houseName' es requerido y debe ser un string.",
                }),
            };
        }

        if (!body.clientId || typeof body.clientId !== "string") {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "El campo 'clientId' es requerido y debe ser un string.",
                }),
            };
        }

        // 🆔 Generar UUID único para la casa
        const uniqueId = uuidv4();

        // 📝 Preparar el item para DynamoDB
        const item = {
            PK: `client#${body.clientId}`,
            SK: `house#${uniqueId}`,
            houseName: body.houseName.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // 💾 Guardar en DynamoDB
        const params = {
            TableName: HOUSES_TABLE,
            Item: item,
            ConditionExpression: "attribute_not_exists(PK)" // Evitar sobrescribir si ya existe
        };

        await ddbDocClient.send(new PutCommand(params));

        // ✅ Respuesta exitosa
        return {
            statusCode: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: true,
                message: "Casa creada exitosamente.",
                data: {
                    id: uniqueId,
                    houseName: item.houseName,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
                }
            }),
        };

    } catch (error) {
        console.error("Error al crear casa:", error);

        // Manejar error de condición (item ya existe)
        if (error.name === "ConditionalCheckFailedException") {
            return {
                statusCode: 409,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "La casa ya existe.",
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
