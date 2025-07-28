import API from "./API"


/**
 * Service for handling chat-related API calls
 */

export const fetchUserData = async (userId) => {
  try {
    const response = await API.get(`/api/v1/users/fetchRegUserById/${userId}`);
    return response.data.user;
  } catch (error) {
    throw new Error("Failed to fetch user data");
  }
};


export const sendChatMessage = async (chatId, message) => {
  try {
    const response = await API.post("/api/v1/chats/createOrAppendChat", {
      chatId,
      sender: "user",
      content: message,
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to send chat message");
  }
};


export const requestLiveAgent = async (userDetails) => {
  try {
    const response = await API.post("/api/v1/liveAgent/request", {
      userMessage: `Name: ${userDetails.fullName}\nEmail: ${userDetails.email}\nPhone: ${userDetails.phoneNumber}`,
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to request live agent");
  }
};
