CREATE TABLE `whatsapp_configs` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `barbershopId` int NOT NULL UNIQUE,
  `provider` enum('whatsapp_business','twilio') NOT NULL DEFAULT 'whatsapp_business',
  `phoneNumber` varchar(20) NOT NULL,
  `phoneNumberId` varchar(100),
  `apiKey` varchar(255),
  `twilioAccountSid` varchar(255),
  `twilioAuthToken` varchar(255),
  `twilioWhatsappNumber` varchar(20),
  `enabled` boolean NOT NULL DEFAULT false,
  `sendConfirmation` boolean NOT NULL DEFAULT true,
  `sendReminder` boolean NOT NULL DEFAULT true,
  `reminderMinutesBefore` int NOT NULL DEFAULT 60,
  `confirmationMessage` text,
  `reminderMessage` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
