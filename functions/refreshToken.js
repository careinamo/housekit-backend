import axios from "axios";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
const UNIQUE_TABLE = process.env.UNIQUE_TABLE;

// 🔹 Inicializar cliente DynamoDB v3
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const refreshToken = async () => {
  try {
    // 1️⃣ Leer el registro desde DynamoDB
    const getParams = {
      TableName: UNIQUE_TABLE,
      Key: { PK: "ewelinkToken#1", SK: "ewelinkToken#1" },
    };

    const { Item } = await docClient.send(new GetCommand(getParams));

    if (!Item) {
      console.error("❌ No se encontró el registro con PK ewelinkToken#1");
      return;
    }

    const now = Date.now();
    const timeToExpire = Item.data.atExpiredTime - now;
    const minutesLeft = timeToExpire / 60000;

    console.log(`⏱ Tiempo restante para expirar: ${minutesLeft.toFixed(2)} minutos, Item.data.atExpiredTime: ${Item.data.atExpiredTime} now: ${now}`);

    // 2️⃣ Verificar si está a menos de 10 minutos de expirar
    if (minutesLeft > 10) {
      console.log("✅ El token aún es válido, no se necesita refrescar.");
      return;
    }

    console.log("🔁 Token por expirar, solicitando refresh a eWeLink...");

    // // 3️⃣ Llamar al endpoint de refresh con Axios
    // const axiosResponse = await axios.post(
    //   "https://us-apia.coolkit.cc/v2/user/refresh",
    //   { rt: Item.data.refreshToken },
    //   {
    //     headers: {
    //       "X-CK-Appid": "ayOFb61oWpDB5n4QPCtMZlKsxB1fhljF",
    //       "X-CK-Nonce": "NgLdrCjP",
    //       Authorization: "Sign sfBFcARVmhyrPrgSI5Ow9ugkXbbAF4QN9lxusm90aPI=",
    //       "Content-Type": "application/json",
    //     },
    //     timeout: 8000,
    //   }
    // );

    // const data = axiosResponse.data;
    // console.log("📡 Respuesta del refresh:", data);

    // if (data.error !== 0 || !data.data) {
    //   console.error("❌ Error al refrescar el token:", data);
    //   return;
    // }

    // // 4️⃣ Calcular nuevo timestamp de expiración (+3 horas)
    // const threeHoursLater = Date.now() + 3 * 60 * 60 * 1000;

    // // 5️⃣ Actualizar DynamoDB con los nuevos tokens
    // const updateParams = {
    //   TableName: TABLE_NAME,
    //   Key: { PK: "ewelinkToken#1", SK: "ewelinkToken#1" },
    //   UpdateExpression: `
    //     SET 
    //       #data.#accessToken = :newAt,
    //       #data.#refreshToken = :newRt,
    //       #data.#atExpiredTime = :newExp
    //   `,
    //   ExpressionAttributeNames: {
    //     "#data": "data",
    //     "#accessToken": "accessToken",
    //     "#refreshToken": "refreshToken",
    //     "#atExpiredTime": "atExpiredTime",
    //   },
    //   ExpressionAttributeValues: {
    //     ":newAt": data.data.at,
    //     ":newRt": data.data.rt,
    //     ":newExp": threeHoursLater,
    //   },
    // };

    // await docClient.send(new UpdateCommand(updateParams));

    // console.log("✅ Token actualizado correctamente en DynamoDB");

    return {
      statusCode: 200,
      body: JSON.stringify({ message: Item.data.atExpiredTime , "now": now}),
    };
  } catch (err) {
    console.error("💥 Error ejecutando la función:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error al procesar la tarea" }),
    };
  }
};
