ALTER TABLE `whatsapp_configs` ADD `provider` enum('whatsapp_business','twilio') DEFAULT 'whatsapp_business' NOT NULL;--> statement-breakpoint
ALTER TABLE `whatsapp_configs` ADD `twilioAccountSid` varchar(255);--> statement-breakpoint
ALTER TABLE `whatsapp_configs` ADD `twilioAuthToken` varchar(255);--> statement-breakpoint
ALTER TABLE `whatsapp_configs` ADD `twilioWhatsappNumber` varchar(20);