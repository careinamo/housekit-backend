import axios from "axios";

export const updateDeviceStatus = async (event) => {
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
    // Parseamos el cuerpo recibido desde API Gateway
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    const { deviceId, switch: switchState } = body || {};

    if (!deviceId || typeof switchState !== "boolean") {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          message: 'El body debe incluir "deviceId" (string) y "switch" (boolean).',
        }),
      };
    }

    // Convertimos el booleano a "on"/"off"
    const switchValue = switchState ? "on" : "off";

    // Realizamos la llamada POST al endpoint
    const response = await axios({
      method: "post",
      url: "https://us-apia.coolkit.cc/v2/device/thing/status",
      headers: {
        "X-CK-Nonce": "Ukz3EWWf",
        "Authorization": "Bearer 329b368d0e99b969d5d71c4fe5c58216b2001ce3",
        "Content-Type": "application/json",
      },
      data: {
        type: 1,
        id: deviceId,
        params: {
          switches: [
            {
              switch: switchValue,
              outlet: 0,
            },
          ],
        },
      },
    });

    // Respuesta exitosa en formato JSON
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        sent: { deviceId, switch: switchValue },
        data: response.data,
      }),
    };
  } catch (error) {
    console.error("Error al llamar al endpoint:", error);

    return {
      statusCode: error.response?.status || 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        message: error.message,
        details: error.response?.data || null,
      }),
    };
  }
};
