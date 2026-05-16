import axios from "axios";

const FLINKU_API_URL = process.env.FLINKU_API_URL || "https://flku.dev/api/links";
const FLINKU_API_KEY = process.env.FLINKU_API_KEY;

export const createFlinkuLink = async ({ title, deepLink, params }) => {
  if (!FLINKU_API_KEY) {
    throw new Error("Flinku API key is not configured");
  }

  const payload = {
    title,
    deepLink,
  };

  if (params && Object.keys(params).length > 0) {
    payload.params = params;
  }

  const response = await axios.post(FLINKU_API_URL, payload, {
    headers: {
      Authorization: `Bearer ${FLINKU_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
};
