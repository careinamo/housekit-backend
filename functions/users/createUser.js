import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;

// Inicializa cliente DynamoDB
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const createUser = async (event) => {
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

        const { houseId, document, name, dateCut } = body;

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

        if (!document || typeof document !== "string") {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "El campo 'document' es requerido y debe ser un string.",
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

        if (!dateCut || typeof dateCut !== "number" || dateCut < 1 || dateCut > 31) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "El campo 'dateCut' es requerido y debe ser un número entre 1 y 31.",
                }),
            };
        }

        // 📝 Preparar el item para DynamoDB
        const item = {
            PK: `house#${houseId}`,
            SK: `user#${document}`,
            createdAt: new Date().toISOString(),
            name: name.trim(),
            quotes: {
                washing_machine: 4,
                dryer_slots: 4
            },
            dateCut: dateCut,
            penalties: {
                washing_machine: 0,
                dryer_slots: 0
            },
            document: document.trim()
        };

        // 💾 Guardar en DynamoDB
        const params = {
            TableName: USERS_TABLE_NAME,
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
                message: "Usuario creado exitosamente.",
                data: {
                    houseId: houseId,
                    document: item.document,
                    name: item.name,
                    dateCut: item.dateCut,
                    createdAt: item.createdAt,
                    quotes: item.quotes,
                    penalties: item.penalties
                }
            }),
        };

    } catch (error) {
        console.error("Error al crear usuario:", error);

        // Manejar error de condición (item ya existe)
        if (error.name === "ConditionalCheckFailedException") {
            return {
                statusCode: 409,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "El usuario ya existe en esta casa.",
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
