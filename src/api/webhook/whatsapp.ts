// src/api/webhook/whatsapp.ts
import { Request, Response } from 'express';

// Simulated WhatsApp Webhook for receiving base64 files (.las/.segy) and passing to the Queue Manager
export const whatsappWebhookHandler = async (req: Request, res: Response) => {
  try {
    const { sender, fileName, fileData, mimeType } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'Missing required fields: fileName or fileData' });
    }

    console.log(`[Webhook] Incoming file from ${sender || 'Unknown'}: ${fileName}`);

    // In a real environment, we would decode the base64, save to a tmp dir, 
    // and push to a message queue (like RabbitMQ) or the useApiQueue state.
    // Since this is the Node backend, we'll respond with a success flag that 
    // the frontend can poll, or use WebSockets/SSE to notify the frontend.
    
    // For now, return a standardized success payload
    return res.status(200).json({
      success: true,
      data: {
        id: Math.random().toString(36).substring(7),
        status: 'queued',
        fileName,
        processedAt: new Date().toISOString()
      },
      message: 'File successfully ingested from WhatsApp via n8n integration.'
    });

  } catch (error) {
    console.error('[Webhook] Error processing WhatsApp data:', error);
    return res.status(500).json({ error: 'Internal server error processing webhook' });
  }
};
