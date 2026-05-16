import axios from "axios";

const FLINKU_API_URL = process.env.FLINKU_API_URL || "https://flku.dev/api/links";
const FLINKU_API_KEY = process.env.FLINKU_API_KEY;
const ANDROID_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.facultypedia.app";

export const createFlinkuLink = async ({ title, deepLink, params }) => {
  if (!FLINKU_API_KEY) {
    throw new Error("Flinku API key is not configured");
  }

  const payload = {
    title,
    deepLink,
    desktopUrl: ANDROID_PLAY_STORE_URL,
  };

  if (params && Object.keys(params).length > 0) {
    payload.params = params;
  }

  try {
    const response = await axios.post(FLINKU_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${FLINKU_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (err) {
    const status = err?.response?.status;
    const body = err?.response?.data;
    console.error(
      `[Flinku] link creation failed — status=${status}`,
      JSON.stringify(body ?? err?.message)
    );
    throw err;
  }
};
