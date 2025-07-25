const sendLiveAgentNotification = require('../services/liveAgentEmailService');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');

const generateChatLink = () => {
  const frontendBaseUrl = process.env.FRONTEND_BASE_URL;
  return `${frontendBaseUrl}/agent/chat`;
};

exports.requestLiveAgent = catchAsyncErrors(async (req, res, next) => {
  const { userMessage } = req.body;
  const chatLink = generateChatLink();

  if (!userMessage) {
    return res.status(400).json({
      success: false,
      message: "Message is required to request a live agent.",
    });
  }

  const result = await sendLiveAgentNotification(userMessage, chatLink);

  if (result.success) {
    res.status(200).json({
      success: true,
      message: "Your request has been sent to a live agent.",
    });
  } else {
    res.status(500).json({
      success: false,
      message: "There was an error sending your request. Please try again later.",
    });
  }
});
