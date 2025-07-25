import * as chat from '@botpress/chat'

let client = null

export const initializeClient = async () => {
  const apiUrl = `https://chat.botpress.cloud/017ee4ff-94e1-411a-877b-0a3b34372ef1`
  client = await chat.Client.connect({ apiUrl });
  return client;
};

export const createConversation = async () => {
    if (!client) throw new Error("Client not initialized. Call initializeClient first.");
    
    try {
      const { conversation } = await client.createConversation({});
      console.log("Created conversation:", conversation.id);
      return conversation.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
};

export const sendMessage = async (conversationId, messageText) => {
    if (!client) throw new Error('Client not initialized. Call initializeClient first.');
  
    try {
      await client.createMessage({
        conversationId,
        payload: {
          type: 'text',
          text: messageText,
        },
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
};
  

export const listenConversation = async (conversationId, onMessage) => {
    if (!client) throw new Error('Client not initialized. Call initializeClient first.');  
    const listener = await client.listenConversation({ id: conversationId });  
    listener.on("message_created", (event) => {
      if (event.userId !== client.user.id) {
        onMessage(event);
      }
    });  
    return listener;
};
  