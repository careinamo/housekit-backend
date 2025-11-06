import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const SERVICES_TABLE = process.env.SERVICES_TABLE;

// Inicializa cliente DynamoDB
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const getServicesByUser = async (event) => {
    try {
        console.log("Event received:", JSON.stringify(event, null, 2));

        // 📦 Parseamos el cuerpo recibido desde API Gateway
        const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        
        if (!body || !body.user) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "El campo 'user' es requerido.",
                }),
            };
        }

        const { user, limit = 10 } = body;

        console.log(`Obteniendo servicios para usuario: ${user}`);

        // 🔍 Consultar servicios usando el GSI UserIndex
        const queryParams = {
            TableName: SERVICES_TABLE,
            IndexName: "UserIndex",
            KeyConditionExpression: "#user = :user",
            ExpressionAttributeNames: {
                "#user": "user"
            },
            ExpressionAttributeValues: {
                ":user": user
            },
            ScanIndexForward: false, // Ordenar por timestamp descendente (más recientes primero)
            Limit: limit
        };

        const result = await ddbDocClient.send(new QueryCommand(queryParams));

        console.log(`Encontrados ${result.Items.length} servicios para el usuario`);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: true,
                message: "Servicios obtenidos exitosamente.",
                data: {
                    services: result.Items,
                    count: result.Items.length,
                    lastEvaluatedKey: result.LastEvaluatedKey
                }
            }),
        };

    } catch (error) {
        console.error("Error al obtener servicios del usuario:", error);

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