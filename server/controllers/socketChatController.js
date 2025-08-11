//server/controllers/socketChatController.js
const ChatSessionController = require('./chatSessionController');
const ChatMessageController = require('./chatMessageController');
const businessHoursAdapter = require('../services/businessHoursAdapter');
const { json } = require('body-parser');

class SocketChatController { 
    static async addChatSessionSocket({ user, payload }) { 
        const businessHours = await businessHoursAdapter.getActive();
        const detailedStatus = await businessHoursAdapter.getDetailedStatus();
        const isBusinessHours = !!(detailedStatus && detailedStatus.isOpen);

        const fakeReq = {
        body: payload,
        user: user || {},
        businessHours,
        businessHoursStatus: detailedStatus,
        isBusinessHours
        };

        let out = null;
        const fakeRes = {
        status(code) { this.code = code; return this; },
        json(obj) { out = { code: this.code || 200, body: obj }; }
        };

        await ChatSessionController.createChatSession(fakeReq, fakeRes);
        return out;
    };

    static async requestAgentSocket({ user, sessionId, payload = {} }) {
        const businessHours = await businessHoursAdapter.getActive();
        const detailedStatus = await businessHoursAdapter.getDetailedStatus();
        const isBusinessHours = !!(detailedStatus && detailedStatus.isOpen);

        const tmpReq = {
            params: { sessionId },
            body: payload,
            user,
            businessHours,
            businessHoursStatus: detailedStatus,
            isBusinessHours
        };
        let out = null;
        const tmpReqs = {
            status(code) { this.code = code; return this },
            json(obj) { out = { code: this.code || 200, body: obj }; }
        };
        await ChatSessionController.requestAgent(tmpReq, tmpReqs);
        return out;
    }
    static async transferSessionSocket({ user, sessionId, payload = {} }) {
        const businessHours = await businessHoursAdapter.getActive();
        const detailedStatus = await businessHoursAdapter.getDetailedStatus();
        const isBusinessHours = !!(detailedStatus && detailedStatus.isOpen);

        const tmpReq = {
            params: { sessionId },
            body: payload,
            user,
            businessHours,
            businessHoursStatus: detailedStatus,
            isBusinessHours
        };
        let out = null;
        const tmpReqs = {
            status(code) { this.code = code; return this; },
            json(obj) { out = { code: this.code || 200, bodu: obj }; }
        };
        await ChatSessionController.transferSession(tmpReq, tmpReqs);
        return out;
    }
    static async sendMessageSocket({ user, payload }) 
    {
        const businessHours = await businessHoursAdapter.getActive();
        const detailedStatus = await businessHoursAdapter.getDetailedStatus();
        const isBusinessHours = !!(detailedStatus && detailedStatus.isOpen);

        const tmpReq = {
            body: payload,
            user,
            businessHours,
            businessHoursStatus: detailedStatus,
            isBusinessHours
        };
        let out = null;
        const tmpReqs = {
            status(code) { this.code; return this },
            json(obj) { out = { code: this.code || 200, body: obj }; }
        };
        await ChatMessageController.sendMessage(tmpReq, tmpReqs);
        return out;
    }

    static async sendBotMessageSocket({ sessionId, messageData })
    {
        const result = await ChatMessageController.sendBotMessage(sessionId, messageData);
        return result;
    }
};
module.exports = SocketChatController;
