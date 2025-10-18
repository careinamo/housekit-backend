import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const UNIQUE_TABLE = process.env.UNIQUE_TABLE;

// Inicializa cliente DynamoDB
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const createClient = async (event) => {
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
        
        if (!body || Object.keys(body).length === 0) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "El payload no puede estar vacío.",
                }),
            };
        }

        // 🆔 Generar UUID único
        const uniqueId = uuidv4();

        // 📝 Preparar el item para DynamoDB
        const item = {
            PK: `client#${uniqueId}`,
            SK: `client#${uniqueId}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...body // Spread del resto de información del payload
        };

        // 💾 Guardar en DynamoDB
        const params = {
            TableName: UNIQUE_TABLE,
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
                message: "Cliente creado exitosamente.",
                data: {
                    id: uniqueId,
                    createdAt: item.createdAt,
                    ...body
                }
            }),
        };

    } catch (error) {
        console.error("Error al crear cliente:", error);

        // Manejar error de condición (item ya existe)
        if (error.name === "ConditionalCheckFailedException") {
            return {
                statusCode: 409,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "El cliente ya existe.",
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
